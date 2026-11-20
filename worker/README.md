# Collector — self-hosted analytics endpoint

This is the sink for the five events defined in `data/events.json`. It is **not deployed**, which is why the site reports "instrumented, not collecting" and why the campaign ledger has zero rows (`/flagged/#F05`).

## Deploy (Cloudflare Workers)

```sh
cd worker
npm create cloudflare@latest -- --name diyhome-collect   # or reuse your existing project
wrangler kv namespace create EVENTS                       # copy the id into wrangler.toml
wrangler secret put READ_TOKEN                            # any long random string
wrangler deploy
```

`wrangler.toml`:

```toml
name = "diyhome-collect"
main = "collect.js"
compatibility_date = "2026-01-01"

[[kv_namespaces]]
binding = "EVENTS"
id = "<the id printed by wrangler kv namespace create>"

[vars]
ALLOWED_ORIGINS = "https://kanlerxz87-cyber.github.io"
```

## Turn collection on in the site

1. Put the deployed URL in `data/site.json` → `analytics.endpoint` (for example `https://diyhome-collect.<account>.workers.dev/collect`).
2. Run `node scripts/build.mjs` and `node scripts/validate.mjs`, then commit the regenerated `assets/js/config.js`.
3. Confirm with `curl -H "Authorization: Bearer <READ_TOKEN>" https://<worker>/summary`.

Until step 1, `assets/js/config.js` carries an empty endpoint and the site sends nothing: events stay in the visitor's own browser.

## What is stored

Only the fields on the per-event allowlist in `collect.js`:

| Event | Stored |
|---|---|
| `page_view` | event, timestamp, path, referrer class, session id, site |
| `disclosure_view` | event, timestamp, path, session id, position |
| `outbound_click` | event, timestamp, path, session id, ASIN, link kind |
| `site_search` | event, timestamp, path, session id, query, result count |
| `guide_read` | event, timestamp, path, session id, slug, depth |

Never stored: IP address, user agent, cookies, location, full referrer URL, any persistent identifier.

## Retention

Keys are written with a 30-day expiry (`KEEP_DAYS` in `collect.js`). Change it deliberately, not by accident.

## Reading the data

`GET /summary` requires `Authorization: Bearer <READ_TOKEN>` and returns counts per event. It samples up to 1000 keys per call and says so (`truncated`), rather than implying a total it cannot prove.

## Why no redirect endpoint

The collector never issues a redirect. Outbound clicks go straight from the browser to Amazon; the counter observes the click and gets out of the way. Amazon's program policies prohibit obscuring or cloaking the URL containing Special Links, and this design keeps that impossible by construction.
