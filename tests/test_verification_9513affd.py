"""Non-mutating verification gates for session S-2026-11-21-9513affd.

These tests read the canonical data files and the generated site only. They never
write, rebuild, or mutate anything, so they are safe to run concurrently with the
other sessions that own `data/`, `scripts/`, `assets/` and the generated HTML.

They encode the standing requirements from the task brief:
  * disclosure above the fold (under the masthead) and repeated in the footer,
  * every outbound product link marked rel="sponsored" and carrying the tag,
  * one canonical indexed site with sitemap.xml / feed.xml / robots.txt,
  * single navigation group ("Site desk"), repeated in the footer,
  * strict separation of intended_asin from observed_redirect_target,
  * an empty, well-defined campaign ledger,
  * no conversion score and no revenue forecast anywhere,
  * every table row backed by a source link.
"""

from __future__ import annotations

import csv
import re
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TAG = "shopnow047c-20"
DISCLOSURE_STRIP = "data-disclosure"
ASSOCIATE_STATEMENT = "As an Amazon Associate"
FOOTER_DISCLOSURE = "Affiliate disclosure"

GENERATED_ROOTS = [
    REPO_ROOT,
    REPO_ROOT / "products",
    REPO_ROOT / "products" / "art3d-smoothing-tool-kit",
    REPO_ROOT / "products" / "kitchen-storage",
    REPO_ROOT / "products" / "ordora-pots-and-pans-organizer",
    REPO_ROOT / "products" / "paper-towel-holder-under-cabinet",
    REPO_ROOT / "products" / "wallpaper-tools",
    REPO_ROOT / "products" / "comparisons",
    REPO_ROOT / "guides",
    REPO_ROOT / "guides" / "paper-towel-holder-fit-checklist",
    REPO_ROOT / "guides" / "pot-pan-organizer-capacity",
    REPO_ROOT / "guides" / "questions-before-under-cabinet-upgrade",
    REPO_ROOT / "guides" / "wallpaper-smoothing-kit-what-to-compare",
    REPO_ROOT / "summary",
    REPO_ROOT / "sources",
    REPO_ROOT / "flagged",
    REPO_ROOT / "ledger",
    REPO_ROOT / "measurement",
    REPO_ROOT / "automation",
    REPO_ROOT / "disclosures",
    REPO_ROOT / "search",
    REPO_ROOT / "about",
]


def generated_pages() -> list[Path]:
    pages: set[Path] = set()
    for root in GENERATED_ROOTS:
        if root.is_dir():
            pages.update(p for p in root.glob("**/*.html") if "archive" not in p.parts)
    return sorted(pages)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


class TestDisclosurePlacement(unittest.TestCase):
    def test_every_generated_page_has_above_fold_and_footer_disclosure(self) -> None:
        pages = generated_pages()
        self.assertGreaterEqual(len(pages), 20)
        for page in pages:
            with self.subTest(page=str(page.relative_to(REPO_ROOT))):
                html = read(page)
                self.assertIn(DISCLOSURE_STRIP, html, "above-the-fold disclosure strip missing")
                self.assertIn(ASSOCIATE_STATEMENT, html, "Associate statement missing")
                self.assertIn(TAG, html, "selected tracking id missing")
                self.assertIn(FOOTER_DISCLOSURE, html, "footer disclosure missing")

    def test_disclosure_strip_appears_before_the_masthead_content(self) -> None:
        html = read(REPO_ROOT / "index.html")
        strip = html.find(DISCLOSURE_STRIP)
        body = html.find("<main")
        self.assertGreater(strip, -1)
        self.assertGreater(body, -1)
        self.assertLess(strip, body, "disclosure strip must sit above the page body")


