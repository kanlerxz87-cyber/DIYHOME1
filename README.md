# The Practical Home

GitHub Pages publication: https://kanlerxz87-cyber.github.io/DIYHOME1/

Build with `python3 scripts/build.py`, check with `python3 scripts/check.py`, and preview with `python3 -m http.server 8000`. Pages publishes the generated files from the root of `main`. Commit generated HTML/XML together with source changes. Update `data/guides.json` and the edition date in the build for a new edition. This repository has no AI provider or enrolled Associates session configured.

## Measurement

The event contract is `page_view`, `guide_view`, `rss_open`, `affiliate_click`, and `reported_orders`. The first four are aggregate counters. Reported orders belong only in the authorized first-party campaign ledger (`data/campaign.csv`); the public collector deliberately rejects them. RSS events count link activations, not subscriptions. This design does not estimate unique visitors or eligible sessions from page views.

To deploy analytics, run `python3 analytics/server.py` on infrastructure you control, with a TLS proxy, request-size/time limits, rate limiting, persistent SQLite volume outside the public site directory, and no access logs. Set `SITE_ORIGIN` to the exact Pages origin, `METRICS_DB` to the persistent path and `PORT` to the upstream port. Add the HTTPS `/events` URL to `data/catalog.json` and rebuild. Counts older than 90 days are removed on receipt of the next valid event; schedule deletion separately if a hard retention limit is required. Query the local SQLite database with operator access only. Origin checks do not authenticate a browser or prevent spoofed traffic; counters are directional, not order evidence.

## Verification and publishing

The Research register preserves all four submissions. `specialLink` must stay empty until the intended ASIN, listing, dates, confirmation and report evidence are available. Keep sensitive report artifacts outside the public repo and only use non-sensitive provenance references. Test in the enrolled Associates workflow before enabling a listing. See the Executive summary and Flagged for Review pages for official references and limitations. There are no imported conversion rows, verified trend claims, or authorized API credentials. Search Console ownership and production analytics activation require external infrastructure/account access not available in this session.
