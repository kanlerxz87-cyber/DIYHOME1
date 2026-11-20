import json,pathlib,unittest,sys,xml.etree.ElementTree as ET
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from scripts.gate import eligible
from analytics.server import validate
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag in ('a','link','img','script'):
   u=a.get('href') or a.get('src')
   if u:self.links.append((tag,u,a))
class TestSite(unittest.TestCase):
 def test_pages(self):
  files=list((ROOT/'_site').glob('*.html'));self.assertGreater(len(files),15)
  for f in files:
   text=f.read_text();self.assertGreaterEqual(text.count('As an Amazon Associate I earn from qualifying purchases.'),2)
   p=Parser();p.feed(text)
   for tag,url,a in p.links:
    u=urlsplit(url)
    if not u.scheme and u.path:self.assertTrue((f.parent/unquote(u.path)).exists(),(f,url))
    if u.hostname in ('www.amazon.com','link.amazon') and tag=='a':self.assertIn('sponsored',a.get('rel',''))
 def test_feed_sitemap(self):
  for n in ('feed.xml','sitemap.xml'):ET.parse(ROOT/'_site'/n)
  self.assertEqual(len(ET.parse(ROOT/'_site/feed.xml').findall('.//item')),4)
 def test_gate(self):
  for p in json.loads((ROOT/'data/products.json').read_text()):self.assertFalse(eligible(p,'shopnow047c-20'))
  p={'intended_asin':'B08FKW9JRM','official_listing_url':'https://www.amazon.com/dp/B08FKW9JRM','confirmation_date':'2026-11-20','confirmation_source':'https://www.amazon.com/dp/B08FKW9JRM','special_link':'https://www.amazon.com/dp/B08FKW9JRM?tag=shopnow047c-20','associates_report_confirmed':True}
  self.assertTrue(eligible(p,'shopnow047c-20'));p['special_link']='https://evil.example/dp/B08FKW9JRM?tag=shopnow047c-20';self.assertFalse(eligible(p,'shopnow047c-20'))
 def test_events(self):
  self.assertTrue(validate({'event':'outbound_click','page':'/DIYHOME1/index.html','product':'pan-organizer'}))
  for obj in ({'event':'purchase','page':'/DIYHOME1/','product':None},{'event':'page_view','page':'/DIYHOME1/?email=private','product':None},{'event':'outbound_click','page':'/DIYHOME1/','product':None},[],{'event':[]}):self.assertFalse(validate(obj))
if __name__=='__main__':unittest.main()

class TestCollector(unittest.TestCase):
 def test_http_and_aggregate(self):
  import tempfile,threading,http.client,sqlite3,datetime
  from analytics import server
  with tempfile.TemporaryDirectory() as tmp:
   old=server.DB;server.DB=str(pathlib.Path(tmp)/'test.sqlite3')
   app=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler)
   thread=threading.Thread(target=app.serve_forever,daemon=True);thread.start()
   def request(body,origin=server.ORIGIN):
    c=http.client.HTTPConnection('127.0.0.1',app.server_port)
    c.request('POST','/events',json.dumps(body),{'Origin':origin,'Content-Type':'application/json'})
    r=c.getresponse();code=r.status;r.read();c.close();return code
   try:
    body={'event':'outbound_click','page':'/DIYHOME1/index.html','product':'pan-organizer'}
    self.assertEqual(request(body),204);self.assertEqual(request(body),204)
    self.assertEqual(request(body,'https://evil.example'),403)
    self.assertEqual(request({'event':'purchase','page':'/DIYHOME1/','product':None}),400)
    self.assertEqual(request({'event':'page_view','page':'/DIYHOME1/','product':['bad']}),400)
    with sqlite3.connect(server.DB) as db:
     self.assertEqual(db.execute('SELECT count FROM counts').fetchone()[0],2)
     self.assertEqual([r[1] for r in db.execute('PRAGMA table_info(counts)')],['day','event','page','product','count'])
     db.execute("INSERT INTO counts VALUES('2020-01-01','page_view','/DIYHOME1/','',1)")
    self.assertEqual(request(body),204)
    with sqlite3.connect(server.DB) as db:self.assertEqual(db.execute('SELECT COUNT(*) FROM counts').fetchone()[0],1)
   finally:app.shutdown();app.server_close();thread.join();server.DB=old
