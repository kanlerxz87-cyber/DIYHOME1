"""Optional same-origin aggregate collector. Reverse proxy /events to port 8080.
Do not expose without request/rate limits; no dashboard or raw-data endpoint.
"""
import datetime as dt
import json
import os
import pathlib
import sqlite3
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
ROOT=pathlib.Path(__file__).resolve().parents[1]
CONFIG=json.loads((ROOT/'data/config.json').read_text())
PRODUCTS={p['id'] for p in json.loads((ROOT/'data/products.json').read_text())}
PAGES={'/DIYHOME1/'+p.name for p in (ROOT/'_site').glob('*.html')}|{'/DIYHOME1/'}
DB=os.environ.get('ANALYTICS_DB',str(ROOT/'analytics/counts.sqlite3'))
ORIGIN=os.environ.get('ANALYTICS_ORIGIN','https://kanlerxz87-cyber.github.io')
def validate(obj):
 if not isinstance(obj,dict) or set(obj)!={'event','page','product'}:return False
 return isinstance(obj['event'],str) and obj['event'] in CONFIG['events'] and isinstance(obj['page'],str) and obj['page'] in PAGES and (obj['product'] is None or isinstance(obj['product'],str) and obj['product'] in PRODUCTS) and (obj['event']!='outbound_click' or obj['product'] in PRODUCTS)
def record(obj):
 today=dt.datetime.now(dt.timezone.utc).date()
 with sqlite3.connect(DB) as db:
  db.execute('CREATE TABLE IF NOT EXISTS counts (day TEXT,event TEXT,page TEXT,product TEXT,count INTEGER,PRIMARY KEY(day,event,page,product))')
  db.execute('INSERT INTO counts VALUES(?,?,?,?,1) ON CONFLICT(day,event,page,product) DO UPDATE SET count=count+1',(today.isoformat(),obj['event'],obj['page'],obj['product'] or ''))
  db.execute('DELETE FROM counts WHERE day < ?',((today-dt.timedelta(days=90)).isoformat(),))
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def respond(self,code):
  self.send_response(code);self.send_header('Cache-Control','no-store');self.send_header('Content-Length','0');self.end_headers()
 def do_POST(self):
  if self.path!='/events':return self.respond(404)
  if self.headers.get('Origin')!=ORIGIN:return self.respond(403)
  if self.headers.get('DNT')=='1' or self.headers.get('Sec-GPC')=='1':return self.respond(204)
  try:
   n=int(self.headers.get('Content-Length','0'))
   if not 0<n<=1024:return self.respond(413)
   if self.headers.get('Content-Type')!='application/json':return self.respond(415)
   obj=json.loads(self.rfile.read(n))
   if not validate(obj):return self.respond(400)
   record(obj)
  except (ValueError,TypeError):return self.respond(400)
  except sqlite3.Error:return self.respond(503)
  self.respond(204)
if __name__=='__main__':ThreadingHTTPServer(('0.0.0.0',int(os.environ.get('PORT','8080'))),Handler).serve_forever()
