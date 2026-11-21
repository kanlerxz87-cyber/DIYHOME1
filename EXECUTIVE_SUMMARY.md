# Executive summary — DIY Home Upgrades

**Prepared:** 20 November 2026 · **Re-verified and revised:** 21 November 2026 (sessions `S-2026-11-21-B` and `S-2026-11-21-C`) · **Site:** https://kanlerxz87-cyber.github.io/DIYHOME1/
**Associates tracking ID used:** `shopnow047c-20` (as supplied; enrolment not verified — see F01, F12)

---

## 0. What changed on 21 November 2026

A second verification pass re-read every external claim. What it changed:

| Item | Before (20 Nov) | After re-verification (21 Nov) |
|---|---|---|
| The three supplied short links | Resolved, but no `tag=` parameter in the redirect, recorded as an open concern | Still resolve to the same three ASINs. Amazon's own help topic now quoted (S27): the tracking ID is **not expected** to appear in the URL after click-through, because the session is tagged for attribution. So a missing `tag=` is **not evidence** of lost tracking; only an Associates report settles it. **F01** downgraded high → medium. |
| Amazon's ASIN definition | Behind a sign-in wall on Seller Central (F06) | Read without sign-in in the public Associates help topic (S28), which also gives Amazon's documented link format `/dp/ASIN/ref=nosim?tag=YOURASSOCIATEID`. **F06** downgraded to info. |
| Commission rates (F10) | Rate card "could not be verified" | The public Standard Commission Income Statement was read again (S29): **Kitchen 4.50%**, **Home/Home Improvement/Tools 3.00%**. The supplied products sit in those two bands. Per-SKU payout and any conversion figure remain unverified. **F10** medium → low. |
| Blank specification fields | Blank, with the reason given once | Each blank now carries a dated note saying exactly what was checked: two listings expose **no UPC**, two expose **no Date First Available**. Verified by re-reading the "Product information" and "Item details" tables on 21 Nov. |
| Front page | Led with the verification method | Leads with the products. Each card shows material, size, weight and mounting pulled from the specification register, with the date read. The verification story is one compact band further down. |
| Flag and row counts | Partly hardcoded in the templates | Computed from `data/*.json` at build time (F15), so a published count cannot drift from the register behind it. |

Still open, unchanged, and still needing an account this build does not have: Associates enrolment of the tag (F01/F12), a Search Console token (F04), and an analytics host (F05).



### Second pass — what the third session added

- **The tables were reachable after all.** F16 recorded that Amazon did not render the Product Information tables on 21 November. That was true of the desktop page; `https://www.amazon.com/gp/product/<ASIN>` does render them. 11 fields of B08FKW9JRM and 10 of B0BSKQW2T2 were re-confirmed verbatim there.
- **Six ORDORA fields stayed unconfirmed and were downgraded, not kept.** B08DY9HRWD kept serving the reduced layout, so its model number, manufacturer part number, UPC, per-tier limit and included components — and the "Ships from / Sold by" line for all three listings — now read *Needs Review* instead of *Verified*. Register: 29 Verified / 13 Needs Review / 10 Unverified of 52. Nothing was re-typed or inferred.
- **Three build defects fixed:** the `/about/` contradiction, status-blind cells in the comparison matrix, and an audit engine that called all 52 rows "verified".


---

## 1. What exists now

A static, multi-page affiliate publication built from `data/*.json`, published by GitHub Pages from `main:/`, with:

