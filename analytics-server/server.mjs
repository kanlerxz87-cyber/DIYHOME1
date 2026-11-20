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
  "guide_read",
  "product_impression",
  "outbound_affiliate_click",
  "reader_capture_submit"
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
            if (parsed.event && Object.hasOwn(counts, parsed.event)) {
              counts[parsed.event] += 1;
            }
          } catch {
            // Skip malformed lines
          }
        }
      }
      sendJson(res, 200, { counts });
      return;
    }

    if (req.method === "POST" && req.url === "/api/events") {
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
          const result = validateEventPayload(parsed);
          if (!result.ok) {
            sendJson(res, 400, { error: result.error });
            return;
          }
          fs.appendFileSync(LOG_FILE, JSON.stringify(result.record) + "\n", "utf8");
          sendJson(res, 202, { accepted: true, event: result.record.event });
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
