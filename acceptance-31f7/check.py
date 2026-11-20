"""Independent read-only acceptance of the final integration's product records."""
import json
from pathlib import Path
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
catalog=json.loads((root/'data/catalog.json').read_text())
rows=catalog['submissions']
assert len(rows)==4 and len({r['url'] for r in rows})==3
assert rows[2]['duplicateOf']=='S02' and rows[2]['url']==rows[1]['url']
expected={'S01':'B08FKW9JRM','S02':'B0BSKQW2T2','S03':'B0BSKQW2T2','S04':'B08DY9HRWD'}
for r in rows:
 assert urlsplit(r['observedRedirect']).hostname=='www.amazon.com'
 assert urlsplit(r['observedRedirect']).path=='/dp/'+expected[r['id']]
 for key in ('intendedAsin','officialListing','confirmedOn','confirmationSource','specialLink','trackingReportSource','policyReviewedOn'):
  assert r[key] is None,(r['id'],key)
assert catalog['analyticsEndpoint']=='','Do not label a new endpoint verified without a receipt check'
feed=ET.parse(root/'feed.xml')
assert len(feed.findall('.//item'))==4
for name in ('index.html','about.html','review.html','research.html','campaign.html','privacy.html'):
 text=(root/name).read_text()
 assert text.count('As an Amazon Associate I earn from qualifying purchases.')==2
 assert 'rel="canonical"' in text
print('PASS: four submissions; duplicate retained; three observed ASINs match independent fetches; all intent/affiliate confirmations empty; collector explicitly unconfigured; four guide feed items; disclosures and canonicals on core pages.')
