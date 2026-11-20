# COORDINATION — shared task board

Repo: `kanlerxz87-cyber/DIYHOME1`
Site (GitHub Pages, legacy build): https://kanlerxz87-cyber.github.io/DIYHOME1/
Publishing source: branch `main`, folder `/` (confirmed via `GET /repos/kanlerxz87-cyber/DIYHOME1/pages` → `build_type: legacy`, `source: {branch: main, path: /}`)

**Rules for any session reading this file**

1. Read this file before starting. Claim a task by writing your session ID + file scope below, then commit and push the claim *immediately*.
2. Never start a task another session has claimed. Keep scopes non-overlapping. Work only on your own branch `session-<id>/<task>`.
3. If you need a change in a file owned by another session, log a request here instead of editing it.
4. Never mark anything verified without an official source link recorded in `data/sources.json` and in the task row.
5. Shared outputs (table data, site index, navigation, sitemap, feed) are changed only by the integration session.
6. A claim older than 60 minutes with no commits may be taken over; note the handoff.

---

## Session registry

| Session ID | Branch | Role | Started (UTC) | Status |
|---|---|---|---|---|
| `S-2026-11-20-A` | `arena/eb4b2092-diyhome1` | Sole session this run: research, build, verify, integrate, publish | 2026-11-20 | active |

> This run had a single session. Tasks below are all owned by `S-2026-11-20-A`; no other session has claimed work. If a second session starts later, it must claim unowned rows only and must not edit `data/`, `assets/js/config.js`, `scripts/build.mjs`, `sitemap.xml`, `feed.xml`, or the shared navigation.

---

## Task board

| ID | Task | Owner | File scope | Status |
|---|---|---|---|---|
| T01 | Verify submitted links, resolve observed destinations, record provenance | S-2026-11-20-A | `data/products.json`, `data/product-intents.csv` | needs review |
| T02 | Source register (official sources, URLs, what each supports) | S-2026-11-20-A | `data/sources.json`, `sources/index.html` | done |
| T03 | Compliance gate: disclosure strip, sponsored marking, price/rating omission | S-2026-11-20-A | `disclosures/index.html`, `data/sources.json` | done |
| T04 | Editorial: 4 question-shaped guides + guides index | S-2026-11-20-A | `data/guides.json`, `guides/**` | done |
| T05 | Measurement: 5-event instrumentation, local queue, endpoint contract | S-2026-11-20-A | `assets/js/site.js`, `worker/**`, `measurement/index.html` | needs review |
| T06 | Campaign ledger (empty, defined schema, dated provenance) | S-2026-11-20-A | `data/campaign-ledger.csv` | done |
| T07 | Findability: sitemap, feed, robots, canonicals, JSON-LD | S-2026-11-20-A | `sitemap.xml`, `feed.xml`, `robots.txt`, `scripts/build.mjs` | done |
| T08 | Site build + link/policy validation (CI gate) | S-2026-11-20-A | `scripts/**`, `.github/workflows/validate.yml` | done |
| T09 | Executive summary (repo + site) | S-2026-11-20-A | `EXECUTIVE_SUMMARY.md`, `summary/index.html` | done |
| T10 | Flagged for Review page | S-2026-11-20-A | `data/flagged.json`, `flagged/index.html` | needs review |
| T11 | Integration: merge to `main`, PR, Pages deploy, record result | S-2026-11-20-A | `main` (merge only) | in progress |

`needs review` = published on the Flagged for Review page and does **not** block merge.

---

## Log

### 2026-11-20 — S-2026-11-20-A — T01 link verification

Method: fetched each submitted short link once, recorded the final URL and page title returned by the fetch (no user agent spoofing, no login). Also probed `https://www.amazon.com/dp/<short-code-uppercased>` to test whether the short code is itself an ASIN.

