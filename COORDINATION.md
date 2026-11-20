# COORDINATION.md — Shared Task Board (`DIYHOME1`)

## Session Branch Note
- Active Session ID: `session-3e199a4b`
- Working Branch: `arena/3e199a4b-diyhome1` (fixed by Arena runtime; branched from `faef47897b70ec6570215b9414849a2ef794e836` on `main`)
- Selected Amazon Associates Tracking ID: `shopnow047c-20`

## Shared Task Board

| Task ID | Task Description | Status | Owning Session ID | File Scope | Verification & Notes |
|---|---|---|---|---|---|
| `T-01` | Repository audit (`README.md`, branch state, GitHub Pages configuration) & line-by-line official source verification | `in progress` | `session-3e199a4b` | `COORDINATION.md`, `data/repo-audit.json` | Inspecting initial commit `faef478` and GitHub Pages settings |
| `T-02` | Official policy & link verification (`https://link.amazon/B0hmGG4m2`, `https://link.amazon/B03QDuGdo` x2, `https://link.amazon/B0hpD2JGQ`; Amazon Associates Operating Agreement, Special Links, ASIN docs, FTC Endorsement Guides) | `in progress` | `session-3e199a4b` | `data/products.json`, `data/sources.json`, `data/flagged-items.json` | Strict separation of `intended_asin`/`official_listing_url` vs `observed_redirect_target`; zero hallucinated fields |
| `T-03` | Privacy-preserving 5-event analytics client, outbound-click counter, self-hosted collector endpoint, and empty first-party campaign ledger | `in progress` | `session-3e199a4b` | `assets/js/analytics.js`, `server/analytics-server.mjs`, `data/campaign-ledger.json` | Five defined events; no fabricated conversion scores or revenue forecasts |
| `T-04` | Automation machinery, product research/content generator CLI, compliance gate (`S01`, `S02`, `S07`, `S24`, `SG-27..SG-30`), and automated verification suite | `in progress` | `session-3e199a4b` | `scripts/*.mjs`, `.github/workflows/verify-and-deploy.yml`, `package.json` | Automated build, HTML disclosure check, `rel="sponsored"` check, link & source check |
| `T-05` | Publication front page, shop/category pages, question-shaped guides, executive summary, dashboard surfaces, RSS `feed.xml`, `sitemap.xml`, `robots.txt`, and `Flagged for Review` page (Final Integration) | `in progress` | `session-3e199a4b` | `index.html`, `shop/`, `categories/`, `guides/`, `dashboard/`, `flagged-for-review.html`, `feed.xml`, `sitemap.xml`, `robots.txt`, `assets/css/styles.css` | Final integration, zero-broken-link check, PR & merge to `main`, GitHub Pages live verification |

## Activity Log

- `2026-11-20T05:56:00Z` (`session-3e199a4b`): Checked repository root on `arena/3e199a4b-diyhome1` (base `faef478` on `main`). Only `README.md` (`# DIYHOME1`, 10 bytes) existed on `main`; `COORDINATION.md` did not exist. Created `COORDINATION.md` and claimed `T-01` through `T-05` for full verification, platform build, publication site generation, and integration on `arena/3e199a4b-diyhome1`.
