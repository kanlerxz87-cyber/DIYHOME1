"""Read-only, dependency-free acceptance probe for an already deployed Pages site."""
import argparse
import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import deque
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.parse import urldefrag, urljoin, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links, self.text, self.feeds, self.canonicals = [], [], [], []
        self.title, self.hidden = [], 0
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'a' and a.get('href'):
            self.links.append((a['href'], (a.get('rel') or '').lower().split()))
        if tag == 'link':
            if 'canonical' in (a.get('rel') or '').lower().split():
                self.canonicals.append(a.get('href') or '')
            if a.get('type') in ('application/rss+xml', 'application/atom+xml'):
                self.feeds.append(a.get('href') or '')
        if tag == 'title':
            self.in_title = True
        if tag in ('script', 'style', 'template', 'head'):
            self.hidden += 1

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False
        if tag in ('script', 'style', 'template', 'head'):
            self.hidden = max(self.hidden - 1, 0)

    def handle_data(self, data):
        if self.in_title:
            self.title.append(data)
        if not self.hidden:
            self.text.append(data)


class NoExternalRedirect(HTTPRedirectHandler):
    def __init__(self, allowed):
        self.allowed = allowed

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not self.allowed(newurl):
            raise ValueError('redirect outside publication: ' + newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def is_product(url):
    u = urlsplit(url)
    host = (u.hostname or '').lower()
    if host in {'amzn.to', 'a.co', 'link.amazon', 'amzn.eu'}:
        return True
    return bool(re.fullmatch(r'(?:[\w-]+\.)*amazon\.(?:com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})', host)
                and (re.search(r'/(?:dp|gp/product|gp/aw/d)/', u.path) or 'tag=' in u.query))


def probe(base, cap=150):
    root = urlsplit(base)
    if root.scheme != 'https' or not root.hostname or not root.path.endswith('/') or root.query or root.fragment:
        raise ValueError('base must be an HTTPS publication root ending with /')
    def internal(url):
        u = urlsplit(url)
        return u.scheme == root.scheme and u.netloc == root.netloc and u.path.startswith(root.path)
    opener = build_opener(NoExternalRedirect(internal))
    errors, seen, feeds = [], set(), set()
    queue = deque([base, urljoin(base, 'sitemap.xml')])
    pages = 0
    def enqueue(href, parent):
        url = urldefrag(urljoin(parent, href))[0]
        if internal(url) and url not in seen and url not in queue:
            queue.append(url)
    while queue and len(seen) < cap:
        url = queue.popleft()
        seen.add(url)
        try:
            with opener.open(Request(url, headers={'User-Agent': 'DIYHOME1-ReleaseReview/1.0'}), timeout=10) as r:
                final, mime = r.geturl(), r.headers.get_content_type()
                if mime not in ('text/html', 'text/xml', 'application/xml', 'application/rss+xml', 'application/atom+xml') and not urlsplit(final).path.endswith('.xml'):
                    continue
                data = r.read(2_000_001)
            if len(data) > 2_000_000:
                raise ValueError('document exceeds review limit')
            if mime != 'text/html' or urlsplit(final).path.endswith('.xml'):
                tree = ET.fromstring(data)
                tag = tree.tag.split('}')[-1]
                if tag in ('urlset', 'sitemapindex'):
                    locs = tree.findall('.//{*}loc')
                    if not locs:
                        errors.append(f'{url}: empty sitemap')
                    for loc in locs:
                        if not internal(loc.text or ''):
                            errors.append(f'{url}: sitemap URL outside canonical root: {loc.text}')
                        else:
                            enqueue(loc.text, final)
                elif tag in ('rss', 'feed'):
                    feeds.add(final)
                    entries = tree.findall('channel/item') if tag == 'rss' else tree.findall('{*}entry')
                    if not entries:
                        errors.append(f'{url}: no published feed entries')
                    for entry in entries:
                        link = entry.find('{*}link')
                        dest = '' if link is None else (link.get('href') or link.text or '')
                        if internal(dest):
                            enqueue(dest, final)
                        else:
                            errors.append(f'{url}: feed entry has no canonical site URL')
                else:
                    errors.append(f'{url}: unexpected XML root {tag}')
                continue
            pages += 1
            p = Page()
            p.feed(data.decode('utf-8'))
            text = ' '.join(' '.join(p.text).lower().split())
            if text.count('as an amazon associate') < 2:
                errors.append(f'{url}: two visible-text Associates statement candidates not found')
            if len(p.canonicals) != 1 or not internal(p.canonicals[0]):
                errors.append(f'{url}: missing, multiple or non-publication canonical')
            if not ''.join(p.title).strip():
                errors.append(f'{url}: missing title')
            for href, rel in p.links:
                if is_product(urljoin(final, href)) and 'sponsored' not in rel:
                    errors.append(f'{url}: product/short link lacks rel=sponsored')
                enqueue(href, final)
            for href in p.feeds:
                enqueue(href, final)
        except (HTTPError, URLError, ValueError, OSError, ET.ParseError) as e:
            errors.append(f'{url}: {e}')
    if queue:
        errors.append('request limit reached; crawl incomplete')
    if pages < 2:
        errors.append('fewer than two public HTML pages reached')
    if not feeds:
        errors.append('no linked RSS/Atom feed reached')
    return {'checked_at': datetime.now(timezone.utc).isoformat(), 'base': base,
            'html_pages': pages, 'requested_urls': sorted(seen), 'feeds': sorted(feeds), 'findings': errors}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('base')
    args = parser.parse_args()
    report = probe(args.base)
    print(json.dumps(report, indent=2))
    sys.exit(bool(report['findings']))
