"""Run behind a TLS reverse proxy with access logging disabled and rate limiting."""
import json, os, sqlite3
from datetime import date, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DB = os.environ.get('METRICS_DB', 'metrics.sqlite')
ORIGIN = os.environ.get('SITE_ORIGIN', 'https://kanlerxz87-cyber.github.io')
PAGES = {p.name for p in Path(__file__).resolve().parents[1].glob('*.html')}

def record(day, event, page, count=1):
    with sqlite3.connect(DB) as db:
        db.execute('CREATE TABLE IF NOT EXISTS totals (day TEXT, event TEXT, page TEXT, count INTEGER, PRIMARY KEY(day,event,page))')
        db.execute('DELETE FROM totals WHERE day < ?', (str(date.today()-timedelta(days=90)),))
        db.execute('INSERT INTO totals VALUES (?,?,?,?) ON CONFLICT(day,event,page) DO UPDATE SET count=count+excluded.count', (day,event,page,count))

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass

    def do_POST(self):
        status = 400
        allowed = self.headers.get('Origin') == ORIGIN
        try:
            if self.path != '/events' or not allowed:
                status = 403
            elif 0 < int(self.headers.get('Content-Length', 0)) <= 256:
                row = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                if set(row) == {'event','page'} and row['event'] in ('page_view','guide_view','rss_open','affiliate_click') and row['page'] in PAGES:
                    record(str(date.today()), row['event'], row['page']); status = 204
        except (ValueError, TypeError): pass
        except sqlite3.Error: status = 503
        self.send_response(status)
        if allowed: self.send_header('Access-Control-Allow-Origin', ORIGIN)
        self.send_header('Vary', 'Origin'); self.end_headers()

if __name__ == '__main__':
    ThreadingHTTPServer(('0.0.0.0', int(os.environ.get('PORT', '8080'))), Handler).serve_forever()
