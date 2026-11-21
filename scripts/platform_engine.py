#!/usr/bin/env python3
"""DIY HOME Upgrades — Final Integration Affiliate Research, Link Gate & Source Audit CLI."""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from datetime import date, datetime
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlsplit

ASIN_RE = re.compile(r"^[A-Z0-9]{10}$")
DEFAULT_TRACKING_ID = "shopnow047c-20"
COMMISSION_SOURCE_URL = "https://affiliate-program.amazon.com/help/node/topic/GRXPHT8U84RAYDXZ"


def is_valid_asin(value: str | None) -> bool:
    """Return True iff `value` is a canonical 10-character uppercase alphanumeric ASIN."""
    return bool(value and ASIN_RE.fullmatch(value))


def extract_short_link_token(url: str) -> str | None:
    parsed = urlsplit(url)
    if parsed.scheme == "https" and (parsed.hostname or "").lower() == "link.amazon":
        token = parsed.path.strip("/")
        return token or None
    return None


def build_special_link(asin: str, tracking_id: str = DEFAULT_TRACKING_ID) -> str:
    if not is_valid_asin(asin):
        raise ValueError(f"Invalid ASIN {asin!r}: expected 10 uppercase alphanumeric characters.")
    if not tracking_id or not re.fullmatch(r"[a-zA-Z0-9_-]+-20", tracking_id):
        raise ValueError(f"Invalid Associates Tracking ID {tracking_id!r}.")
    return f"https://www.amazon.com/dp/{asin}?{urlencode({'tag': tracking_id})}"


def check_offer_approval(record: dict, tracking_id: str = DEFAULT_TRACKING_ID) -> tuple[bool, list[str]]:
    reasons: list[str] = []
    if record.get("duplicateOf"):
        reasons.append(f"Duplicate submission of {record['duplicateOf']}")
    for key in (
        "intendedAsin",
        "officialListing",
        "confirmedOn",
        "confirmationSource",
        "specialLink",
        "trackingReportSource",
        "policyReviewedOn",
    ):
        if not record.get(key):
            reasons.append(f"Missing {key}")
    if reasons:
        return False, reasons
    asin = record["intendedAsin"]
    if not is_valid_asin(asin):
        reasons.append(f"Invalid intendedAsin {asin!r}")
    for dk in ("confirmedOn", "policyReviewedOn"):
        try:
            date.fromisoformat(record[dk])
        except ValueError:
            reasons.append(f"Invalid ISO date {dk}={record[dk]!r}")
    for uk in ("officialListing", "specialLink"):
        u = urlsplit(record[uk])
        if u.scheme != "https" or u.netloc != "www.amazon.com" or u.path != f"/dp/{asin}":
            reasons.append(f"{uk} must target https://www.amazon.com/dp/{asin}")
    if parse_qs(urlsplit(record["specialLink"]).query).get("tag") != [tracking_id]:
        reasons.append("specialLink tag mismatch")
    return len(reasons) == 0, reasons


def validate_csv_campaign_ledger(csv_path: Path) -> list[str]:
    errors: list[str] = []
    if not csv_path.is_file():
        return [f"Missing campaign ledger CSV: {csv_path}"]
    with csv_path.open(newline="", encoding="utf-8") as fh:
        reader = csv.reader(fh)
        header = next(reader, None)
        expected = [
            "record_id",
            "timestamp_utc",
            "source",
            "channel",
            "eligible_sessions",
            "outbound_clicks",
            "reported_orders",
            "revenue_reported",
            "currency",
            "provenance_url",
            "report_id",
            "notes",
        ]
        if header != expected:
            return [f"Unexpected header {header!r}"]
        for idx, row in enumerate(reader, start=2):
            if not any(c.strip() for c in row):
                continue
            ts = row[1]
            try:
                datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except ValueError:
                errors.append(f"Row {idx}: invalid timestamp {ts!r}")
            if not row[2].strip() or not row[9].strip().startswith("https://"):
                errors.append(f"Row {idx}: missing first-party source or https provenance_url")
    return errors


