# DIY HOME · The everyday upgrade

Buyer-first static publication for practical home upgrades.

Live URL: https://kanlerxz87-cyber.github.io/DIYHOME1/

## Build and test

Python 3.12, standard library only. No npm dependencies or external fonts.

```sh
python scripts/build.py --publish-root
python -m unittest discover -s tests -v
python -m http.server 3000 --bind 0.0.0.0 --directory _site
```

The source of truth is `scripts/build.py` and `data/`. Generated `_site/` stays out of Git. GitHub Actions tests PRs and checks generated output consistency. Existing GitHub Pages branch publishing deploys main:/ automatically. `--publish-root` exports the generated site to the checked-in root HTML/XML files and assets required by that configuration. The Pages configuration API returned 403 for changing modes, so the existing publishing mode is preserved. All public pages include canonical metadata, disclosure, footer operations navigation and source notes. Guides automatically enter RSS and the sitemap.

## Evidence and gates

The four supplied links contain a duplicate; all submissions are preserved through counts. `data/products.json` keeps observed redirects separate from intended ASIN, official confirmed listing, date and source. All confirmation fields remain null. Product titles are observed Amazon listing titles, not independently tested claims. Prices, ratings and commissions are blank intentionally.

Official sources checked on 2026-11-20:
- https://affiliate-program.amazon.com/help/operating/agreement (Sections 1, 5)
- https://affiliate-program.amazon.com/help/operating/policies (index and opening commission terms; full API policy review pending)
- https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers
- Amazon listing titles reached through all three unique submitted short links; see JSON for exact submitted and observed canonical URLs.

Direct Python HTTP requests were blocked by sandbox egress; the page-fetch tool successfully retrieved the official pages. Redirect observation is not product-intent or Special Link compliance confirmation. No short link is asserted invalid. S01/S02/S07/S24 and SG check documents were not supplied.

`gate.eligible` fails closed unless a matching intended ASIN, source/date, official listing, tagged direct Special Link and enrolled-report confirmation exist. Current renderer intentionally never uses Special Links; it shows only transparent observed listings. Future monetized rendering must use this gate and current policy review, never simply append a tag to ambiguous short links.

## Analytics: implemented, not live

GitHub Pages cannot run the collector. `analytics/server.py` implements `/events` with SQLite daily aggregates, input allowlists, 1 KB request cap, 90-day aggregate retention, origin enforcement and no application access logs. It does not store IP addresses, user agents, referrers or visitor IDs. The client respects DNT/GPC, has no storage and only sends events if `data/config.json` has an endpoint.

The five event names are a proposed definition because none was supplied: page_view, guide_open, outbound_click, category_select, feed_open. Outbound clicks are not orders. `data/campaigns.csv` stays empty until authorized first-party reports with dated provenance are available.

To enable after obtaining hosting: deploy collector behind a same-origin TLS reverse proxy at `/events`; restrict request rates, body sizes, timeouts and origin; disable/minimize infrastructure logs; persist the SQLite file outside the repository with restricted permissions; run `python scripts/build.py` before starting the collector so page allowlists exist; set `ANALYTICS_ORIGIN` and `ANALYTICS_DB`; set site config endpoint to the same-origin proxy path, rebuild and test events. Do not point a Pages browser to localhost. No backend hosting, AI provider, Amazon account/API, Search Console or report access was provided. These cannot honestly be declared activated.

## Editorial cadence

Proposed Tuesday publication after Monday evidence review; monthly query/report review before selecting the next topic. Existing guide copy is AI-assisted original checklists, not expert testing. No search-volume, trend, revenue or profitability claims. RSS is the working reader-subscription path; email capture is not faked. Public limitations: `flagged.html`.
