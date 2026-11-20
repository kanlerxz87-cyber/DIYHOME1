# COORDINATION.md — DIY Home Upgrades Affiliate Platform & GitHub Pages Site

**Repository:** `kanlerxz87-cyber/DIYHOME1`  
**Live Site Target:** `https://kanlerxz87-cyber.github.io/DIYHOME1/`  
**Selected Tracking ID:** `shopnow047c-20`  
**Active Integration Branch:** `arena/d24c607b-diyhome1` (Arena single-branch workflow; PR target: `main`)  
**Last Updated:** 2026-11-20 UTC

---

## Shared Task Board

| Task ID | Task Description | Status | Owning Session | Branch | File Scope | Notes / Verification |
| --- | --- | --- | --- | --- | --- | --- |
| T-01 | Repository audit, Amazon link resolution, official policy & FTC verification | done | `arena-d24c607b` | `arena/d24c607b-diyhome1` | `COORDINATION.md`, `data/products.json`, `data/verification-ledger.json` | Verified all 4 submitted URLs (`link.amazon/B0hmGG4m2`, duplicate `link.amazon/B03QDuGdo`, `link.amazon/B0hpD2JGQ`) via live fetch against official `amazon.com` listings, Amazon Associates Policies, Creators API docs, FTC Endorsement Guides, and Google Search Central docs. |
| T-02 | Automation platform scripts, analytics server, and compliance validators | done | `arena-d24c607b` | `arena/d24c607b-diyhome1` | `platform/`, `analytics-server/`, `data/campaign-ledger.json`, `tests/`, `.github/workflows/ci.yml` | Verified via `validate-registry`, `validate-ledger`, `audit-site`, `unittest` (6/6 passing), and Node `server.mjs` smoke test. |
| T-03 | Publication & dashboard GitHub Pages site (landing, categories, guides, dashboard, flagged review, SEO feeds) | done | `arena-d24c607b` | `arena/d24c607b-diyhome1` | `index.html`, `categories/`, `guides/`, `dashboard/`, `review/`, `assets/`, `feed.xml`, `sitemap.xml`, `robots.txt`, `.nojekyll`, `README.md` | 13 HTML pages + XML sitemap + RSS feed + 359 links + 30 `rel="sponsored"` Amazon product links verified with 0 errors. |
| T-04 | End-to-end verification, PR creation, merge to `main`, and GitHub Pages live deployment check | in progress | `arena-d24c607b` | `arena/d24c607b-diyhome1` | `COORDINATION.md` | Opening PR from `arena/d24c607b-diyhome1` to `main`, merging, and confirming GitHub Pages build/deploy. |

---

## Verified Official Sources Registry

1. **Amazon Associates Program Operating Agreement (Updated Oct 15, 2025):** `https://affiliate-program.amazon.com/help/operating/agreement`
2. **Amazon Associates Program Policies (Updated Apr 14, 2026) — Commission Income Statement, Participation Requirements, IP License:** `https://affiliate-program.amazon.com/help/operating/policies`
3. **Amazon Associates Standard Commission Income Statement (Rate Schedule):** `https://affiliate-program.amazon.com/help/node/topic/GRXPHT8U84RAYDXZ`
4. **Amazon Associates Simple Text Link & ASIN Definition:** `https://affiliate-program.amazon.com/help/node/topic/GP38PJ6EUR6PFBEC`
5. **Amazon Associates SiteStripe Help:** `https://affiliate-program.amazon.com/help/node/topic/GJMMT7G4C8K4Y3AY`
6. **Amazon Associates Mobile GetLink Help:** `https://affiliate-program.amazon.com/help/node/topic/GH37MDS5PLQ9Z366`
7. **Amazon Creators API — PA-API 5 Deprecation Notice:** `https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation`
8. **FTC Endorsement Guides — What People Are Asking:** `https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking`
9. **FTC Disclosures 101 for Social Media Influencers:** `https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers`
10. **Google Search Central — Qualify Outbound Links (`rel="sponsored"`):** `https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links`
11. **Official Amazon Product Listing (`B08FKW9JRM`):** `https://www.amazon.com/dp/B08FKW9JRM`
12. **Official Amazon Product Listing (`B0BSKQW2T2`):** `https://www.amazon.com/dp/B0BSKQW2T2`
13. **Official Amazon Product Listing (`B08DY9HRWD`):** `https://www.amazon.com/dp/B08DY9HRWD`

---

## Flagged Irregularities Log (`needs review`)

- **IR-01 (Unverified Intended ASINs):** Submitted URLs (`link.amazon/B0hmGG4m2`, `link.amazon/B03QDuGdo`, `link.amazon/B0hpD2JGQ`) use 9-character short codes rather than 10-character ASINs. `intended_asin` is left blank and flagged as unverified; `observed_redirect_target` is stored separately and never merged.
- **IR-02 (Duplicate Submitted Link):** `https://link.amazon/B03QDuGdo` was submitted twice consecutively in the source input (Lines 2 and 3). Consolidated to 1 canonical product record while preserving both raw input rows in the audit register.
- **IR-03 (Intermittent HTTP 500 on Short Link Redirect):** First fetch of `https://link.amazon/B0hmGG4m2` on 2026-11-20 returned `HTTP 500`; second fetch succeeded and redirected to `B08FKW9JRM`.
- **IR-04 (Unresolved Short Link Compliance / Missing Visible `tag=` Parameter):** None of the three observed `link.amazon` redirect destinations displayed a `tag=` query parameter (they carried `btn_type=ss`, `btn_ref=srctok-...`, `channelId=500`, `plpRedirect=mhFallback`). Exact compliance and attribution status under `shopnow047c-20` is unresolved until one Special Link per product is tested in the enrolled Associates workflow and confirmed in Associates reports. Do not claim the supplied short links are invalid.
- **IR-05 (Static Price & Star Rating Display Gate):** Per Amazon Associates Participation Requirements §2(b) and §6(t), live prices, availability, and customer star ratings/reviews cannot be statically republished without Amazon-served widgets or Creators API (PA-API 5 is deprecated). Audit snapshots are timestamped `2026-11-20 UTC` for review only; buyer-facing pages direct users to Amazon for current price and reviews until Creators API is connected.
- **IR-06 (Commission Rate Category Ambiguity for Home & Kitchen):** Both `B0BSKQW2T2` and `B08DY9HRWD` sit in `Home & Kitchen › Kitchen & Dining › Storage & Organization`. Amazon's Standard Commission Income Statement lists `Kitchen` at `4.50%` and `Home` / `Home Improvement` at `3.00%`. Exact fee tier per ASIN is left blank/unconfirmed until verified in a first-party Associates report.
- **IR-07 (ORDORA Listing Discrepancies & Prime-Exclusive Price):** `B08DY9HRWD` displays a Prime-exclusive price ($17.74 vs $23.99 regular), lists "Up to 11"" in the title vs "up to 12 inches" in product bullets, and shows a newer heavy-duty model (`B0BYYTQMTR`) on the listing page.
- **IR-08 (Self-Hosted Analytics Endpoint & Search Console Verification):** GitHub Pages is static hosting; the 5-event privacy-preserving client tracker operates with local browser storage preview until a self-hosted analytics endpoint URL is configured and deployed, and Google Search Console property verification is completed by the domain owner.

---

## Pull Request & Deployment Record

*(To be updated upon PR creation, merge to `main`, and live GitHub Pages verification.)*
