"""Static bot-readable preview contract. Set PREVIEW_BASE_URL to test a deployment."""
import io
import os
from pathlib import Path
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
import unittest
from urllib.request import Request, urlopen
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / 'web'
ORIGIN = 'https://venice.osovsky.com'
IMAGE_PATH = '/img/venice-link-preview-v1.jpg'
TITLE = 'Venice, building by building'
DESCRIPTION = 'Historic Venice buildings in 3D, coloured by era of construction.'
ALT = 'The live 3D atlas of historic Venice, with buildings coloured by construction era.'
EXPECTED = {
    'og:type': 'website', 'og:url': ORIGIN + '/',
    'og:title': TITLE, 'og:description': DESCRIPTION,
    'og:image': ORIGIN + IMAGE_PATH, 'og:image:type': 'image/jpeg',
    'og:image:width': '1200', 'og:image:height': '630', 'og:image:alt': ALT,
    'twitter:card': 'summary_large_image', 'twitter:title': TITLE,
    'twitter:description': DESCRIPTION, 'twitter:image': ORIGIN + IMAGE_PATH,
    'twitter:image:alt': ALT,
}
PAGES = ('index.html', 'splash1.html', 'splash2.html', 'splash3.html')
BOT_UAS = ('Twitterbot/1.0', 'TelegramBot (like TwitterBot)')


class HeadMetadata(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.in_head = False
        self.values = {}
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        if tag == 'head':
            self.in_head = True
        if tag == 'meta' and self.in_head:
            attrs = dict(attrs)
            key = attrs.get('property') or attrs.get('name')
            self.values.setdefault(key, []).append(attrs.get('content'))

    def handle_endtag(self, tag):
        if tag == 'head':
            self.in_head = False


class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB), **kwargs)

    def translate_path(self, path):
        # Mirror existing Vercel cleanUrls and /ru rewrite; never execute JS.
        if path.split('?')[0] in ('/ru', '/ru/'):
            path = '/index.html'
        elif path.split('?')[0] in ('/splash1', '/splash2', '/splash3'):
            path += '.html'
        return super().translate_path(path)

    def log_message(self, format, *args):
        pass


class LinkPreviewTests(unittest.TestCase):
    def assert_metadata(self, html):
        values = HeadMetadata(html).values
        for key, expected in EXPECTED.items():
            self.assertEqual(values.get(key), [expected], key + ' must occur once in static head')

    def assert_image(self, payload):
        self.assertLess(len(payload), 500_000)
        with Image.open(io.BytesIO(payload)) as image:
            self.assertEqual(image.format, 'JPEG')
            self.assertEqual(image.size, (1200, 630))
            image.load()
            self.assertGreater(len(image.getcolors(1200 * 630) or []), 1000,
                               'preview must contain rendered artwork, not a flat placeholder')

    def test_every_atlas_entry_has_static_metadata(self):
        for page in PAGES:
            with self.subTest(page=page):
                self.assert_metadata((WEB / page).read_text(encoding='utf-8'))

    def test_preview_is_decodable_landscape_jpeg(self):
        self.assertTrue((WEB / IMAGE_PATH.lstrip('/')).is_file(), 'preview JPEG is missing')
        self.assert_image((WEB / IMAGE_PATH.lstrip('/')).read_bytes())

    def test_bot_http_html_and_image_without_javascript(self):
        base = os.environ.get('PREVIEW_BASE_URL')
        server = None
        if not base:
            server = ThreadingHTTPServer(('127.0.0.1', 0), PreviewHandler)
            Thread(target=server.serve_forever, daemon=True).start()
            base = 'http://127.0.0.1:' + str(server.server_port)
        try:
            for ua in BOT_UAS:
                for path in ('/', '/ru', '/ru/', '/splash1', '/splash2', '/splash3'):
                    with self.subTest(ua=ua, path=path):
                        with urlopen(Request(base.rstrip('/') + path, headers={'User-Agent': ua}), timeout=45) as response:
                            self.assertEqual(response.status, 200)
                            self.assert_metadata(response.read().decode('utf-8'))
                with self.subTest(ua=ua, image=True):
                    url = base.rstrip('/') + IMAGE_PATH
                    with urlopen(Request(url, method='HEAD', headers={'User-Agent': ua}), timeout=45) as response:
                        self.assertEqual(response.status, 200)
                        self.assertEqual(response.headers.get_content_type(), 'image/jpeg')
                    with urlopen(Request(url, headers={'User-Agent': ua}), timeout=45) as response:
                        self.assertEqual(response.status, 200)
                        self.assertEqual(response.headers.get_content_type(), 'image/jpeg')
                        self.assert_image(response.read())
        finally:
            if server:
                server.shutdown()
                server.server_close()


if __name__ == '__main__':
    unittest.main()