class TestSponsoredLinks(unittest.TestCase):
    def test_every_sponsored_link_is_marked_and_tagged(self) -> None:
        offenders: list[str] = []
        checked = 0
        for page in generated_pages():
            html = read(page)
            for tag in re.findall(r"<a\b[^>]*>", html):
                href = re.search(r'href="(https?://(?:www\.)?amazon\.com/dp/[A-Z0-9]+)', tag)
                if not href or "data-sponsored" not in tag:
                    continue  # citation links to listings are not product CTAs
                checked += 1
                href_value = href.group(1)
                if 'rel="sponsored nofollow noopener"' not in tag:
                    offenders.append(f"{page.relative_to(REPO_ROOT)}: missing rel=\"sponsored\" -> {href_value}")
                if f"tag={TAG}" not in tag:
                    offenders.append(f"{page.relative_to(REPO_ROOT)}: missing tag on {href_value}")
        self.assertGreater(checked, 0)
        self.assertEqual(offenders, [], "sponsored links must be marked rel=\"sponsored\" and tagged")

    def test_single_associate_tag_is_configured(self) -> None:
        config = read(REPO_ROOT / "assets" / "js" / "config.js")
        self.assertIn(f'associateTag: "{TAG}"', config)


class TestFindability(unittest.TestCase):
    def test_sitemap_feed_robots_present_and_consistent(self) -> None:
        for name in ("sitemap.xml", "feed.xml", "robots.txt"):
            path = REPO_ROOT / name
            self.assertTrue(path.exists(), f"{name} missing")
            self.assertGreater(path.stat().st_size, 0, f"{name} empty")

        sitemap = read(REPO_ROOT / "sitemap.xml")
        locs = re.findall(r"<loc>(.*?)</loc>", sitemap)
        self.assertGreater(len(locs), 0)
        prefix = "https://kanlerxz87-cyber.github.io/DIYHOME1/"
        for loc in locs:
            with self.subTest(loc=loc):
                self.assertTrue(loc.startswith(prefix), "sitemap must point at the canonical site")
                local = loc[len(prefix):].rstrip("/")
                candidates = [Path(local) if local else Path("index.html")]
                if not local:
                    candidates = [Path("index.html")]
                else:
                    candidates = [Path(local + ".html"), Path(local) / "index.html", Path(local)]
                self.assertTrue(
                    any(c.exists() for c in candidates),
                    f"sitemap entry has no corresponding file: {loc}",
                )

        feed = read(REPO_ROOT / "feed.xml")
        self.assertIn("rss", feed.lower())
        self.assertIn("<link>", feed)

    def test_single_canonical_site_in_generated_pages(self) -> None:
        pages = generated_pages()
        for page in pages:
            html = read(page)
            for canonical in re.findall(r'rel="canonical"[^>]*href="([^"]+)"', html):
                self.assertTrue(canonical.startswith("https://kanlerxz87-cyber.github.io/DIYHOME1/"))
            for og in re.findall(r'property="og:url"[^>]*content="([^"]+)"', html):
                self.assertTrue(og.startswith("https://kanlerxz87-cyber.github.io/DIYHOME1/"))

    DESK_SURFACES = (
        "summary/",
        "sources/",
        "ledger/",
        "flagged/",
        "measurement/",
        "automation/",
        "about/",
        "disclosures/",
    )

    def test_single_navigation_group_and_footer_repeat(self) -> None:
        for page in generated_pages():
            html = read(page)
            with self.subTest(page=str(page.relative_to(REPO_ROOT))):
                self.assertIn('aria-label="Primary"', html, "primary navigation missing")
                nav = re.search(r'<nav class="site-nav".*?</nav>', html, flags=re.DOTALL)
                self.assertIsNotNone(nav, "primary navigation block missing")
                desk = re.search(r'<details class="desk-dropdown".*?</details>', nav.group(0), flags=re.DOTALL)
                self.assertIsNotNone(desk, "single navigation group 'Site desk' missing")
                self.assertIn("Site desk", desk.group(0))
                for surface in self.DESK_SURFACES:
                    self.assertIn(surface, desk.group(0), f"dashboard surface {surface} not in nav group")

                footer = re.search(r'<nav class="footer-nav".*?</nav>', html, flags=re.DOTALL)
                self.assertIsNotNone(footer, "footer navigation missing")
                for surface in self.DESK_SURFACES:
                    self.assertIn(surface, footer.group(0), f"dashboard surface {surface} not repeated in footer")


