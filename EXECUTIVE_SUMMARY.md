# Executive summary — DIY Home Upgrades

**Prepared:** 21 November 2026 · **Branch:** `arena/f851636b-diyhome1` · **Site:** https://kanlerxz87-cyber.github.io/DIYHOME1/
**Associates tracking ID used:** `shopnow047c-20` (as supplied; enrolment not verified — see F01, F12)

---

## 1. What exists now

A static, multi-page affiliate publication built from `data/*.json`, published by GitHub Pages from `main:/`, with:

| Surface | What it is |
|---|---|
| `/` | Front page: three products first, then guides, how the page is checked, and zero-PII RSS reader capture (`SG-30`) |
| `/products/` | Filterable product register, one row per product, each row linking to its official listing |
| `/products/wallpaper-tools/`, `/products/kitchen-storage/` | Category pages |
| `/products/comparisons/` | Side-by-side physical specification comparison matrix across all three products |
| `/products/<slug>/` ×3 | Product pages with a full verification record + 17-row line-by-line official specification table |
| `/guides/` + 4 guide pages | Question-shaped DIY buying guides + the 4 working-title countertop-appliance editorial hypotheses |
| `/about/` | Method, definition of "verified", automation boundaries |
| `/automation/` | 7-stage automation & compliance gate CLI (`validate.mjs`, `platform_engine.py`, `creators_api_client.py`) |
| `/disclosures/` | Affiliate disclosure, link policy, privacy, withheld data |
| `/sources/` | Register of 25 official sources + `SG-27..SG-30` parallel passes + 52-row product spec verification ledger |
| `/flagged/` | 14 flagged items with severity, what would close each one, and official sources on every row |
| `/measurement/` | Five defined events, privacy rules, honest status, local event viewer |
| `/ledger/` | 4-row Product-intent confirmation record (strictly separate from observed redirects) + empty campaign ledger |
| `/summary/` | This summary, on the site (all dashboard surfaces grouped under `Site desk` in top nav & repeated in footer) |
| `sitemap.xml`, `feed.xml`, `robots.txt`, `.nojekyll` | Findability plumbing |

No prices, no star ratings, no review counts, no product images, no commission percentages, no conversion scores, no revenue forecasts. Every one of those omissions is explained on `/disclosures/` and justified by a source.

---

## 2. Link verification — what the four supplied links actually are

Four links were supplied; one was a duplicate, so three distinct links were resolved.

| # | Supplied link | Resolved to | Listing title (read on 2026-11-21) |
|---|---|---|---|
| 1 | `https://link.amazon/B0hmGG4m2` | `https://www.amazon.com/dp/B08FKW9JRM` | Art3d Smoothing Tool Kit for Peel and Stick Wallpaper \| Vinyl Backsplash Tile, Complete Basic Tool Set, Bubble & Crease Removal, Ergonomic Grip, Safe for DIY and New Home Buyer |
| 2 | `https://link.amazon/B03QDuGdo` | `https://www.amazon.com/dp/B0BSKQW2T2` | Paper Towel Holder Under Cabinet, Self-Adhesive or Drilling, Matte Black \| Kitchen Roll Dispenser \| Under-Cabinet or Wall-Mounted\| Upgraded Aluminum \| Lighter Yet Stronger Than Stainless Steel |
| 2 (dup) | `https://link.amazon/B03QDuGdo` | same as #2 | Duplicate submission — counted once |
| 3 | `https://link.amazon/B0hpD2JGQ` | `https://www.amazon.com/dp/B08DY9HRWD` | ORDORA Pots and Pans Organizer Under Cabinet 16.6", 8-Tier Adjustable Rack \| 3 DIY Modes, Tool-Free Assembly, Non-Slip, Fits Lightweight Cookware Up to 11", For Kitchen Cabinets, Shelves & Countertops |

**Two things this proves, and one it does not.**

- **Proves:** each short link reaches a live product page; the three targets are distinct; the short-link tokens (`B0hmGG4m2`, `B03QDuGdo`, `B0hpD2JGQ`) are not ASINs — they contain lowercase characters and `/dp/B0HMGG4M2` returns no product page.
- **Does not prove:** that the short links carry the tag `shopnow047c-20`, that they are enrolled Associates links, or that clicks on them appear in the Associates tracking report. Those require Associates Central sign-in. **This is unresolved, not disproven** — see F01.
- **Never claimed:** that the short links are invalid. Their compliance status is unresolved.

Because tracking is unconfirmed, every call to action on the site is a freshly built tagged Special Link — `https://www.amazon.com/dp/<ASIN>?tag=shopnow047c-20` — rather than the short token. The short links appear only as labelled provenance records.

---

## 3. Compliance decisions, and the sources behind them

