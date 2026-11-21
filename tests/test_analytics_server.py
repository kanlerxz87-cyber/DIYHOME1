"""Smoke tests for analytics-server/server.mjs (canonical 5-event contract).

Starts the Node endpoint on an ephemeral port with a temp NDJSON log and
verifies it accepts exactly the payload shape assets/js/site.js sends
({e, ts, path, sid, site, ...}), rejects the retired archived-edition
shape, and strips non-allowlisted fields before storage.
"""

import json
import os
import socket
import subprocess
import tempfile
import time
import unittest
import urllib.error
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SERVER = REPO_ROOT / "analytics-server" / "server.mjs"

CANONICAL_EVENTS = {"page_view", "disclosure_view", "outbound_click", "site_search", "guide_read"}


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def request(port, method, path, payload=None):
    url = f"http://127.0.0.1:{port}{path}"
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status, json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as err:
        return err.code, json.loads(err.read().decode() or "{}")


class TestAnalyticsServer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.log = Path(cls.tmp.name) / "events.ndjson"
        cls.port = free_port()
        env = dict(os.environ, PORT=str(cls.port), HOST="127.0.0.1", ANALYTICS_LOG=str(cls.log))
        cls.proc = subprocess.Popen(
            ["node", str(SERVER)], env=env,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
        )
        deadline = time.time() + 15
        while time.time() < deadline:
            try:
                status, _ = request(cls.port, "GET", "/api/health")
                if status == 200:
                    return
            except Exception:
                pass
            time.sleep(0.2)
        raise RuntimeError("analytics server did not start")

    @classmethod
    def tearDownClass(cls):
        cls.proc.terminate()
        try:
            cls.proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            cls.proc.kill()
        cls.tmp.cleanup()

    def test_health_lists_canonical_events(self):
        status, body = request(self.port, "GET", "/api/health")
        self.assertEqual(status, 200)
        self.assertEqual(set(body["allowed_events"]), CANONICAL_EVENTS)

    def test_site_js_payload_accepted_and_stripped(self):
        payload = {
            "e": "outbound_click", "ts": "2026-11-21T00:00:00.000Z",
            "path": "/products/", "sid": "s-test", "site": "diyhome1",
            "asin": "B08FKW9JRM", "link_kind": "product",
            # Non-allowlisted keys must never reach storage:
            "ip": "203.0.113.7", "email": "x@example.com", "user_agent": "curl",
        }
        status, body = request(self.port, "POST", "/collect", payload)
        self.assertEqual(status, 202)
        self.assertEqual(body["event"], "outbound_click")
        stored = json.loads(self.log.read_text().strip().splitlines()[-1])
        self.assertEqual(stored["asin"], "B08FKW9JRM")
        for forbidden in ("ip", "email", "user_agent", "userAgent"):
            self.assertNotIn(forbidden, stored)

    def test_alias_path_accepted(self):
        payload = {"e": "page_view", "ts": "2026-11-21T00:00:00.000Z",
                   "path": "/", "sid": "s-test", "site": "diyhome1",
                   "referrer_class": "direct"}
        status, _ = request(self.port, "POST", "/api/events", payload)
        self.assertEqual(status, 202)

    def test_retired_archived_shape_rejected(self):
        legacy = {"event": "product_impression", "page": "/",
                  "ts": "2026-11-21T00:00:00.000Z", "meta": {"asin": "B08FKW9JRM"}}
        status, _ = request(self.port, "POST", "/collect", legacy)
        self.assertEqual(status, 400)

    def test_unknown_event_rejected(self):
        status, _ = request(self.port, "POST", "/collect",
                            {"e": "made_up_event", "path": "/"})
        self.assertEqual(status, 400)

    def test_summary_counts(self):
        status, body = request(self.port, "GET", "/api/summary")
        self.assertEqual(status, 200)
        self.assertEqual(set(body["counts"]), CANONICAL_EVENTS)
        self.assertGreaterEqual(body["counts"]["outbound_click"], 1)
        self.assertGreaterEqual(body["counts"]["page_view"], 1)


if __name__ == "__main__":
    unittest.main()
