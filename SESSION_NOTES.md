# Session notes — 21 November 2026

A short index of what this session shipped, and where to check it. The full audit trail is in
`COORDINATION.md`; the buyer-facing version is on the site.

**Live site:** https://kanlerxz87-cyber.github.io/DIYHOME1/
**Tracking ID in use:** `shopnow047c-20` (used exactly as supplied; enrolment unverified — F01/F12)

---

## The deliverables

| What | Where |
|---|---|
| **Executive summary** (what was verified, refused, and left blocked) | `EXECUTIVE_SUMMARY.md` — also published at `/summary/` |
| **Task board, claims, conflict log, sources per task** | `COORDINATION.md` |
| **Flagged for review** — 21 items, each with what would close it and a source link | `/flagged/` on the site, data in `data/flagged.json` |
| **Source register** — 32 official sources with quoted support | `/sources/` on the site, data in `data/sources.json` |
| **Product-intent record** — intended vs observed kept strictly separate | `data/product-intents.csv`, `/ledger/` |
| **Specification register** — 52 rows, official source link on every row | `data/product-specs.json`, `/products/comparisons/` |
| **Pull request and merge result** | PR #23 — see the top of this note's section in `COORDINATION.md` |

## What changed in this session

1. **The landing page now leads with the products.** A shop-first hero, a "which one is your job?"
   picker that maps each product to a reader situation (and says plainly these are three different
   jobs, not three rankings), and cards carrying material, size, weight, mounting and box contents
   pulled from the specification register rather than retyped. The verification apparatus moved into
   one compact band below the shop.
2. **Every external claim was re-read on 21 November 2026.** All four supplied short links fetched
   again; all three resolved to the same ASINs. See the three findings that changed a conclusion:
   - The missing `tag=` parameter in the redirects is **not** evidence of lost tracking — Amazon's own
     help topic says the ID is not expected to appear there (S30). F01 reframed.
   - Amazon's ASIN definition and the documented `/dp/ASIN/ref=nosim?tag=` link format are now
     quoted from a public page read without signing in (S31).
   - The public commission rate table is readable without sign-in: **Kitchen 4.50%**,
     **Home/Home Improvement/Tools 3.00%** (S32). A band is not a payout, so no percentage is published.
3. **Blanks now explain themselves.** Two listings expose no UPC; two expose no first-available date.
   Each blank cell carries a dated note saying exactly what was checked.
4. **The machinery got harder to fool.** Counts are computed from the data at build time (F20); the
   unit test asserts the audit counted every registered source instead of pinning a number that goes
   stale; dynamic listing values are stored for audit but never rendered (F21).

## What is deliberately *not* on the site

No prices, star ratings, review counts, availability, product imagery, commission percentages,
conversion scores or revenue forecasts. Reasons and policy sources: `/disclosures/`.

## What still needs an account this build does not have

- **F01 / F12** — Associates enrolment of the supplied links and of the tracking ID. Only an
  Associates report settles this. The short links are recorded as provenance and are never claimed invalid.
- **F04** — a Search Console verification token.
- **F05** — a host for the analytics collector, so the five defined events currently stay in the browser.

## How to check the site yourself

```sh
node scripts/build.mjs      # regenerate every page from data/
node scripts/validate.mjs   # 19 check groups: links, disclosure, tags, sitemap, data integrity
python3 -m unittest discover -s tests -v
```
