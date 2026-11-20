#!/usr/bin/env python3
"""
Automation & Compliance Platform CLI for Field & Fixture (DIYHOME1).

Automates the verifiable, deterministic workflows (registry validation,
Special Link formatting, HTML/SEO/disclosure/sponsored-link audits,
authorized first-party campaign ledger ingestion, and Creators API planning)
while preserving explicit human compliance gates.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

ASIN_PATTERN = re.compile(r"^[A-Z0-9]{10}$")
REQUIRED_DISCLOSURE_SNIPPET = "As an Amazon Associate I earn from qualifying purchases"
FORBIDDEN_LEDGER_KEYS = {
    "conversion_score",
    "revenue_forecast",
    "projected_revenue",
    "predicted_conversion",
}
REQUIRED_LEDGER_FIELDS = (
    "timestamp",
    "source",
    "channel",
    "eligible_sessions",
    "clicks",
    "reported_orders",
    "provenance_note",
)


class HtmlInspector(HTMLParser):
    """Extracts links, assets, canonical tags, and text sections from HTML."""

    def __init__(self) -> None:
        super().__init__()
        self.links: list[dict[str, str]] = []
        self.assets: list[str] = []
        self.canonicals: list[str] = []
        self.text_chunks: list[str] = []
        self._in_header_disclosure = False
        self._in_footer = False
        self.disclosure_banner_text: list[str] = []
        self.footer_text: list[str] = []
        self._tag_stack: list[tuple[str, dict[str, str]]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = {k.lower(): (v or "") for k, v in attrs}
        self._tag_stack.append((tag.lower(), attr_map))

        if tag.lower() == "a":
            self.links.append(attr_map)
        elif tag.lower() in {"img", "script"} and "src" in attr_map:
            self.assets.append(attr_map["src"])
        elif tag.lower() == "link":
            rel = attr_map.get("rel", "").lower().split()
            if "canonical" in rel and attr_map.get("href"):
                self.canonicals.append(attr_map["href"])
            if "stylesheet" in rel and attr_map.get("href"):
                self.assets.append(attr_map["href"])

        cls = attr_map.get("class", "")
        if "disclosure-strip" in cls or attr_map.get("id") == "top-disclosure":
            self._in_header_disclosure = True
        if tag.lower() == "footer":
            self._in_footer = True

    def handle_endtag(self, tag: str) -> None:
        t = tag.lower()
        for idx in range(len(self._tag_stack) - 1, -1, -1):
            open_tag, attr_map = self._tag_stack[idx]
            if open_tag == t:
                cls = attr_map.get("class", "")
                if "disclosure-strip" in cls or attr_map.get("id") == "top-disclosure":
                    self._in_header_disclosure = False
                if open_tag == "footer":
                    self._in_footer = False
                del self._tag_stack[idx:]
                break

    def handle_data(self, data: str) -> None:
        self.text_chunks.append(data)
        if self._in_header_disclosure:
            self.disclosure_banner_text.append(data)
        if self._in_footer:
            self.footer_text.append(data)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def build_special_link(asin: str, tracking_id: str) -> str:
    clean_asin = asin.strip().upper()
    if not ASIN_PATTERN.match(clean_asin):
        raise ValueError(f"Invalid 10-character ASIN: {asin!r}")
    clean_tag = tracking_id.strip()
    if not clean_tag:
        raise ValueError("Tracking ID must be non-empty.")
    return f"https://www.amazon.com/dp/{clean_asin}/ref=nosim?tag={clean_tag}"


def validate_registry(root: Path) -> dict[str, Any]:
    products_data = load_json(root / "data" / "products.json")
    ledger_data = load_json(root / "data" / "verification-ledger.json")
    errors: list[str] = []
    warnings: list[str] = []

    rows = ledger_data.get("submitted_links_register", [])
    seen_urls: dict[str, int] = {}

    for row in rows:
        line_no = row.get("line_number")
        sub_url = row.get("submitted_url", "")
        intended = row.get("intended_asin", "")
        observed = row.get("observed_redirect_target", "")
        observed_asin = row.get("observed_redirect_asin", "")
        source_url = row.get("official_source_url", "")

        if not source_url.startswith("https://"):
            errors.append(f"Line {line_no}: missing official_source_url.")
        if intended and observed and intended == observed:
            errors.append(
                f"Line {line_no}: intended_asin must never be merged with observed_redirect_target."
            )
        if intended and intended == observed_asin and row.get("intended_asin_status") == "unverified":
            errors.append(
                f"Line {line_no}: intended_asin populated while marked unverified."
            )
        if not intended:
            warnings.append(
                f"Line {line_no} ({sub_url}): intended_asin is blank/unverified (kept separate from observed ASIN {observed_asin})."
            )
        if observed_asin and not ASIN_PATTERN.match(observed_asin):
            errors.append(
                f"Line {line_no}: observed_redirect_asin {observed_asin!r} is not a 10-char ASIN."
            )
        if sub_url in seen_urls:
            warnings.append(
                f"Line {line_no} ({sub_url}): duplicate of line {seen_urls[sub_url]}."
            )
        else:
            seen_urls[sub_url] = line_no

    for prod in products_data.get("products", []):
        if not prod.get("official_listing_url", "").startswith("https://www.amazon.com/dp/"):
            errors.append(f"Product {prod.get('id')}: invalid official_listing_url.")
        if prod.get("intended_asin") == prod.get("observed_redirect_asin") and prod.get("intended_asin_status") == "unverified":
            errors.append(f"Product {prod.get('id')}: intended_asin merged improperly.")

    return {
        "ok": len(errors) == 0,
        "submitted_rows": len(rows),
        "unique_products": len(products_data.get("products", [])),
        "errors": errors,
        "warnings": warnings,
    }


def validate_campaign_ledger(root: Path) -> dict[str, Any]:
    data = load_json(root / "data" / "campaign-ledger.json")
    errors: list[str] = []

    for key in FORBIDDEN_LEDGER_KEYS:
        if key in data:
            errors.append(f"Forbidden forecast/score field present at root: {key}")

    records = data.get("records", [])
    if not isinstance(records, list):
        errors.append("'records' must be a list.")
        records = []

    for idx, rec in enumerate(records):
        if not isinstance(rec, dict):
            errors.append(f"Record {idx} must be an object.")
            continue
        for key in FORBIDDEN_LEDGER_KEYS:
            if key in rec:
                errors.append(f"Record {idx}: forbidden field {key}")
        for req in REQUIRED_LEDGER_FIELDS:
            if req not in rec:
                errors.append(f"Record {idx}: missing required field {req}")

    return {
        "ok": len(errors) == 0,
        "record_count": len(records),
        "provenance_entries": len(data.get("provenance_trail", [])),
        "errors": errors,
    }


def audit_site(root: Path) -> dict[str, Any]:
    html_files = sorted(root.rglob("*.html"))
    errors: list[str] = []
    checked_links = 0
    outbound_sponsored_links = 0

    for html_path in html_files:
        rel_path = html_path.relative_to(root).as_posix()
        inspector = HtmlInspector()
        inspector.feed(html_path.read_text(encoding="utf-8"))

        banner = " ".join(inspector.disclosure_banner_text)
        footer = " ".join(inspector.footer_text)
        if REQUIRED_DISCLOSURE_SNIPPET not in banner:
            errors.append(f"{rel_path}: missing required above-fold disclosure strip.")
        if REQUIRED_DISCLOSURE_SNIPPET not in footer:
            errors.append(f"{rel_path}: missing required disclosure in footer.")
        if not inspector.canonicals:
            errors.append(f"{rel_path}: missing canonical link tag.")

        for asset in inspector.assets:
            if asset.startswith(("http://", "https://", "data:")):
                continue
            target = (html_path.parent / asset.split("?")[0]).resolve()
            if not target.exists():
                errors.append(f"{rel_path}: broken asset reference {asset!r}")

        for link in inspector.links:
            href = link.get("href", "").strip()
            if not href or href.startswith(("#", "mailto:", "javascript:")):
                continue
            checked_links += 1

            if href.startswith(("http://", "https://")):
                host = (urlparse(href).hostname or "").lower()
                is_product_host = host in {"www.amazon.com", "amazon.com", "amzn.to", "a.co", "link.amazon"}
                if is_product_host:
                    rel_tokens = set(link.get("rel", "").lower().split())
                    if "sponsored" not in rel_tokens:
                        errors.append(
                            f"{rel_path}: outbound Amazon product link missing rel='sponsored': {href}"
                        )
                    else:
                        outbound_sponsored_links += 1
            else:
                clean_href = href.split("#")[0].split("?")[0]
                if not clean_href:
                    continue
                target = (html_path.parent / clean_href).resolve()
                if not target.exists():
                    errors.append(f"{rel_path}: broken internal link {href!r}")

    # Validate sitemap.xml
    sitemap_path = root / "sitemap.xml"
    if not sitemap_path.exists():
        errors.append("Missing sitemap.xml")
    else:
        tree = ET.fromstring(sitemap_path.read_text(encoding="utf-8"))
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        locs = [el.text or "" for el in tree.findall("sm:url/sm:loc", ns)]
        if not locs:
            errors.append("sitemap.xml contains no <url><loc> entries.")
        for loc in locs:
            parsed = urlparse(loc)
            path_part = parsed.path
            prefix = "/DIYHOME1/"
            if path_part.startswith(prefix):
                local_rel = path_part[len(prefix):] or "index.html"
                if not (root / local_rel).exists():
                    errors.append(f"sitemap.xml points to missing file: {local_rel}")

    # Validate feed.xml
    feed_path = root / "feed.xml"
    if not feed_path.exists():
        errors.append("Missing feed.xml")
    else:
        feed_tree = ET.fromstring(feed_path.read_text(encoding="utf-8"))
        items = feed_tree.findall("./channel/item")
        if not items:
            errors.append("feed.xml contains no RSS <item> entries.")
        for item in items:
            link_el = item.find("link")
            if link_el is None or not (link_el.text or "").startswith("https://"):
                errors.append("feed.xml item missing valid https link.")
            else:
                parsed = urlparse(link_el.text.strip())
                prefix = "/DIYHOME1/"
                if parsed.path.startswith(prefix):
                    local_rel = parsed.path[len(prefix):] or "index.html"
                    if not (root / local_rel).exists():
                        errors.append(f"feed.xml points to missing file: {local_rel}")

    return {
        "ok": len(errors) == 0,
        "html_pages_checked": len(html_files),
        "internal_and_external_links_checked": checked_links,
        "outbound_sponsored_amazon_links": outbound_sponsored_links,
        "errors": errors,
    }


def ingest_authorized_report(root: Path, report_path: Path) -> dict[str, Any]:
    ledger_path = root / "data" / "campaign-ledger.json"
    ledger = load_json(ledger_path)
    incoming = load_json(report_path)
    if not isinstance(incoming, list):
        raise ValueError("Authorized report JSON must be a list of records.")

    for idx, rec in enumerate(incoming):
        for forbidden in FORBIDDEN_LEDGER_KEYS:
            if forbidden in rec:
                raise ValueError(f"Record {idx} contains disallowed forecast/score field: {forbidden}")
        for req in REQUIRED_LEDGER_FIELDS:
            if req not in rec:
                raise ValueError(f"Record {idx} missing required field: {req}")
        ledger["records"].append(rec)

    ledger["provenance_trail"].append(
        {
            "date": "2026-11-20",
            "actor": "ingest-report",
            "action": f"Ingested {len(incoming)} authorized first-party records from {report_path.name}.",
        }
    )
    ledger_path.write_text(json.dumps(ledger, indent=2) + "\n", encoding="utf-8")
    return {"ingested": len(incoming), "total_records": len(ledger["records"])}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="DIYHOME1 Affiliate Platform CLI")
    parser.add_argument("--root", default=".", help="Repository root path")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("validate-registry", help="Validate product and link confirmation records")
    sub.add_parser("validate-ledger", help="Validate campaign ledger schema")
    sub.add_parser("audit-site", help="Audit HTML disclosures, sponsored links, sitemap, and RSS feed")

    link_cmd = sub.add_parser("build-special-link", help="Build canonical Associates Special Link")
    link_cmd.add_argument("--asin", required=True)
    link_cmd.add_argument("--tag", default="shopnow047c-20")

    ingest_cmd = sub.add_parser("ingest-report", help="Ingest authorized first-party report JSON")
    ingest_cmd.add_argument("--file", required=True)

    args = parser.parse_args(argv)
    root = Path(args.root).resolve()

    if args.command == "validate-registry":
        res = validate_registry(root)
    elif args.command == "validate-ledger":
        res = validate_campaign_ledger(root)
    elif args.command == "audit-site":
        res = audit_site(root)
    elif args.command == "build-special-link":
        res = {"special_link": build_special_link(args.asin, args.tag), "ok": True}
    elif args.command == "ingest-report":
        res = ingest_authorized_report(root, Path(args.file))
        res["ok"] = True
    else:
        return 2

    print(json.dumps(res, indent=2))
    return 0 if res.get("ok", True) else 1


if __name__ == "__main__":
    sys.exit(main())
