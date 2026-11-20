import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from platform.affiliate_platform import (
    audit_site,
    build_special_link,
    ingest_authorized_report,
    validate_campaign_ledger,
    validate_registry,
)
from platform.creators_api_client import (
    CONTENT_ATTRIBUTION_NOTICE,
    PRICE_DISCLAIMER,
    CreatorsApiPolicyConfig,
)

REPO_ROOT = Path(__file__).resolve().parent.parent
EDITION_ROOT = REPO_ROOT / "archive" / "field-and-fixture"


class TestAffiliatePlatform(unittest.TestCase):
    def test_registry_validates_and_separates_intended_vs_observed(self) -> None:
        res = validate_registry(EDITION_ROOT)
        self.assertTrue(res["ok"], msg=res["errors"])
        self.assertEqual(res["submitted_rows"], 4)
        self.assertEqual(res["unique_products"], 3)

        ledger = json.loads((EDITION_ROOT / "data" / "verification-ledger.json").read_text())
        for row in ledger["submitted_links_register"]:
            self.assertEqual(row["intended_asin"], "")
            self.assertEqual(row["intended_asin_status"], "unverified")
            self.assertNotEqual(row["intended_asin"], row["observed_redirect_asin"])

    def test_build_special_link(self) -> None:
        url = build_special_link("b08fkw9jrm", "shopnow047c-20")
        self.assertEqual(
            url, "https://www.amazon.com/dp/B08FKW9JRM/ref=nosim?tag=shopnow047c-20"
        )
        with self.assertRaises(ValueError):
            build_special_link("B0hmGG4m2", "shopnow047c-20")

    def test_campaign_ledger_starts_empty_without_forecasts(self) -> None:
        res = validate_campaign_ledger(EDITION_ROOT)
        self.assertTrue(res["ok"], msg=res["errors"])
        self.assertEqual(res["record_count"], 0)

    def test_ingest_authorized_report_rejects_forecasts(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            (tmp_path / "data").mkdir()
            (tmp_path / "data" / "campaign-ledger.json").write_text(
                (EDITION_ROOT / "data" / "campaign-ledger.json").read_text()
            )
            bad_report = tmp_path / "bad.json"
            bad_report.write_text(
                json.dumps(
                    [
                        {
                            "timestamp": "2026-11-21T00:00:00Z",
                            "source": "Associates Report",
                            "channel": "web",
                            "eligible_sessions": 10,
                            "clicks": 2,
                            "reported_orders": 0,
                            "provenance_note": "test",
                            "conversion_score": 0.2,
                        }
                    ]
                )
            )
            with self.assertRaises(ValueError):
                ingest_authorized_report(tmp_path, bad_report)

            good_report = tmp_path / "good.json"
            good_report.write_text(
                json.dumps(
                    [
                        {
                            "timestamp": "2026-11-21T00:00:00Z",
                            "source": "Associates Central First-Party Report",
                            "channel": "organic_search",
                            "eligible_sessions": 12,
                            "clicks": 3,
                            "reported_orders": 1,
                            "provenance_note": "Manual CSV import",
                        }
                    ]
                )
            )
            out = ingest_authorized_report(tmp_path, good_report)
            self.assertEqual(out["ingested"], 1)
            self.assertEqual(out["total_records"], 1)
            self.assertTrue(validate_campaign_ledger(tmp_path)["ok"])

    def test_site_audit_passes_all_pages(self) -> None:
        res = audit_site(EDITION_ROOT)
        self.assertTrue(res["ok"], msg=res["errors"])
        self.assertEqual(res["html_pages_checked"], 13)
        self.assertGreaterEqual(res["outbound_sponsored_amazon_links"], 30)

    def test_creators_api_policy_config(self) -> None:
        cfg = CreatorsApiPolicyConfig()
        self.assertTrue(cfg.pa_api_v5_deprecated)
        self.assertEqual(cfg.max_cache_ttl_hours, 24)
        now = datetime(2026, 11, 20, 12, 0, tzinfo=timezone.utc)
        self.assertFalse(cfg.is_cache_expired(now - timedelta(hours=23), now))
        self.assertTrue(cfg.is_cache_expired(now - timedelta(hours=25), now))
        self.assertIn("2026-11-20 12:00 UTC", cfg.format_price_stamp(6.79, now))
        self.assertIn("subject to change", PRICE_DISCLAIMER)
        self.assertIn("COMES FROM AMAZON", CONTENT_ATTRIBUTION_NOTICE)


if __name__ == "__main__":
    unittest.main()
