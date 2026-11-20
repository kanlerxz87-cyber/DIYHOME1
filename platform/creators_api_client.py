"""
Amazon Creators API Integration Blueprint (PA-API 5 Replacement).

Per official Amazon Associates documentation:
  - PA-API 5 is deprecated (returns HTTP 403 AccessDeniedException).
  - Creators API is the supported successor for product catalog, pricing,
    availability, and review link metadata.
  - IP License §2(h)-(k):
      * Never store/cache product images directly; image links max 24h TTL.
      * Text/price/availability cache max 24h TTL; refresh or omit.
      * Include timestamp + official price/availability change disclaimer.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

PRICE_DISCLAIMER = (
    "Product prices and availability are accurate as of the date/time indicated "
    "and are subject to change. Any price and availability information displayed "
    "on Amazon.com at the time of purchase will apply to the purchase of this product."
)

CONTENT_ATTRIBUTION_NOTICE = (
    "CERTAIN CONTENT THAT APPEARS ON THIS SITE COMES FROM AMAZON. "
    "THIS CONTENT IS PROVIDED 'AS IS' AND IS SUBJECT TO CHANGE OR REMOVAL AT ANY TIME."
)


@dataclass(frozen=True)
class CreatorsApiPolicyConfig:
    tracking_id: str = "shopnow047c-20"
    marketplace: str = "www.amazon.com"
    max_cache_ttl_hours: int = 24
    pa_api_v5_deprecated: bool = True
    require_price_timestamp: bool = True

    def is_cache_expired(self, fetched_at_utc: datetime, now_utc: datetime | None = None) -> bool:
        now = now_utc or datetime.now(timezone.utc)
        if fetched_at_utc.tzinfo is None:
            fetched_at_utc = fetched_at_utc.replace(tzinfo=timezone.utc)
        return (now - fetched_at_utc) > timedelta(hours=self.max_cache_ttl_hours)

    def format_price_stamp(self, price_usd: float, fetched_at_utc: datetime) -> str:
        stamp = fetched_at_utc.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        return f"Amazon.com Price: ${price_usd:.2f} (as of {stamp})"
