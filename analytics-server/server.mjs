#!/usr/bin/env node
/**
 * Self-hosted, privacy-preserving analytics endpoint for DIY Home Upgrades.
 *
 * Accepts the five canonical events defined in data/events.json — the same
 * contract implemented by worker/collect.js (Cloudflare Worker) and emitted
 * by assets/js/site.js:
 *   page_view, disclosure_view, outbound_click, site_search, guide_read
 *
 * Payload shape (exactly what site.js sends):
 *   { e, ts, path, sid, site, ...per-event allowlist fields }
 *
 * Privacy posture, enforced here rather than promised:
 *  - the connecting IP is never read into storage;
 *  - no cookies, no user agent, no location, no persistent identifier;
 *  - only the per-event allowlist fields below are stored; every other
 *    key (including ip/email/cookie/user-agent if ever sent) is dropped;
 *  - bodies over 2048 bytes are rejected (same cap as worker/collect.js).
 *
 * This server is NOT deployed. Until an endpoint URL is set in
 * data/site.json -> analytics.endpoint and the site is rebuilt, no event
 * leaves the visitor's browser (see /flagged/#F05).
 *
 * NOTE (2026-11-21): an earlier version of this file accepted the archived
 * Field & Fixture edition's event names (product_impression,
 * outbound_affiliate_click, reader_capture_submit) with a different payload
 * shape ({event, page, meta}). That shape is incompatible with the live
 * site's site.js, which would have been rejected with 400 on every event.
 * The archived edition under archive/field-and-fixture/ is preserved as-is
 * (noindex); this endpoint now implements the canonical live contract only.
 *
 * Usage:
 *   PORT=8787 node analytics-server/server.mjs
 *   # then set analytics.endpoint to http://<host>:8787/collect and rebuild
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const LOG_FILE = path.resolve(
  process.env.ANALYTICS_LOG || path.join(process.cwd(), "analytics-events.ndjson")
);
const MAX_BODY_BYTES = 2048;

export const ALLOWED_EVENTS = new Set([
  "page_view",
  "disclosure_view",
  "outbound_click",
  "site_search",
  "guide_read"
]);

// Per-event allowlist: the only extra fields stored for each event.
// Mirrors worker/collect.js clean() exactly.
const EVENT_FIELDS = {
  page_view: ["referrer_class"],
  disclosure_view: ["position"],
  outbound_click: ["asin", "link_kind"],
  site_search: ["query", "result_count"],
  guide_read: ["slug", "depth"]
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(body);
}

function str(value, max) {
  return typeof value === "string" ? value.slice(0, max) : undefined;
}

export function validateEventPayload(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, error: "Payload must be a JSON object." };
  }
  const e = str(data.e, 32);
  if (!e || !ALLOWED_EVENTS.has(e)) {
    return {
      ok: false,
      error: `Invalid event. Allowed: ${Array.from(ALLOWED_EVENTS).join(", ")}`
    };
  }
  const pagePath = str(data.path, 200);
  if (!pagePath) {
    return { ok: false, error: "Field 'path' must be a non-empty path string." };
  }
  const record = {
    e,
    ts: str(data.ts, 32) || new Date().toISOString(),
    path: pagePath,
    sid: str(data.sid, 64) || null,
    site: str(data.site, 32) || "diyhome1"
  };
  // Per-event allowlist: nothing else is persisted, whatever was sent.
  for (const field of EVENT_FIELDS[e]) {
    if (field === "result_count") {
      record.result_count = Number.isFinite(data.result_count) ? data.result_count : null;
    } else {
      const v = str(data[field], field === "query" ? 120 : 80);
      if (v !== undefined) record[field] = v;
    }
  }
  return { ok: true, record };
}

export function createServer() {
  return http.createServer((req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      });
      res.end();
      return;
    }

    if (req.method === "GET" && req.url === "/api/health") {
      sendJson(res, 200, {
        status: "ok",
        allowed_events: Array.from(ALLOWED_EVENTS)
      });
      return;
    }

    if (req.method === "GET" && req.url === "/api/summary") {
      const counts = Object.fromEntries(
        Array.from(ALLOWED_EVENTS).map((name) => [name, 0])
      );
      if (fs.existsSync(LOG_FILE)) {
        const lines = fs
          .readFileSync(LOG_FILE, "utf8")
          .split("\n")
          .filter(Boolean);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.e && Object.hasOwn(counts, parsed.e)) {
              counts[parsed.e] += 1;
            }
          } catch {
            // Skip malformed lines
          }
        }
      }
      sendJson(res, 200, { counts });
      return;
    }

    // Canonical collect path (matches worker/collect.js and the endpoint
    // URL documented in worker/README.md). /api/events is kept as an alias
    // for operators who already configured that path.
    if (req.method === "POST" && (req.url === "/collect" || req.url === "/api/events")) {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
        if (body.length > MAX_BODY_BYTES) {
          req.destroy();
        }
      });
      req.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          const result = validateEventPayload(parsed);
          if (!result.ok) {
            sendJson(res, 400, { error: result.error });
            return;
          }
          fs.appendFileSync(LOG_FILE, JSON.stringify(result.record) + "\n", "utf8");
          sendJson(res, 202, { accepted: true, event: result.record.e });
        } catch {
          sendJson(res, 400, { error: "Invalid JSON payload." });
        }
      });
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createServer();
  server.listen(PORT, HOST, () => {
    console.log(
      `Privacy-preserving analytics endpoint listening on http://${HOST}:${PORT} (canonical 5-event contract)`
    );
  });
}