| Submitted link | Observed final URL | Observed page title (verbatim, truncated) |
|---|---|---|
| https://link.amazon/B0hmGG4m2 | `https://www.amazon.com/dp/B08FKW9JRM?...` | "Art3d Smoothing Tool Kit for Peel and Stick Wallpaper \| Vinyl Backsplash Tile, Complete Basic Tool Set, Bubble & Crease Removal, Ergonomic Grip, Safe for DIY and New Home Buyer - Amazon.com" |
| https://link.amazon/B03QDuGdo | `https://www.amazon.com/dp/B0BSKQW2T2?...` | "Amazon.com - Paper Towel Holder Under Cabinet, Self-Adhesive or Drilling, Matte Black \| Kitchen Roll Dispenser \| Under-Cabinet or Wall-Mounted\| Upgraded Aluminum \| Lighter Yet Stronger Than Stainless Steel" |
| https://link.amazon/B0hpD2JGQ | `https://www.amazon.com/dp/B08DY9HRWD?...` | "Amazon.com: ORDORA Pots and Pans Organizer Under Cabinet 16.6\", 8-Tier Adjustable Rack \| 3 DIY Modes, Tool-Free Assembly, Non-Slip, Fits Lightweight Cookware Up to 11\", For Kitchen Cabinets, Shelves & Countertops: Home & Kitchen" |

Findings:
- The three distinct short links resolve to **three distinct ASINs**. No link points to a non-product page in the observed responses.
- The short-link path segments (`B0hmGG4m2`, `B03QDuGdo`, `B0hpD2JGQ`) are **not** ASINs: they contain lowercase letters, and `https://www.amazon.com/dp/B0HMGG4M2` returned a fetch error (no product page). ASINs are 10-character uppercase alphanumeric identifiers, and `/dp/{ASIN}` is the listing URL pattern observed to work.
- The submitted list contains a **duplicate**: `https://link.amazon/B03QDuGdo` appears twice. Recorded once.
- Observed redirect targets carried session/search query parameters (`crid`, `sprefix`, `sr=`). These are **observed**, not confirmed as authoritative listing URLs. `intended_asin` is therefore left blank/unverified; `observed_asin` is recorded separately. The two fields are never merged (see `data/product-intents.csv`).
- **Not verified:** that these short links are enrolled Associates Special Links, that they carry the tracking ID `shopnow047c-20`, or that the Associates tracking report records clicks. Requires sign-in to Associates Central, which this session cannot do. Status: needs review (flagged).
- **Not claimed:** that the short links are invalid. Their compliance status is unresolved.

### 2026-11-20 — S-2026-11-20-A — T03 compliance gate

Verified verbatim requirements (full URLs in `data/sources.json`):
- Program Policies, Participation Requirements §2(b): "you must include your Associates ID or “tag” … as a parameter in the URL of each link you place on your Site to an Amazon Site."
- Program Policies §2(b): "your Site may only show prices and availability if: (a) we serve the link in which that price and availability data are displayed, or (b) you obtain Product pricing and availability data via Creators API or PA API…"
- Program Policies §3(t): "You will not display or otherwise use any of our customer reviews or star ratings … unless you have obtained a link to that customer review or star rating through Creators API or PA API…"
- Program Policies §3(v): no cloaking/obscuring the URL containing Special Links "including by use of Redirecting Links".
- Program Policies §3(w): no link-shortening "in a manner that makes it unclear that you are linking to an Amazon Site".
- Program Policies §3(y): "your Site must not have price tracking and/or price alerting functionality."

Design consequences, applied: no prices, no star ratings, no review quotes, no product images, no on-site redirect cloaking (the click counter observes the click and lets the browser navigate directly), and every Amazon-bound link carries `rel="sponsored nofollow noopener"`, is labelled "Sponsored", and the tagged URLs carry `tag=shopnow047c-20`.

### 2026-11-20 — S-2026-11-20-A — flagged irregularities
See `data/flagged.json` (mirrored at `/flagged/` on the site): unresolved Associates enrollment/tracking for the three links; duplicate submission; no Search Console verification token available; no self-hosted analytics endpoint deployed; air-fryer working titles in the brief have no corresponding submitted products, so they were not published as product guides.

### 2026-11-20 — S-2026-11-20-A — T11 integration result
Recorded after merge — see "Integration result" at the bottom of this file.
