# DIYHOME1 — Field & Fixture (DIY Home Upgrades)

**Live GitHub Pages Site:** [https://kanlerxz87-cyber.github.io/DIYHOME1/](https://kanlerxz87-cyber.github.io/DIYHOME1/)  
**Selected Tracking ID:** `shopnow047c-20`

## Overview

`DIYHOME1` hosts **Field & Fixture**, a shop-first DIY home upgrades publication paired with a transparent verification dashboard, automated compliance tooling, and a privacy-preserving 5-event analytics stack.

### Repository Structure

- `index.html` — Publication front page leading with curated product picks, room clusters, question-shaped guides, reader capture, and above-the-fold + footer Associates disclosures.
- `categories/` — Room & project category pages (`kitchen-storage.html`, `walls-surfaces.html`) with verified spec comparison tables.
- `guides/` — Question-shaped buyer guides (`paper-towel-holder-mounting.html`, `pot-rack-cabinet-sizing.html`, `peel-and-stick-smoothing-tools.html`) and editorial cadence table (`index.html`).
- `dashboard/` — Operations dashboard (`index.html`), Executive Summary (`executive-summary.html`), Verification & Product-Intent Register (`verification-register.html`), Campaign Ledger & Telemetry (`campaign-ledger.html`), and Automation & Compliance Gate (`platform-architecture.html`).
- `review/flagged.html` — Dedicated **Flagged for Review** page documenting all unverified items, duplicate submissions, redirect findings, and API/compliance gates with official source links.
- `data/` — Verified JSON source datasets (`products.json`, `verification-ledger.json`, `campaign-ledger.json`).
- `platform/` — Python CLI and site generator (`build_site.py`, `affiliate_platform.py`, `creators_api_client.py`).
- `analytics-server/server.mjs` — Zero-dependency Node.js self-hosted endpoint for the 5 defined privacy-preserving events.
- `feed.xml`, `sitemap.xml`, `robots.txt` — Discoverability and RSS feed files.
- `COORDINATION.md` — Shared task board, official sources registry, flagged irregularities, and PR/deployment log.

## Running Verification & Site Build Locally

```bash
python3 platform/build_site.py
python3 platform/affiliate_platform.py validate-registry
python3 platform/affiliate_platform.py validate-ledger
python3 platform/affiliate_platform.py audit-site
python3 -m unittest discover -s tests -v
```

## Disclosure

As an Amazon Associate I earn from qualifying purchases. All outbound product links include `rel="sponsored noopener noreferrer"`.
