# Executive summary — DIY Home Upgrades

**Prepared:** 21 November 2026 · **Branch:** `arena/e70af6c4-diyhome1` · **Site:** https://kanlerxz87-cyber.github.io/DIYHOME1/
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
| `/products/<slug>/` ×3 | Product pages with a full verification record + line-by-line official specification table |
| `/guides/` + 4 guide pages | Question-shaped DIY buying guides (each explicitly mapped to its matching product(s)) + 4 working-title countertop-appliance editorial hypotheses |
| `/about/` | Method, definition of "verified", automation boundaries |
| `/automation/` | 7-stage automation & compliance gate CLI (`validate.mjs`, `platform_engine.py`, `creators_api_client.py`) |
| `/disclosures/` | Affiliate disclosure, link policy, privacy, withheld data |
| `/sources/` | Register of 27 official sources + `SG-27..SG-30` parallel passes + 52-row product spec verification ledger |
| `/flagged/` | 14 flagged items with severity, what would close each one, and official sources on every row |
| `/measurement/` | Five defined events, privacy rules (DNT/GPC enforced across all 5 events), honest status, XSS-safe local event viewer |
| `/ledger/` | 4-row Product-intent confirmation record (strictly separate from observed redirects) + empty campaign ledger |
| `/summary/` | This summary, on the site (all dashboard surfaces grouped under `Site desk` in top nav & repeated in footer) |
| `sitemap.xml`, `feed.xml`, `robots.txt`, `.nojekyll` | Findability plumbing |

No prices, no star ratings, no review counts, no product images, no commission percentages, no conversion scores, no revenue forecasts. Every one of those omissions is explained on `/disclosures/` and justified by a source.

---

## 2. Link verification — what the four supplied links actually are

Four links were supplied; one was a duplicate, so three distinct links were resolved.

| # | Supplied link | Resolved to | Listing title (read on 2026-11-20) |
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
| Every outbound product link to Amazon carries `rel="sponsored nofollow noopener"` and the tag parameter | Amazon Program Policies, Participation Requirements 2(b) (`S01`), Associates simple text link guide (`S24`), and Google Search Central outbound link qualification (`S27`) |
| No prices, availability, star ratings or customer reviews | Program Policies 2(b) & 3(t) (`S01`, `S18`) and Creators API PA-API 5 Deprecation Notice (`S26`) — PA-API 5.0 is deprecated and replaced by Creators API |
| No price tracking or price alerts anywhere | Program Policies 3(y) |
| No redirector or cloaking; the click counter observes and lets the browser navigate | Program Policies 3(v) (no obscuring the URL containing Special Links) |
| No link shortener in front of any call to action | Program Policies 3(w) |
| No product imagery or Amazon marks | IP Licence terms over Program Content; no licensed feed or API access exists here |
| No "we tested it" language anywhere | FTC, *Disclosures 101*: "You can't talk about your experience with a product you haven't tried" |
| No SKU commission guarantees or earnings estimates | Account custom rate card (`/help/operating/schedule`, `S17`) redirects to sign-in; public Standard Commission Income Statement (`S23`) lists `Kitchen` at 4.50% and `Home` / `Home Improvement` / `Tools` at 3.00%, but exact SKU sub-node payout and conversion remain unverified until first-party Associates reports exist |

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
Medium: **F03** air-fryer working titles have no matching products (presented transparently as working-title checklists citing USDA FSIS `S25`); **F04** no Search Console token; **F05** no analytics endpoint deployed, so events stay local; **F10** account custom rate card requires sign-in (`S17`) and SKU payout tier unverified despite public `S23` schedule; **F13** verification fetches did not identify as an agent.
Low: **F02** duplicate link supplied; **F14** `robots.txt` sits inside the project path, not at the host root; **F06** Seller Central ASIN help (`S16`) requires sign-in and operator intended ASINs remain unconfirmed (public Associates Help `S24` confirms the 10-char ASIN definition); **F11** `B0BSKQW2T2` omits brand from H1 title (verified as `niffgaff` via `S05`/`S21`) and select listings omit UPC or Date First Available or have minor copy discrepancies; **F12** tracking ID enrolment unconfirmed.
Info (withheld by design): **F07** prices/ratings/reviews observed but not published (gated behind Creators API per `S01`/`S26`); **F08** nothing tested; **F09** no Amazon imagery.

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
No endpoint is configured, so no event leaves the browser; events are visible in the local viewer on `/measurement/` and can be exported. Both a Cloudflare Worker collector (`worker/collect.js`) and a self-hosted Node.js collector (`analytics-server/server.mjs`) are included and accept `POST /collect`. Until one is deployed and a first-party report exists, the campaign ledger has zero rows — and the validator fails the build if a row appears without one.

---

## 8. Parallel sessions, preserved editions, and 2026-11-21 audit remediation

Earlier parallel sessions built two alternate editions, both preserved intact under `archive/` with `noindex,follow` and a banner linking back to the live publication (excluded from `sitemap.xml` so search engines index one canonical site):

- `archive/practical-home/` — "The Practical Home" (PRs #2–#8), with its data (`catalog.json`, `redirects.csv`), Python build/check scripts, analytics worker, and QA harnesses (`acceptance-31f7/`, `release-review/`).
- `archive/field-and-fixture/` — "Field & Fixture" (PR #12), with its verification ledger, platform modules (`platform/affiliate_platform.py`, `platform/creators_api_client.py`), and unit tests (`tests/test_platform.py`).

The live root is the product-led edition (`DIY Home Upgrades`). On 2026-11-21, a line-by-line audit (`session-e70af6c4`) independently re-verified official Amazon Associates, Creators API deprecation (`S26`), Google outbound link qualification (`S27`), FTC, and USDA FSIS sources and fixed:
- DNT/GPC privacy bypass in `assets/js/site.js` (`record()` now returns immediately when DNT or GPC is set) and stored self-XSS in the `/measurement/` local event table (`textContent` DOM nodes instead of `tr.innerHTML`);
- Wrong guide→product mapping on `/guides/pot-pan-organizer-capacity/` (previously linked the paper towel holder instead of the ORDORA 8-tier rack) and multi-product mapping on `/guides/questions-before-under-cabinet-upgrade/`;
- Stale cross-file contradictions across `data/products.json`, `data/site.json`, `data/sources.json` (verbatim quotes for `S23` and `S25`), `data/product-specs.json` (live `guide_slug` paths and Creators API deprecation), `data/verified-sources.json` (`SG-27..SG-30`), `data/flagged.json` (`F06`/`F07`), and `scripts/content.mjs`;
- `analytics-server/server.mjs` extended to accept the canonical `POST /collect` 5-event schema alongside legacy `/api/events`.

Prior sessions' boards and logs are reproduced verbatim in `COORDINATION.md`.

## 9. Where it stands

The site builds and passes every check. Three things need account access the build did not have: Associates tracking confirmation, Search Console verification, and an analytics host. All three are published on `/flagged/` with what would close them.

Nothing on this site is presented as verified beyond what an official source supports on the date shown. Where that could not be established, the value is blank and the gap is named.
