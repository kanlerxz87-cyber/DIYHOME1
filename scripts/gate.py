"""Fail closed before enabling a monetized product link."""
from urllib.parse import urlsplit,parse_qs
def eligible(product,tracking_id):
 required=['intended_asin','official_listing_url','confirmation_date','confirmation_source','special_link']
 if not all(product.get(k) for k in required) or product.get('associates_report_confirmed') is not True:return False
 asin=product['intended_asin']
 if len(asin)!=10 or not asin.isalnum():return False
 listing=urlsplit(product['official_listing_url']); special=urlsplit(product['special_link'])
 return all(u.scheme=='https' and u.hostname in {'amazon.com','www.amazon.com'} and u.path==f'/dp/{asin}' for u in (listing,special)) and parse_qs(special.query).get('tag')==[tracking_id]