| Surface | What it is |
|---|---|
| `/` | Front page: three products first, then guides, how the page is checked, and zero-PII RSS reader capture (`SG-30`) |
| `/products/` | Filterable product register, one row per product, each row linking to its official listing |
| `/products/wallpaper-tools/`, `/products/kitchen-storage/` | Category pages |
| `/products/comparisons/` | Side-by-side physical specification comparison matrix across all three products |
| `/products/<slug>/` ×3 | Product pages with a full verification record + a 52-row line-by-line specification register (17 / 17 / 18 rows) |
| `/guides/` + 4 guide pages | Question-shaped DIY buying guides + the 4 working-title countertop-appliance editorial hypotheses |
| `/about/` | Method, definition of "verified", automation boundaries |
| `/automation/` | 7-stage automation & compliance gate CLI (`validate.mjs`, `platform_engine.py`, `creators_api_client.py`) |
| `/disclosures/` | Affiliate disclosure, link policy, privacy, withheld data |
| `/sources/` | Register of 32 official sources, a dated re-verification record + `SG-27..SG-30` parallel passes + 52-row product spec verification ledger |
| `/flagged/` | 21 flagged items with severity, what would close each one, and official sources on every row |
| `/measurement/` | Five defined events, privacy rules, honest status, local event viewer |
| `/ledger/` | 4-row Product-intent confirmation record (strictly separate from observed redirects) + empty campaign ledger |
| `/summary/` | This summary, on the site (all dashboard surfaces grouped under `Site desk` in top nav & repeated in footer) |
| `sitemap.xml`, `feed.xml`, `robots.txt`, `.nojekyll` | Findability plumbing |

No prices, no star ratings, no review counts, no product images, no commission percentages, no conversion scores, no revenue forecasts. Every one of those omissions is explained on `/disclosures/` and justified by a source.

---

## 2. Link verification — what the four supplied links actually are

Four links were supplied; one was a duplicate, so three distinct links were resolved.

| # | Supplied link | Resolved to | Listing title (re-read 2026-11-21; identical to 2026-11-20) |
|---|---|---|---|
| 1 | `https://link.amazon/B0hmGG4m2` | `https://www.amazon.com/dp/B08FKW9JRM` | Art3d Smoothing Tool Kit for Peel and Stick Wallpaper \| Vinyl Backsplash Tile, Complete Basic Tool Set, Bubble & Crease Removal, Ergonomic Grip, Safe for DIY and New Home Buyer |
| 2 | `https://link.amazon/B03QDuGdo` | `https://www.amazon.com/dp/B0BSKQW2T2` | Paper Towel Holder Under Cabinet, Self-Adhesive or Drilling, Matte Black \| Kitchen Roll Dispenser \| Under-Cabinet or Wall-Mounted\| Upgraded Aluminum \| Lighter Yet Stronger Than Stainless Steel |
| 2 (dup) | `https://link.amazon/B03QDuGdo` | same as #2 | Duplicate submission — counted once |
| 3 | `https://link.amazon/B0hpD2JGQ` | `https://www.amazon.com/dp/B08DY9HRWD` | ORDORA Pots and Pans Organizer Under Cabinet 16.6", 8-Tier Adjustable Rack \| 3 DIY Modes, Tool-Free Assembly, Non-Slip, Fits Lightweight Cookware Up to 11", For Kitchen Cabinets, Shelves & Countertops |

**Two things this proves, and one it does not.**

- **Proves:** each short link reaches a live product page on both 20 and 21 November 2026; the three targets are distinct; the short-link tokens (`B0hmGG4m2`, `B03QDuGdo`, `B0hpD2JGQ`) are not ASINs — they are not the 10-digit item code Amazon defines (S28), and `/dp/B0HMGG4M2` returns no product page.
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

## 5. Flagged for review (19 items)

High: **F01** — short links not confirmed as enrolled/tracked.
Medium: **F03** air-fryer working titles have no matching products; **F04** no Search Console token; **F05** no analytics endpoint, so events stay local; **F10** commission rates unverifiable; **F13** verification fetches did not identify as an agent.
Low: **F02** duplicate link supplied; **F14** robots.txt sits inside the project path, not at the host root (source added 21 Nov: S26); **F06** Amazon's ASIN definition is behind a sign-in; **F11** one listing has no brand in its title; **F12** tracking ID enrolment unconfirmed; **F15** five source quotes were not verbatim and have been corrected; **F16** the Product Information tables could not be re-read on 21 Nov.
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

## 7a. Verification performed on 21 November 2026

A second, independent pass re-opened every source that carries a quote and compared the quoted strings with the live page text. Results:

