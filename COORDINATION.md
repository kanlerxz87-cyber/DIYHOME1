# COORDINATION — shared task board

Repo: `kanlerxz87-cyber/DIYHOME1`
Site (GitHub Pages, legacy build): https://kanlerxz87-cyber.github.io/DIYHOME1/
Publishing source: branch `main`, folder `/` (confirmed via `GET /repos/kanlerxz87-cyber/DIYHOME1/pages` → `build_type: legacy`, `source: {branch: main, path: /}`, `https_enforced: true`)

**Rules for any session reading this file**

1. Read this file before starting. Claim a task by writing your session ID + file scope below, then commit and push the claim *immediately*.
2. Never start a task another session has claimed. Keep scopes non-overlapping. Work only on your own branch `session-<id>/<task>`.
3. If you need a change in a file owned by another session, log a request here instead of editing it.
4. Never mark anything verified without an official source link recorded in `data/sources.json` and in the task row.
5. Shared outputs (table data, site index, navigation, sitemap, feed, `assets/js/config.js`) are changed only by the integration session — and only by editing `data/*.json` and re-running `node scripts/build.mjs`. Never hand-edit generated HTML.
6. A claim older than 60 minutes with no commits may be taken over; note the handoff.

---

## Session registry

| Session ID | Branch | Role | Started (UTC) | Status |
|---|---|---|---|---|
| `S-2026-11-20-A` | `arena/eb4b2092-diyhome1` | Sole session: research, build, verify, integrate, publish | 2026-11-20 | active |

Single-session run. A later session may take unowned rows only, and must not edit `data/`, `scripts/`, `assets/js/config.js`, `sitemap.xml`, `feed.xml` or generated HTML without claiming the row first.

---

## File ownership map

| Scope | Owner | Notes |
|---|---|---|
| `data/products.json`, `data/product-intents.csv` | T01 | Product facts, intended vs observed fields |
| `data/sources.json`, `sources/index.html` | T02 | Every claim's source |
| `data/flagged.json`, `flagged/index.html` | T10 | Open items |
| `data/guides.json`, `scripts/content.mjs`, `guides/**` | T04 | Editorial |
| `data/events.json`, `assets/js/site.js`, `worker/**`, `measurement/index.html` | T05 | Measurement |
| `data/campaign-ledger.csv`, `data/ledger-schema.md`, `ledger/index.html` | T06 | Ledger |
| `scripts/build.mjs`, `scripts/validate.mjs`, `.github/workflows/validate.yml` | T08 | Build + gate |
| `sitemap.xml`, `feed.xml`, `robots.txt`, `assets/js/config.js`, all `*.html` | T07 | Generated — build only |
| `COORDINATION.md`, `EXECUTIVE_SUMMARY.md`, `README.md` | All | Append-only log for other sessions |

---

## Task board

| ID | Task | Owner | File scope | Status |
|---|---|---|---|---|
| T01 | Verify submitted links, resolve observed destinations, record provenance | S-2026-11-20-A | `data/products.json`, `data/product-intents.csv` | needs review |
| T02 | Source register (official sources, URLs, quoted support) | S-2026-11-20-A | `data/sources.json`, `sources/index.html` | done |
| T03 | Compliance gate: disclosure strip, sponsored marking, price/rating omission | S-2026-11-20-A | `disclosures/index.html`, `data/sources.json` | done |
| T04 | Editorial: 4 question-shaped guides + guides index + cadence | S-2026-11-20-A | `data/guides.json`, `scripts/content.mjs`, `guides/**` | done |
| T05 | Measurement: 5-event instrumentation, local queue, endpoint contract | S-2026-11-20-A | `assets/js/site.js`, `worker/**`, `measurement/index.html` | needs review |
| T06 | Campaign ledger (empty, defined schema, dated provenance) | S-2026-11-20-A | `data/campaign-ledger.csv`, `data/ledger-schema.md` | done |
| T07 | Findability: sitemap, feed, robots, canonicals, JSON-LD | S-2026-11-20-A | generated | done |
| T08 | Site build + link/policy validation + CI gate | S-2026-11-20-A | `scripts/**`, `.github/workflows/validate.yml` | done |
| T09 | Executive summary (repo + site) | S-2026-11-20-A | `EXECUTIVE_SUMMARY.md`, `summary/index.html` | done |
| T10 | Flagged for Review page | S-2026-11-20-A | `data/flagged.json`, `flagged/index.html` | needs review |
| T11 | Integration: merge to `main`, PR, Pages deploy, record result | S-2026-11-20-A | `main` (merge only) | in progress |

`needs review` = published on the Flagged for Review page and does **not** block the merge.

---

## Log

### 2026-11-20 — S-2026-11-20-A — T01 link verification

Method: one unauthenticated fetch per submitted link, recording the final URL and page title. Also probed `/dp/<short-code-uppercased>` to test whether the short token is an ASIN.

