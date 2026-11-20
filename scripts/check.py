from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

class Links(HTMLParser):
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs); url=attrs.get('href') or attrs.get('src')
        if not url: return
        u=urlsplit(url)
        if attrs.get('data-event')=='affiliate_click':
            assert 'sponsored' in attrs['rel'].split()
        if not u.scheme and not u.netloc:
            p=Path(u.path or current.name); p=p/'index.html' if p.is_dir() else p
            assert p.is_file(), (current,url)
            if u.fragment: assert f'id="{u.fragment}"' in p.read_text(), (current,url)

pages=list(Path('.').glob('*.html'))
for current in pages:
    html=current.read_text(); assert html.count('As an Amazon Associate I earn from qualifying purchases.')==2
    Links().feed(html)
    assert html.count('rel="canonical"')==1
for doc in ('sitemap.xml','feed.xml'):
    tree=ET.parse(doc)
    for el in tree.iter():
        if el.tag.rsplit('}',1)[-1] in ('link','loc','guid'):
            assert urlsplit(el.text).netloc=='kanlerxz87-cyber.github.io'
            assert Path(urlsplit(el.text).path.removeprefix('/DIYHOME1/') or 'index.html').is_file()
print(f'Checked {len(pages)} pages, local links, sitemap and feed')
