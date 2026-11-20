import io
import unittest
from email.message import Message
from unittest.mock import Mock, patch
from check_release import Page, is_product, probe


class Checks(unittest.TestCase):
    def test_product_recognition(self):
        self.assertTrue(is_product('https://link.amazon/example'))
        self.assertTrue(is_product('https://www.amazon.com/dp/example'))
        self.assertFalse(is_product('https://affiliate-program.amazon.com/help/operating/agreement'))
        self.assertFalse(is_product('https://amazon.com.example.org/dp/example'))

    def test_hidden_and_title(self):
        p = Page()
        p.feed('<head><title>Kitchen</title></head><p>Visible</p><script>Hidden</script>')
        self.assertEqual(p.title, ['Kitchen'])
        self.assertEqual(p.text, ['Visible'])

    def test_full_crawl(self):
        root = 'https://example.org/shop/'
        def run(sponsored):
            def serve(request, timeout):
                url = request.full_url
                if url == root + 'sitemap.xml':
                    html = '<urlset><url><loc>' + root + 'guide</loc></url></urlset>'
                elif url == root + 'feed.xml':
                    html = '<rss><channel><item><link>' + root + 'guide</link></item></channel></rss>'
                else:
                    self.assertIn(url, (root, root + 'guide'))
                    html = f'''<head><title>Guide</title><link rel="canonical" href="{url}">
                    <link type="application/rss+xml" href="feed.xml"></head>
                    <header>As an Amazon Associate</header><a href="https://link.amazon/sample" rel="{sponsored}">Shop</a>
                    <footer>As an Amazon Associate</footer>'''
                r = io.BytesIO(html.encode())
                r.geturl = lambda: url
                r.headers = Message()
                r.headers['Content-Type'] = 'text/xml' if url.endswith('xml') else 'text/html'
                return r
            with patch('check_release.build_opener', return_value=Mock(open=serve)):
                return probe(root)
        self.assertEqual(run('sponsored')['findings'], [])
        self.assertIn('lacks rel=sponsored', run('')['findings'][0])