| Source | Checked against | Result |
|---|---|---|
| S01 Amazon Program Policies (updated 14 Apr 2026) | Live page, Participation Requirements 2(b), 3(b), 3(t), 3(v), 3(w), 3(y); IP License 2(h); Agent Terms | All nine quotes match after one correction: an elided "..." was replaced with the full sentence |
| S02 Operating Agreement (updated 15 Oct 2025) | Live page, sections 1 and preamble | Matches |
| S03 FTC *Disclosures 101* (November 2019) | Live page | Matches |
| S04 / S05 / S06 product listings | `/dp/B08FKW9JRM`, `/dp/B0BSKQW2T2`, `/dp/B08DY9HRWD` | Titles, breadcrumbs, merchant lines, the three ORDORA dimension strings and the "niffgaff" store link all re-confirmed; Product Information tables did not render, so those rows are unchanged and disclosed as F16 |
| S07 GitHub Pages publishing docs | Live page | Matches after restoring a truncated parenthetical |
| S08 Google sitemap docs | Live page | One quote was a section heading; replaced with the sentence "Google accepts RSS 2.0 and Atom 1.0 feeds." |
| S09 Search Console ownership | Live page | Matches |
| S10 / S12 submitted short links | Live resolves to B08FKW9JRM and B08DY9HRWD | Re-confirmed; no `tag=` parameter appears, so enrolment remains unconfirmed (F01) |
| S19 robots.txt introduction | Live page | One quote appeared only in a related-content card; replaced with body text |
| S21 niffgaff storefront | Live listing link and store page | "Visit the niffgaff Store" re-confirmed on the listing |
| S23 Standard Commission Income Statement | Live public Table 1 | Both quotes were paraphrases; replaced with the exact rows. The earlier paraphrase wrongly put Pantry in the 3.00% row |
| S24 Associates help, ASIN definition | Live page | Matches |
| S25 USDA FSIS air-fryer guidance (updated 24 Jun 2024) | Live page | Both quotes were paraphrases; replaced with the exact sentences |
| S26 Google robots.txt creation guide (new) | Live page | Added for the robots.txt location rule cited by F14 |

Not re-checked in this pass, and labelled as such on the site: S11, S13, S15, S16, S17, S20, S22. The build, the validator and `platform_engine.py audit` all passed after those edits (16 check groups and 10 unit tests at the time of that pass; the later merge brings the tree to 19 check groups and 16 tests).

## 8. Parallel sessions and the merged publication

`main` advanced through PRs #1–#8 from four other Arena sessions before this branch merged. Those sessions published a different edition — "The Practical Home" — which deliberately showed **no products** at all: its build only rendered a product card once a Special Link and an Associates tracking report existed.

This integration did not discard it. The earlier edition is preserved intact at `/archive/practical-home/` with its data (`catalog.json`, `redirects.csv`), Python build and check scripts, analytics worker, acceptance and release-review harnesses, all still runnable in place. Three things were added to it, by the committed script `archive/practical-home/scripts/preserve-archive.py`: absolute URLs rewritten to the archive path, `noindex`, and a banner linking back here. It is excluded from `sitemap.xml`, so one publication is indexed.

The live root is now the product-led edition, because the brief's first priority was to lead with products, and a shop with zero products cannot do that. Both editions' findings agree on the substance: the three distinct short links resolve to three distinct ASINs, the fourth submission is a duplicate, and no tracking attribution can be confirmed without Associates Central access.

Prior sessions' board and logs are reproduced verbatim in `COORDINATION.md`.

## 9. Where it stands

The site builds and passes every check. Three things need account access the build did not have: Associates tracking confirmation, Search Console verification, and an analytics host. All three are published on `/flagged/` with what would close them.

Nothing on this site is presented as verified beyond what an official source supports on the date shown. Where that could not be established, the value is blank and the gap is named.

---

<!-- Two sessions published a 2026-11-21 revision. Both records are kept: section 10 is the earlier
     S-2026-11-21-F pass (analytics-server fix, register wording), section 11 is the later
     S-2026-11-21-B pass (spec-register citations, VS namespaces, re-verification scope). -->

## 10. Addendum — 2026-11-21 re-verification (S-2026-11-21-F, branch `arena/f4d33765-diyhome1`)

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
- Added a `code_note` to `data/verified-sources.json`: its S-codes are local to that file; the canonical citation register is `data/sources.json` (S01–S26).

