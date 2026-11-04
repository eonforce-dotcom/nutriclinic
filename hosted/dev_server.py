"""Local test server that imitates the sahnoroloji.org setup (development only).

Serves ../dist at /nutriclinic/ as the server edition (as nginx does) and the
record API at /nutriclinic/api/local/ with a fixed synthetic user in place of
nginx basic auth. Use only synthetic data.

    python dev_server.py <empty-data-dir> [port] [--guest]

With --guest it imitates guest mode: /nutriclinic/ is open (one cookie-bound
space per browser) and /nutriclinic/tam/ stands for the basic-auth full access.
"""
import os
import sys
from pathlib import Path
from socketserver import ThreadingMixIn
from wsgiref.simple_server import WSGIRequestHandler, WSGIServer, make_server

sys.path.insert(0, str(Path(__file__).resolve().parent))
from nutriclinic_api import Api  # noqa: E402

DIST = Path(__file__).resolve().parent.parent / 'dist'
TYPES = {'.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
         '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
         '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.zip': 'application/zip',
         '.pdf': 'application/pdf', '.png': 'image/png'}
CSP = ("default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
       "font-src 'self' data:; connect-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; "
       "form-action 'self'; frame-ancestors 'none'")


def make_app(data_root, port, guest=False):
    origin = 'http://127.0.0.1:%d' % port
    api = Api(data_root=data_root, allowed_hosts=['127.0.0.1:%d' % port], allowed_origins=[origin], path_prefix='/nutriclinic',
              guest_mode=guest, full_prefix='/nutriclinic/tam' if guest else '', cookie_secure=False)

    def app(environ, start_response):
        path = environ.get('PATH_INFO', '')
        if guest and path.startswith('/nutriclinic/tam/api/local/'):
            environ['HTTP_X_REMOTE_USER'] = 'dev-synthetic'  # nginx sets this after basic auth
            return api(environ, start_response)
        if path.startswith('/nutriclinic/api/local/'):
            if guest:
                environ.pop('HTTP_X_REMOTE_USER', None)  # nginx clears it on the open path
            else:
                environ['HTTP_X_REMOTE_USER'] = 'dev-synthetic'  # nginx sets this after basic auth
            return api(environ, start_response)
        if path in ('/nutriclinic', '/nutriclinic/tam'):
            start_response('308 Permanent Redirect', [('Location', path + '/')])
            return [b'']
        if not path.startswith('/nutriclinic/'):
            start_response('404 Not Found', [('Content-Type', 'text/plain')])
            return [b'not found']
        base = '/nutriclinic/tam/' if guest and path.startswith('/nutriclinic/tam/') else '/nutriclinic/'
        relative = path[len(base):] or 'index.html'
        target = (DIST / relative).resolve()
        if DIST.resolve() not in target.parents or not target.is_file():
            start_response('404 Not Found', [('Content-Type', 'text/plain')])
            return [b'not found']
        data = target.read_bytes()
        if target.name == 'edition.mjs':
            data = data.replace(b"export const EDITION = 'local';", b"export const EDITION = 'server';")
        start_response('200 OK', [('Content-Type', TYPES.get(target.suffix, 'application/octet-stream')), ('Content-Security-Policy', CSP),
                                  ('X-Content-Type-Options', 'nosniff'), ('Cache-Control', 'no-store'), ('Content-Length', str(len(data)))])
        return [data]
    return app


class QuietHandler(WSGIRequestHandler):
    def log_request(self, code='-', size='-'):
        sys.stderr.write('%s %s\n' % (code, self.path.split('?')[0]))


class ThreadingServer(ThreadingMixIn, WSGIServer):
    # Browsers open speculative connections; one idle socket must not block the others.
    daemon_threads = True


if __name__ == '__main__':
    arguments = [item for item in sys.argv[1:] if item != '--guest']
    root = os.path.abspath(arguments[0])
    port = int(arguments[1]) if len(arguments) > 1 else 4199
    os.makedirs(root, exist_ok=True)
    with make_server('127.0.0.1', port, make_app(root, port, guest='--guest' in sys.argv), server_class=ThreadingServer, handler_class=QuietHandler) as server:
        print('NutriClinic dev server: http://127.0.0.1:%d/nutriclinic/ (synthetic data only)' % port, flush=True)
        server.serve_forever()
