# Campaign ledger — schema

The ledger is empty on purpose. No first-party report has been obtained, so no row exists.
Nothing here is estimated, modelled, back-filled or inferred.

Copy `data/campaign-ledger.csv`, keep the header, and add one row per dated report.

| Column | Meaning | Rule |
|---|---|---|
| `record_id` | Stable row id, e.g. `L-2026-12-01-A` | Never reuse |
| `timestamp_utc` | ISO 8601 UTC time the report was pulled | Not the date of the sales |
| `source` | Where the numbers came from: `associates-central`, `site-endpoint`, `search-console` | One source per row, never mixed |
| `channel` | `organic`, `direct`, `referral`, `unknown` | As reported, not as assumed |
| `eligible_sessions` | Sessions that could have converted | Blank if the source does not report sessions |
| `outbound_clicks` | Sponsored clicks to Amazon | Blank if the source does not report clicks |
| `reported_orders` | Orders as reported to this account | Blank rather than zero when unknown |
| `revenue_reported` | Reported commission income | Blank rather than zero when unknown |
| `currency` | ISO 4217 code | Required when `revenue_reported` is filled |
| `provenance_url` | Link to the report or a dated screenshot | Required |
| `report_id` | Report name or date range string from the source | Required |
| `notes` | Anything a reviewer needs, including known gaps | Free text |

Blank means "not obtained". It never means zero.