def audit_verified_datasets(root: Path) -> dict:
    errors: list[str] = []
    products_doc = json.loads((root / "data/products.json").read_text(encoding="utf-8"))
    sources_doc = json.loads((root / "data/sources.json").read_text(encoding="utf-8"))
    specs_doc = json.loads((root / "data/product-specs.json").read_text(encoding="utf-8"))
    vsources_doc = json.loads((root / "data/verified-sources.json").read_text(encoding="utf-8"))

    for prod in products_doc["products"]:
        if prod["intended_asin"] is not None:
            errors.append(f"{prod['id']}: intended_asin must remain null until operator sign-off")
        if not is_valid_asin(prod["asin_observed"]):
            errors.append(f"{prod['id']}: invalid asin_observed {prod['asin_observed']!r}")
        if prod["observed_redirect_target"] == prod["listing_url"]:
            errors.append(f"{prod['id']}: observed_redirect_target must remain separate from listing_url")

    attr_count = 0
    blank_unverified = 0
    site_doc = json.loads((root / "data/site.json").read_text(encoding="utf-8"))
    guides_doc = json.loads((root / "data/guides.json").read_text(encoding="utf-8"))
    cat_slugs = {c["slug"] for c in site_doc["categories"]}
    guide_slugs = {g["slug"] for g in guides_doc["guides"]}
    prod_by_asin = {p["asin_observed"]: p for p in products_doc["products"]}

    for prod in specs_doc["products"]:
        if not is_valid_asin(prod["observed_asin"]):
            errors.append(f"Invalid observed_asin {prod['observed_asin']!r}")
            continue
        match = prod_by_asin.get(prod["observed_asin"])
        if match is None:
            errors.append(f"{prod['observed_asin']}: no matching product in data/products.json")
        elif sorted(prod.get("submission_ids", [])) != sorted(match["submitted_links"]):
            errors.append(
                f"{prod['observed_asin']}: submission_ids {prod.get('submission_ids')} "
                f"do not match products.json {match['submitted_links']}"
            )
        if prod.get("category_slug") not in cat_slugs:
            errors.append(f"{prod['observed_asin']}: unknown category_slug {prod.get('category_slug')!r}")
        guide_slug = str(prod.get("guide_slug", "")).removeprefix("guides/").rstrip("/")
        if guide_slug not in guide_slugs:
            errors.append(f"{prod['observed_asin']}: guide_slug {prod.get('guide_slug')!r} is not a published guide")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(prod.get("reverified_on", ""))):
            errors.append(f"{prod['observed_asin']}: missing reverified_on date")
        for attr in prod["attributes"]:
            attr_count += 1
            u = urlsplit(attr.get("source_url", ""))
            if u.scheme != "https" or not u.netloc:
                errors.append(f"{prod['observed_asin']} · {attr.get('field')}: missing https source_url")
            if attr.get("value", "") == "":
                blank_unverified += 1
                if attr.get("status") != "Unverified":
                    errors.append(f"{prod['observed_asin']} · {attr.get('field')}: blank value not marked Unverified")

    for s in sources_doc["sources"]:
        u = urlsplit(s.get("url", ""))
        if u.scheme != "https" or not u.netloc:
            errors.append(f"Source {s.get('id')}: invalid https url")
    canonical_ids = {s.get("id") for s in sources_doc["sources"]}
    snapshot_ids = [s.get("code") for s in vsources_doc["sources"]]
    for sid in snapshot_ids:
        if not re.fullmatch(r"VS\d{2}", str(sid)):
            errors.append(f"Snapshot source {sid!r} must use the VS__ prefix, not the canonical S__ ids")
        if sid in canonical_ids:
            errors.append(f"Snapshot source {sid!r} collides with a canonical source id")
    for sg in vsources_doc["parallel_passes"]:
        u = urlsplit(sg.get("source_url", ""))
        if u.scheme != "https" or not u.netloc:
            errors.append(f"Pass {sg.get('code')}: invalid https source_url")
        if sg.get("source_url", "").startswith("https://kanlerxz87-cyber.github.io/"):
            errors.append(f"Pass {sg.get('code')}: cites this site as its own official source")
        if not sg.get("source_supports"):
            errors.append(f"Pass {sg.get('code')}: does not state what its source supports")

    errors.extend(validate_csv_campaign_ledger(root / "data/campaign-ledger.csv"))

    return {
        "products_checked": len(products_doc["products"]),
        "attribute_rows_verified": attr_count,
        "blank_unverified_fields": blank_unverified,
        "canonical_sources_count": len(sources_doc["sources"]),
        "snapshot_sources_count": len(snapshot_ids),
        "parallel_passes_count": len(vsources_doc["parallel_passes"]),
        "errors": errors,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("audit", help="Run line-by-line official source & compliance gate audit")
    lp = sub.add_parser("link-preview", help="Preview canonical Special Link format for a 10-char ASIN")
    lp.add_argument("asin")
    lp.add_argument("--tag", default=DEFAULT_TRACKING_ID)
    args = parser.parse_args(argv)
    root = Path(__file__).resolve().parents[1]
    if args.cmd == "audit":
        report = audit_verified_datasets(root)
        print(json.dumps(report, indent=2))
        return 1 if report["errors"] else 0
    if args.cmd == "link-preview":
        print(json.dumps({"asin": args.asin, "special_link": build_special_link(args.asin, args.tag)}, indent=2))
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