**Fixed (broken integration, `analytics-server/server.mjs`):**
- The self-hosted Node endpoint accepted the archived Field & Fixture edition's event names (`product_impression`, `outbound_affiliate_click`, `reader_capture_submit`) with a `{event, page, meta}` payload. The live `assets/js/site.js` sends `{e, path, sid, …}` with the canonical five events, so every live event would have been rejected with 400. The server now implements the canonical contract (same allowlist and 2048-byte cap as `worker/collect.js`), accepts `POST /collect` and the legacy `/api/events` path alias, and is covered by `tests/test_analytics_server.py` (6 tests: health, site.js payload accepted + PII stripped, alias path, retired shape rejected, unknown event rejected, summary counts). Full suite: 16/16 passing. The endpoint is still **not deployed** — F05 remains open and the campaign ledger remains empty.

**Checks run:** `node scripts/build.mjs` (23 pages) + `node scripts/validate.mjs` (16/16, 288 Amazon links: 38 sponsored, 257 citations, single tag `shopnow047c-20`) + `python3 -m unittest discover -s tests` (16/16). Rebuild changed only `sources/index.html`, as expected.

---

## 11. Revision, 21 November 2026 — audit and correction pass

Session `S-2026-11-21-B` (branch `arena/0b735892-diyhome1`). This pass changed metadata, citations and build gates. No published attribute value changed, and no blank field was filled.

**Re-read on 2026-11-21.** All three listings were opened again.
- `B08FKW9JRM`: the full Technical Details and Additional Information tables — manufacturer, part number, model number, item weight, product dimensions, material, handle material, ASIN, Date First Available and breadcrumb. Unchanged.
- `B0BSKQW2T2`: title, brand, material and finish, mounting type, and the 12.2-inch rail length stated in the listing's "About this Item" block. Unchanged.
- `B08DY9HRWD`: title and brand. Unchanged.

Every other row keeps its 2026-11-20 date rather than being re-dated. The per-product scope is recorded in `data/product-specs.json` and published as flag F19; F16 records the same gap from a different sandbox.

**Corrected, each now gated by `scripts/validate.mjs`:**
- `data/product-specs.json` named `S01`, `S02`/`S03` and `S04` as the submission sources for the three products. The submitted links are `S10`, `S11` and `S12`. Corrected (F18).
- The same file pointed at three guides that have never existed (`guides/peel-and-stick-tools.html`, `guides/adhesive-vs-drilled-mounts.html`, `guides/cabinet-pan-rack-fit.html`) and at two category slugs absent from `data/site.json`. Corrected (F18).
- `data/verified-sources.json` reused the canonical register's `S__` labels for 24 different documents, so `S01` meant one page in one file and another page in the other. It now uses `VS01`–`VS24` and states that it is a 2026-11-20 snapshot (F17).
- `SG-27`–`SG-30` described navigation labels, a build script (`scripts/build.py`) and a root `robots.txt` that do not match this edition. Each row now describes what actually ships, names what its source supports, and cites a document that supports that specific claim.
- The parallel-pass table silently substituted a sitemap document for `SG-28`'s self-referential citation. That substitution is removed; a self-citation now fails the build.

**Sources added on 2026-11-21, each read before citing:** `S27` RSS 2.0 Specification (RSS Advisory Board), `S28` SEO Starter Guide (Google Search Central), `S29` Privacy and Security (U.S. FTC). `S26` was already taken by the robots.txt guide added in the S-2026-11-21-F/`arena/16905ff3` pass, so these three follow it rather than displacing it.

**Verification:** `node scripts/build.mjs` → 23 pages; `node scripts/validate.mjs` → 19 check groups, 0 errors, 0 warnings; `python3 -m unittest discover -s tests` → 16 tests pass (10 pre-existing + 6 analytics-server tests added by S-2026-11-21-F). The new gates were tested by deliberately breaking a submission ID, a guide slug and an SG citation: all three failed, then passed once the data was restored.

**Not claimed:** Associates enrolment for any link, click attribution, Search Console indexing, analytics collection, commission rates or revenue. F01–F16 stand unchanged; F17–F19 are the new findings.