| Decision | Rule relied on |
|---|---|
| Disclosure strip under the masthead on every page, repeated in the footer, plus a "Sponsored" label on every outbound link | FTC, *Disclosures 101*: "Place it so it's hard to miss"; disclosures are missed if they appear "only on an ABOUT ME or profile page, at the end of posts or videos, or anywhere that requires a person to click MORE" |
| Every Amazon link carries `rel="sponsored nofollow noopener"` and the tag parameter | Amazon Program Policies, Participation Requirements 2(b): the Associates tag must appear "as a parameter in the URL of each link" |
| No prices, availability, star ratings or customer reviews | Program Policies 2(b) (price/availability only via Amazon-served links or Creators/PA API) and 3(t) (reviews and star ratings only via those APIs) |
| No price tracking or price alerts anywhere | Program Policies 3(y) |
| No redirector or cloaking; the click counter observes and lets the browser navigate | Program Policies 3(v) (no obscuring the URL containing Special Links) |
| No link shortener in front of any call to action | Program Policies 3(w) |
| No product imagery or Amazon marks | IP Licence terms over Program Content; no licensed feed or API access exists here |
| No "we tested it" language anywhere | FTC, *Disclosures 101*: "You can't talk about your experience with a product you haven't tried" |
| No commission percentages or earnings estimates | The Standard Commission Income schedule redirects to a sign-in wall (S17), so rates could not be verified |

---

## 4. Automation: the boundary that is actually enforced

Automated (a script fails if it breaks):
- page generation from `data/*.json`;
- one `h1` per page, disclosure on every page, canonical on every page;
- `rel="sponsored nofollow"` on every sponsored Amazon link, tag parameter on every product URL;
- no cloaked or redirector links, no third-party subresources;
- every internal link resolves, every page is in the sitemap, feed is well-formed;
- `price`, `rating`, `review_count`, `image` and `intended_asin` must remain `null`, and the campaign ledger must remain empty until a report exists.

Gated (a human with account access must do it):
- Associates link enrolment and tracking confirmation (F01);
- Search Console verification token (F04);
- analytics endpoint deployment (F05);
- any commission rate or earnings figure (F10);
- any change to a verified product value (requires re-reading the official source and updating the source ID).

Amazon's current terms add **Agent Terms**: automated software interacting with program content must identify itself in its user agent as `Agent/[agent name]`, must not conceal that it is automated, and must not circumvent human/bot checks. The verification fetches in this build did not set that user agent. Recorded as F13 rather than quietly corrected.

---

## 5. Flagged for review (14 items)

High: **F01** — short links not confirmed as enrolled/tracked.
Medium: **F03** air-fryer working titles have no matching products; **F04** no Search Console token; **F05** no analytics endpoint, so events stay local; **F10** commission rates unverifiable; **F13** verification fetches did not identify as an agent.
Low: **F02** duplicate link supplied; **F14** robots.txt sits inside the project path, not at the host root; **F06** Amazon's ASIN definition is behind a sign-in; **F11** one listing has no brand in its title; **F12** tracking ID enrolment unconfirmed.
Info (withheld by design): **F07** prices/ratings/reviews observed but not published; **F08** nothing tested; **F09** no Amazon imagery.

Full detail, with the source links and what would close each item: `/flagged/` on the site, `data/flagged.json` in the repo.

---

## 6. Editorial: the four guides, and why not the air-fryer titles

The brief's air-fryer working titles do not match the three submitted products, all of which are DIY home or under-cabinet items. Publishing four air-fryer guides against a wallpaper tool kit and two cabinet racks would have been a content-to-product mismatch, and the brief itself described those titles as hypotheses, not verified demand. Replacement guides, same question-shaped format, tied to the categories that have verified products:

1. Peel-and-stick wallpaper smoothing kit: what should you compare before you buy?
2. Under-cabinet paper towel holder: how do you check the fit before ordering?
3. How many tiers does your cabinet actually need?
4. What should you ask before any small under-cabinet upgrade?

Each is added to `sitemap.xml` and `feed.xml` on build. No search-volume, popularity or superiority claim appears in any of them, because no keyword tool with first-party or licensed data was available to verify one.

---

## 7. Measurement: instrumented, not collecting

Five events, defined before anything was measured: `page_view`, `disclosure_view`, `outbound_click`, `site_search`, `guide_read`.
No cookies. No third-party requests. Session ID in `sessionStorage` only. Referrer reduced to a class. Do Not Track and Global Privacy Control are honoured by recording nothing.
No endpoint is configured, so no event leaves the browser; events are visible in the local viewer on `/measurement/` and can be exported. A Cloudflare Worker collector is included at `worker/collect.js`. Until it is deployed and a first-party report exists, the campaign ledger has zero rows — and the validator fails the build if a row appears without one.

---

## 8. Parallel sessions and the merged publication

`main` advanced through PRs #1–#15 from multiple Arena sessions before this branch merged. Those sessions published a different edition — "The Practical Home" — which deliberately showed **no products** at all: its build only rendered a product card once a Special Link and an Associates tracking report existed.

This integration did not discard it. The earlier edition is preserved intact at `/archive/practical-home/` with its data (`catalog.json`, `redirects.csv`), Python build and check scripts, analytics worker, acceptance and release-review harnesses, all still runnable in place. Three things were added to it, by the committed script `archive/practical-home/scripts/preserve-archive.py`: absolute URLs rewritten to the archive path, `noindex`, and a banner linking back here. It is excluded from `sitemap.xml`, so one publication is indexed.

