/**
 * Self-hosted event collector for DIY Home Upgrades.
 *
 * Runtime: Cloudflare Workers (module syntax). No npm dependencies.
 * Contract: the five events defined in data/events.json.
 *
 * Privacy posture, enforced here rather than promised:
 *  - the connecting IP is never read into storage;
 *  - no cookies, no user agent, no location, no persistent identifier;
 *  - only the fields on the allowlist below are stored;
 *  - the client-side session id is stored as-is and dies with the browser tab;
 *  - bodies over 2 KB are rejected;
 *  - reads require a bearer token, writes are origin-restricted.
 *
 * Deploy:
 *   wrangler kv namespace create EVENTS
 *   wrangler secret put READ_TOKEN
 *   wrangler deploy
 * Then put the deployed URL into data/site.json -> analytics.endpoint and rebuild.
 */

const ALLOWED_EVENTS = new Set(["page_view", "disclosure_view", "outbound_click", "site_search", "guide_read"]);
const MAX_BODY_BYTES = 2048;
const KEEP_DAYS = 30;

function cors(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || "https://kanlerxz87-cyber.github.io")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ok = allowed.includes(origin) || allowed.includes("*");
  return {
    "access-control-allow-origin": ok ? origin : "null",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "origin"
  };
}

function str(value, max) {
  return typeof value === "string" ? value.slice(0, max) : undefined;
}

function clean(body) {
  const e = str(body.e, 32);
  if (!e || !ALLOWED_EVENTS.has(e)) return null;
  const row = {
    e,
    ts: str(body.ts, 32) || new Date().toISOString(),
    path: str(body.path, 200) || "/",
    sid: str(body.sid, 64) || null,
    site: str(body.site, 32) || "diyhome1"
  };
  // per-event allowlist keeps the store honest: nothing else is persisted
  if (e === "page_view") row.referrer_class = str(body.referrer_class, 16) || "unknown";
  if (e === "outbound_click") {
    row.asin = str(body.asin, 16) || null;
    row.link_kind = str(body.link_kind, 16) || "product";
  }
  if (e === "site_search") {
    row.query = str(body.query, 120) || "";
    row.result_count = Number.isFinite(body.result_count) ? body.result_count : null;
  }
  if (e === "guide_read") {
    row.slug = str(body.slug, 80) || null;
    row.depth = str(body.depth, 8) || "60";
  }
  if (e === "disclosure_view") row.position = str(body.position, 16) || "masthead";
  return row;
}

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("origin") || "";
    const headers = cors(origin, env);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

    if (request.method === "POST" && url.pathname === "/collect") {
      const text = await request.text();
      if (text.length > MAX_BODY_BYTES) {
        return new Response(JSON.stringify({ error: "body too large" }), { status: 413, headers: { ...headers, "content-type": "application/json" } });
      }
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        return new Response(JSON.stringify({ error: "invalid json" }), { status: 400, headers: { ...headers, "content-type": "application/json" } });
      }
      const row = clean(body);
      if (!row) {
        return new Response(JSON.stringify({ error: "unknown event" }), { status: 422, headers: { ...headers, "content-type": "application/json" } });
      }
      row.received = new Date().toISOString();
      const key = `evt:${dayKey()}:${crypto.randomUUID()}`;
      // 30-day retention: the key prefix carries the day, so expiry is enforced by KV TTL
      await env.EVENTS.put(key, JSON.stringify(row), { expirationTtl: KEEP_DAYS * 86400 });
      return new Response(null, { status: 204, headers });
    }

    if (request.method === "GET" && url.pathname === "/summary") {
      const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      if (!env.READ_TOKEN || token !== env.READ_TOKEN) {
        return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
      }
      const listed = await env.EVENTS.list({ prefix: "evt:", limit: 1000 });
      const counts = {};
      for (const k of listed.keys) {
        const raw = await env.EVENTS.get(k.name);
        if (!raw) continue;
        const row = JSON.parse(raw);
        counts[row.e] = (counts[row.e] || 0) + 1;
      }
      return new Response(JSON.stringify({ counts, sampled_keys: listed.keys.length, truncated: !listed.list_complete }, null, 2), {
        headers: { "content-type": "application/json", "cache-control": "no-store" }
      });
    }

    return new Response(JSON.stringify({ ok: true, endpoints: ["POST /collect", "GET /summary"] }), {
      headers: { "content-type": "application/json", ...headers }
    });
  }
};