class TestProductIntentSeparation(unittest.TestCase):
    def test_intended_asin_is_blank_and_never_merged_with_observed_target(self) -> None:
        import json

        data = json.loads(read(REPO_ROOT / "data" / "products.json"))
        products = data["products"]
        self.assertEqual(len(products), 3)
        for product in products:
            with self.subTest(product=product["id"]):
                self.assertIsNone(product["intended_asin"])
                self.assertIn("intended_asin_status", product)
                self.assertTrue(product.get("observed_redirect_target"))
                # The two fields must never be conflated.
                self.assertNotEqual(product["intended_asin"], product["observed_redirect_target"])
                self.assertNotIn(product["asin_observed"], str(product["intended_asin"]))

    def test_intents_csv_keeps_intended_and_observed_in_separate_columns(self) -> None:
        path = REPO_ROOT / "data" / "product-intents.csv"
        with path.open(newline="", encoding="utf-8") as fh:
            rows = list(csv.DictReader(fh))
        self.assertGreaterEqual(len(rows), 3)
        for row in rows:
            with self.subTest(record=row.get("record_id")):
                self.assertIn("intended_asin", row)
                self.assertIn("observed_redirect_target", row)
                self.assertIn("official_listing_url", row)
                self.assertIn("confirmation_date", row)
                self.assertTrue(
                    "source" in row or "confirmation_source" in row,
                    "product-intent record must record its source",
                )
                self.assertEqual((row["intended_asin"] or "").strip(), "")
                self.assertTrue(row["official_listing_url"].strip())
                self.assertTrue(row["confirmation_date"].strip())


class TestNoUnverifiedValuesPublished(unittest.TestCase):
    def test_no_price_rating_review_or_commission_values_in_generated_tables(self) -> None:
        # Disclaimers such as "no conversion score or revenue forecast is
        # presented" are allowed; an actual presented value is not.
        banned = [
            r"\$\s?\d",                              # dollar price
            r"\b\d+\.\d+\s*(star|out of 5)",       # star rating
            r"\b\d{2,},\d{3}\s*(reviews|ratings)\b",
            r"(?:revenue forecast|conversion score|estimated revenue|projected revenue|forecast revenue)\s+(?:of|is|:)\s*\$?\d",
            r"commission rate\s+(?:of|is|:)\s*\d",
            r"\b\d+\.\d+\s*%\s*commission",
        ]
        for page in generated_pages():
            html = read(page)
            for pattern in banned:
                with self.subTest(page=str(page.relative_to(REPO_ROOT)), pattern=pattern):
                    self.assertIsNone(
                        re.search(pattern, html, flags=re.IGNORECASE),
                        f"unverified value pattern {pattern!r} appears on {page.name}",
                    )

    def test_campaign_ledger_is_empty_but_well_defined(self) -> None:
        path = REPO_ROOT / "data" / "campaign-ledger.csv"
        with path.open(newline="", encoding="utf-8") as fh:
            rows = list(csv.reader(fh))
        self.assertGreaterEqual(len(rows), 1)
        header = rows[0]
        expected = {
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
        }
        self.assertTrue(expected.issubset(set(header)), f"ledger schema drift: {header}")
        self.assertEqual(len(rows), 1, "ledger must start empty (header only)")


class TestTableRowsCarrySourceLinks(unittest.TestCase):
    def test_every_data_table_row_has_a_source_link(self) -> None:
        citation = re.compile(r'data-(?:citation|sponsored)="(?:true|amazon)"')
        rows_checked = 0
        offenders: list[str] = []
        for page in generated_pages():
            html = read(page)
            for match in re.finditer(r"<tr[^>]*>(.*?)</tr>", html, flags=re.DOTALL | re.IGNORECASE):
                row = match.group(1)
                if "<td" not in row:
                    continue
                if citation.search(row):
                    rows_checked += 1
                    continue
                # Rows whose cells are entirely empty are layout rows, not data rows.
                cells = re.findall(r"<td[^>]*>(.*?)</td>", row, flags=re.DOTALL | re.IGNORECASE)
                if any(re.sub(r"<[^>]+>", " ", cell).strip() for cell in cells):
                    offenders.append(str(page.relative_to(REPO_ROOT)))
        self.assertGreater(rows_checked, 0)
        self.assertEqual(offenders, [], "every table row with content needs a source link")


if __name__ == "__main__":
    unittest.main()