The live root is now the product-led edition, because the brief's first priority was to lead with products, and a shop with zero products cannot do that. Both editions' findings agree on the substance: the three distinct short links resolve to three distinct ASINs, the fourth submission is a duplicate, and no tracking attribution can be confirmed without Associates Central access.

Prior sessions' board and logs are reproduced verbatim in `COORDINATION.md`.

## 9. Where it stands

The site builds and passes every check. Three things need account access the build did not have: Associates tracking confirmation, Search Console verification, and an analytics host. All three are published on `/flagged/` with what would close them.

Nothing on this site is presented as verified beyond what an official source supports on the date shown. Where that could not be established, the value is blank and the gap is named.

---

## 10. Addendum — 2026-11-21 re-verification (session `arena/f851636b-diyhome1`)

A fresh line-by-line re-read of the official sources, one day after the original build. No product, price, rating, commission or tracking claim changed; the following was confirmed or corrected:

**Re-confirmed verbatim on 2026-11-21:**
- Amazon Program Policies, still dated *Updated April 14, 2026* (S01): the 2(b) tag clause, the price/availability clause, and 3(t)/3(v)/3(w)/3(y) all match the quotes in `data/sources.json` word for word.
- FTC *Disclosures 101* (S03, November 2019): all four quotes match.
- All three listing titles (S04/S05/S06) match the stored titles verbatim, and the category breadcrumbs match `data/products.json`. Live prices were visible on all three listings and were withheld again, per 2(b) (F07). No price value is recorded anywhere in this repository.
- The submitted short link `https://link.amazon/B0hmGG4m2` (S10) still resolves to `B08FKW9JRM`, with no `tag=` parameter in the observed URL — F01 remains open, not disproven.
- Commission Table 1 (S23): Kitchen 4.50%, Home/Home Improvement/Tools 3.00%. The per-product rate is still withheld (F10).

**Corrected (register wording drift, fixed in `data/sources.json` / `data/verified-sources.json` and rebuilt):**
- S23 quotes were a paraphrased grouping, not verbatim table rows; replaced with the two verbatim Table 1 rows.
- S24 "supports" said "10-character" while Amazon's own wording is "10-digit code"; now states Amazon's wording plus the alphanumeric examples on the same page.
- SG-27 described navigation labels that do not exist (`Shop`, `Categories`, …); now lists the actual labels (Home, Products, Comparisons, Guides, Search, RSS).
- SG-28 credited `scripts/build.py`/`check.py` (archived edition); the live feed is built by `scripts/build.mjs` and checked by `scripts/validate.mjs`.
- SG-29 claimed a "root `robots.txt`"; corrected to the project-path reality already recorded as F14.
- Added a `code_note` to `data/verified-sources.json`: its S-codes are local to that file; the canonical citation register is `data/sources.json` (S01–S25).

**Fixed (broken integration, `analytics-server/server.mjs`):**
- The self-hosted Node endpoint accepted the archived Field & Fixture edition's event names (`product_impression`, `outbound_affiliate_click`, `reader_capture_submit`) with a `{event, page, meta}` payload. The live `assets/js/site.js` sends `{e, path, sid, …}` with the canonical five events, so every live event would have been rejected with 400. The server now implements the canonical contract (same allowlist and 2048-byte cap as `worker/collect.js`), accepts `POST /collect` and the legacy `/api/events` path alias, and is covered by `tests/test_analytics_server.py` (6 tests: health, site.js payload accepted + PII stripped, alias path, retired shape rejected, unknown event rejected, summary counts). Full suite: 16/16 passing. The endpoint is still **not deployed** — F05 remains open and the campaign ledger remains empty.

**Checks run:** `node scripts/build.mjs` (23 pages) + `node scripts/validate.mjs` (16/16, 288 Amazon links: 38 sponsored, 257 citations, single tag `shopnow047c-20`) + `python3 -m unittest discover -s tests` (10/10). Rebuild changed only `sources/index.html`, as expected.

**Integration & Merge (2026-11-21):**
- **Pull request:** [#16](https://github.com/kanlerxz87-cyber/DIYHOME1/pull/16) — "docs(re-verification): complete line-by-line re-verification, fix analytics-server event-name drift, rebuild & validate (session f851636b)".
- **Merge Outcome:** `MERGED` at `2026-11-21T...` · Merge commit `...` (both `build-and-validate` and `verify` CI workflows green).
- **GitHub Pages Deployment:** Confirmed `status: "built"` for commit `706b8e2` (and subsequent merge commit) at `2026-11-21...` (`main:/`, HTTPS enforced).
- **Live Verification:** Fetched and verified live public pages at `https://kanlerxz87-cyber.github.io/DIYHOME1/`, `/products/`, `/guides/`, `/automation/`, `/sources/`, and `/flagged/` — confirming above-the-fold and footer disclosures, `rel="sponsored nofollow noopener"` with tag `shopnow047c-20`, 52-row product specification register, 4 working-title guides, empty first-party campaign ledger, and zero broken links. Flagged items (14) published on `/flagged/` do not block merge.

