#!/usr/bin/env node
/**
 * Self-hosted, privacy-preserving analytics endpoint for Field & Fixture (DIYHOME1).
 * Accepts the 5 defined events without cookies, user agents, or raw IP persistence.
 *
 * Usage:
 *   PORT=8787 node analytics-server/server.mjs
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const LOG_FILE = path.resolve(
  process.env.ANALYTICS_LOG || path.join(process.cwd(), "analytics-events.ndjson")
);

export const ALLOWED_EVENTS = new Set([
  "page_view",
  "disclosure_view",
  "outbound_click",
  "site_search",
  "guide_read",
  "product_impression",
  "outbound_affiliate_click",
  "reader_capture_submit"
]);

export const CANONICAL_EVENTS = new Set([
  "page_view",
  "disclosure_view",
  "outbound_click",
  "site_search",
  "guide_read"
]);

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

export function validateCanonicalPayload(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, error: "Payload must be a JSON object." };
  }
  const e = typeof data.e === "string" ? data.e.slice(0, 32) : "";
  if (!CANONICAL_EVENTS.has(e)) {
    return {
      ok: false,
      error: `Invalid event. Allowed: ${Array.from(CANONICAL_EVENTS).join(", ")}`
    };
  }
  const eventPath = typeof data.path === "string" ? data.path.slice(0, 200) : "";
  if (!eventPath) {
    return { ok: false, error: "Field 'path' must be a non-empty path string." };
  }
  const record = {
    e,
    event: e,
    ts: typeof data.ts === "string" ? data.ts.slice(0, 32) : new Date().toISOString(),
    path: eventPath,
    sid: typeof data.sid === "string" ? data.sid.slice(0, 64) : null,
    site: typeof data.site === "string" ? data.site.slice(0, 32) : "diyhome1"
  };
  if (e === "page_view" && typeof data.referrer_class === "string") {
    record.referrer_class = data.referrer_class.slice(0, 16);
  }
  if (e === "outbound_click") {
    record.asin = typeof data.asin === "string" ? data.asin.slice(0, 16) : null;
    record.link_kind = typeof data.link_kind === "string" ? data.link_kind.slice(0, 16) : "product";
  }
  if (e === "site_search") {
    record.query = typeof data.query === "string" ? data.query.slice(0, 120) : "";
    record.result_count = Number.isFinite(data.result_count) ? data.result_count : null;
  }
  if (e === "guide_read") {
    record.slug = typeof data.slug === "string" ? data.slug.slice(0, 80) : null;
    record.depth = typeof data.depth === "string" ? data.depth.slice(0, 8) : "60";
  }
  if (e === "disclosure_view") {
    record.position = typeof data.position === "string" ? data.position.slice(0, 16) : "masthead";
  }
  return { ok: true, record };
}

export function validateEventPayload(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, error: "Payload must be a JSON object." };
  }
  const { event, page, ts, meta } = data;
  if (typeof event !== "string" || !ALLOWED_EVENTS.has(event)) {
    return {
      ok: false,
      error: `Invalid event. Allowed: ${Array.from(ALLOWED_EVENTS).join(", ")}`
    };
  }
  if (typeof page !== "string" || page.length === 0 || page.length > 300) {
    return { ok: false, error: "Field 'page' must be a non-empty path string." };
  }
  const cleanMeta =
    meta && typeof meta === "object" && !Array.isArray(meta)
      ? Object.fromEntries(
          Object.entries(meta)
            .filter(([k]) => !/ip|email|cookie|user_?agent/i.test(k))
            .slice(0, 12)
        )
      : {};
  return {
    ok: true,
    record: {
      event,
      page,
      ts: typeof ts === "string" ? ts : new Date().toISOString(),
      meta: cleanMeta
    }
  };
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

    if (req.method === "GET" && (req.url === "/api/summary" || req.url === "/summary")) {
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
            const evName = parsed.event || parsed.e;
            if (evName && Object.hasOwn(counts, evName)) {
              counts[evName] += 1;
            }
          } catch {
            // Skip malformed lines
          }
        }
      }
      sendJson(res, 200, { counts });
      return;
    }

    if (req.method === "POST" && (req.url === "/api/events" || req.url === "/collect")) {
      const isCanonical = req.url === "/collect";
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
        if (body.length > 16384) {
          req.destroy();
        }
      });
      req.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          const result = isCanonical
            ? validateCanonicalPayload(parsed)
            : validateEventPayload(parsed);
          if (!result.ok) {
            sendJson(res, 400, { error: result.error });
            return;
          }
          fs.appendFileSync(LOG_FILE, JSON.stringify(result.record) + "\n", "utf8");
          if (isCanonical) {
            res.writeHead(204, {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type"
            });
            res.end();
          } else {
            sendJson(res, 202, { accepted: true, event: result.record.event });
          }
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
      `Privacy-preserving analytics endpoint listening on http://${HOST}:${PORT}`
    );
  });
}