| Submitted link | Observed final URL | Observed title (verbatim, truncated) |
|---|---|---|
| https://link.amazon/B0hmGG4m2 | `https://www.amazon.com/dp/B08FKW9JRM?...` | "Art3d Smoothing Tool Kit for Peel and Stick Wallpaper \| Vinyl Backsplash Tile, Complete Basic Tool Set, Bubble & Crease Removal, Ergonomic Grip, Safe for DIY and New Home Buyer" |
| https://link.amazon/B03QDuGdo | `https://www.amazon.com/dp/B0BSKQW2T2?...` | "Paper Towel Holder Under Cabinet, Self-Adhesive or Drilling, Matte Black \| Kitchen Roll Dispenser \| Under-Cabinet or Wall-Mounted\| Upgraded Aluminum \| Lighter Yet Stronger Than Stainless Steel" |
| https://link.amazon/B0hpD2JGQ | `https://www.amazon.com/dp/B08DY9HRWD?...` | "ORDORA Pots and Pans Organizer Under Cabinet 16.6\", 8-Tier Adjustable Rack \| 3 DIY Modes, Tool-Free Assembly, Non-Slip, Fits Lightweight Cookware Up to 11\", For Kitchen Cabinets, Shelves & Countertops" |

Findings:
- Three distinct short links → three distinct ASINs. Every link reached a live product page.
- Short tokens are **not** ASINs: they contain lowercase letters, and `https://www.amazon.com/dp/B0HMGG4M2` returned a fetch error, not a product page.
- The supplied list contains a **duplicate** (`B03QDuGdo` twice). Counted once; flagged F02.
- Observed redirect targets carried session/search parameters (`crid`, `sprefix`, `sr=`). Recorded as **observed**, in their own field, never merged with `intended_asin` (which stays blank).
- **Unverified:** that the links carry `shopnow047c-20`, that they are enrolled Special Links, or that clicks appear in the Associates report. Requires Associates Central sign-in. Flagged F01.
- **Not claimed:** that the short links are invalid. Compliance status unresolved.

### 2026-11-20 — S-2026-11-20-A — T02 sources

19 sources registered in `data/sources.json`, each with publisher, page date, retrieval date, supported statements and verbatim quotes. 16 read successfully; 2 unreadable behind sign-in walls (S16 Seller Central ASIN help, S17 commission rate schedule); 1 secondary (S15 seller-forum ASIN post). Verified: Amazon Program Policies (`/help/operating/policies`, page dated 14 Apr 2026) and Operating Agreement (15 Oct 2025), FTC *Disclosures 101*, Google sitemap / robots.txt / Search Console docs, GitHub Pages publishing docs, and the three live Amazon listings.

### 2026-11-20 — S-2026-11-20-A — T03 compliance gate

Verified verbatim, and applied:
- Participation Requirements 2(b): the Associates tag must appear "as a parameter in the URL of each link".
- 2(b): prices and availability only via Amazon-served links or Creators/PA API.
- 3(t): customer reviews and star ratings only via Creators/PA API.
- 3(v): no obscuring the URL containing Special Links, "including by use of Redirecting Links".
- 3(w): no link shortening that makes the Amazon destination unclear.
- 3(y): no price tracking or price alerts.
- IP Licence Agent Terms (new): agents must identify as `Agent/[agent name]` and must not conceal automation or circumvent blocks.
- IP Licence 2(h): ASINs may be stored indefinitely.
- FTC: disclose so it is "hard to miss", with the endorsement, in simple words; don't describe untried products.

Consequences in the build: no prices, ratings, review counts, availability, imagery or commission figures; no on-site redirector (clicks are observed, navigation is untouched); all CTAs are fresh tagged Special Links marked `rel="sponsored nofollow noopener"`; disclosure strip under the masthead on every page plus a footer repeat.

### 2026-11-20 — S-2026-11-20-A — T04 editorial

Four guides published, all question-shaped, all tied to a category with a verified product: wallpaper smoothing kit comparison, paper-towel-holder fit checklist, pan-organiser capacity, and pre-purchase questions. The air-fryer working titles from the brief were **not** published: no submitted product matches them (F03). Guides contain no search-volume, popularity or superiority claims, and no hands-on experience claims.

### 2026-11-20 — S-2026-11-20-A — T06 ledger

`data/campaign-ledger.csv` ships with a 12-column header and **zero rows**. `data/ledger-schema.md` documents each column and the rule that blank means "not obtained". The validator fails the build if a row appears.

### 2026-11-20 — S-2026-11-20-A — T07 findability

One canonical host on all 19 indexable pages; `sitemap.xml` (19 URLs, all resolving); RSS 2.0 `feed.xml` (7 items, also a valid sitemap format per Google); `robots.txt`; `noindex` on `/search/` and `/404.html`; JSON-LD `WebSite` + `SearchAction` on the home page, `BreadcrumbList` elsewhere, `Article` on guides. No `Product` structured data is emitted: it would require offers/ratings this site is not permitted to publish.

### 2026-11-20 — S-2026-11-20-A — T08 build + gate

`node scripts/build.mjs` → 21 pages. `node scripts/validate.mjs` → 15 check groups, 0 errors, 0 warnings: 132 Amazon links (33 sponsored, 105 citation), single tag, no untagged product URL outside declared citations, no citation used as a button, no third-party subresources, every internal link and form action resolving, sitemap/feed well-formed, `price`/`rating`/`review_count`/`image`/`intended_asin` still `null`, ledger still empty.

### 2026-11-20 — S-2026-11-20-A — F13 and F14 added mid-build

- **F13:** the verification fetches did not identify themselves as an automated agent, contrary to the Agent Terms in Amazon's IP Licence. Recorded rather than silently repeated.
- **F14:** `robots.txt` sits at `/DIYHOME1/robots.txt`, not the host root that crawlers read; `noindex` meta tags are the actual control.

### 2026-11-20 — S-2026-11-20-A — T11 integration result

```
(replaced below after merge)
```
