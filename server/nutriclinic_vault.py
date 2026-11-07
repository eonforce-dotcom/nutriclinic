"""NutriClinic site copies: anonymised cases of the staged recommender, kept in a SQLite database.

A clinician who ticks "Also keep cases on the site" sends each case without its label (the only free text in a case)
under a random case code such as NC-7K3P-Q2M9; the device keeps the label and the whole case, and matches the code to
show the real case. Each device holds a random owner token, of which the database keeps only the SHA-256: a device
reads, writes and deletes only its own copies. The administrator reads every copy, anonymised, through a separate path
that nginx protects with the site's password. The database accepts only clinical values (numbers, true/false, short
choice identifiers without spaces), so no name or other free text can be stored. Python standard library only.

Public routes (prefix NUTRICLINIC_VAULT_PREFIX, default /nutriclinic/api/vault), header X-Site-Token (43 base64url):
  GET    <prefix>/                 {cases: [{code, updatedAt}]} of this device
  PUT    <prefix>/<code>           {updatedAt, data} -> {}; 409 when the code belongs to another device
  DELETE <prefix>/<code>           -> {}
Administrator routes (prefix NUTRICLINIC_ADMIN_PREFIX, default /nutriclinic/yonetim/api; only with X-Remote-User,
which nginx sets after the password and clears everywhere else):
  GET    <admin>/cases[?offset=&limit=]   {total, cases: [{code, source, updatedAt, savedAt, data}]}
  GET    /healthz
"""
# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Gökay Duman
import hashlib
import json
import math
import os
import re
import sqlite3
from datetime import datetime, timezone

CODE = re.compile(r'NC-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}')
TOKEN = re.compile(r'[A-Za-z0-9_-]{43}')
ISO = re.compile(r'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{3})?Z')
KEY = re.compile(r'[A-Za-z][A-Za-z0-9]{0,40}')
WORD = re.compile(r'[^\s\x00-\x1f\x7f]{1,40}')  # a value without spaces or control characters (no free text)
DECISION_ID = re.compile(r'[a-z][a-z0-9-]{0,40}')
CHOICE_ID = re.compile(r'[a-z0-9][a-z0-9-]{0,60}')
VERSION = re.compile(r'[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}')
MAX_BODY = 64 * 1024
MAX_DATA = 32 * 1024
SCHEMA = """CREATE TABLE IF NOT EXISTS cases (code TEXT PRIMARY KEY, owner TEXT NOT NULL, updated_at TEXT NOT NULL,
  saved_at TEXT NOT NULL, data TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS cases_owner ON cases(owner);"""


class SiteError(Exception):
    def __init__(self, status, code):
        super().__init__(code)
        self.status = status
        self.code = code


def _now():
    moment = datetime.now(timezone.utc)
    return moment.strftime('%Y-%m-%dT%H:%M:%S.') + '%03dZ' % (moment.microsecond // 1000)


def _reject_constant(name):
    raise ValueError(name)


def _plain(value, limit=40):
    """A clinical value: true/false, a finite number or a short word without spaces."""
    if isinstance(value, bool):
        return True
    if isinstance(value, (int, float)):
        return math.isfinite(value)
    return isinstance(value, str) and (value == '' or (len(value) <= limit and WORD.fullmatch(value) is not None))


def clean_data(data):
    """The case as stored (canonical JSON); SiteError(400) unless `data` holds only the clinical parts of a case."""
    if not isinstance(data, dict) or not set(data) <= {'values', 'product', 'followup', 'decisions', 'engine'}:
        raise SiteError(400, 'data')
    values = data.get('values', {})
    if not isinstance(values, dict) or len(values) > 400 or not all(isinstance(k, str) and KEY.fullmatch(k) and _plain(v) for k, v in values.items()):
        raise SiteError(400, 'values')
    product = data.get('product', {})
    if not isinstance(product, dict):
        raise SiteError(400, 'product')
    for group, items in product.items():
        if group == 'form' and items == 'powder':
            continue
        if group not in ('en', 'ons', 'module', 'powder') or not isinstance(items, dict) or len(items) > 20 \
                or not all(isinstance(k, str) and KEY.fullmatch(k) and _plain(v, 20) for k, v in items.items()):
            raise SiteError(400, 'product')
    followup = data.get('followup', [])
    if not isinstance(followup, list) or len(followup) > 31 or not all(
            isinstance(r, dict) and set(r) <= {'day', 'kcal', 'protein'} and all(_plain(v, 12) for v in r.values()) for r in followup):
        raise SiteError(400, 'followup')
    decisions = data.get('decisions', {})
    if not isinstance(decisions, dict) or len(decisions) > 20 or not all(
            isinstance(k, str) and DECISION_ID.fullmatch(k) and isinstance(v, str) and CHOICE_ID.fullmatch(v) for k, v in decisions.items()):
        raise SiteError(400, 'decisions')
    if 'engine' in data and not (isinstance(data['engine'], str) and VERSION.fullmatch(data['engine'])):
        raise SiteError(400, 'engine')
    text = json.dumps(data, separators=(',', ':'), ensure_ascii=False, sort_keys=True)
    if len(text.encode('utf-8')) > MAX_DATA:
        raise SiteError(413, 'too-large')
    return text


class Store:
    def __init__(self, root, max_owners=5000, max_cases=200, max_owner_bytes=2 * 1024 * 1024, max_total_bytes=1024 ** 3,
                 min_free_bytes=5 * 1024 ** 3, now=_now, free_bytes=None):
        directory = os.path.join(root, 'site')
        os.makedirs(directory, mode=0o700, exist_ok=True)
        self.path = os.path.join(directory, 'cases.sqlite')
        self.db = sqlite3.connect(self.path, isolation_level=None, check_same_thread=False)
        self.db.execute('PRAGMA journal_mode=WAL')
        self.db.execute('PRAGMA busy_timeout=5000')
        self.db.executescript(SCHEMA)
        self.max_owners = max_owners
        self.max_cases = max_cases
        self.max_owner_bytes = max_owner_bytes
        self.max_total_bytes = max_total_bytes
        self.min_free_bytes = min_free_bytes
        self.now = now
        self.free_bytes = free_bytes or self._free_bytes

    def close(self):
        self.db.close()

    def _free_bytes(self):
        if not hasattr(os, 'statvfs'):  # not on Linux (tests elsewhere)
            return None
        st = os.statvfs(os.path.dirname(self.path))
        return st.f_bavail * st.f_frsize

    @staticmethod
    def owner(token):
        if not isinstance(token, str) or not TOKEN.fullmatch(token):
            raise SiteError(401, 'token')
        return hashlib.sha256(token.encode('ascii')).hexdigest()

    def list(self, token):
        owner = self.owner(token)
        rows = self.db.execute('SELECT code, updated_at FROM cases WHERE owner=? ORDER BY code', (owner,)).fetchall()
        return {'cases': [{'code': c, 'updatedAt': u} for c, u in rows]}

    def put(self, token, code, body):
        owner = self.owner(token)
        if not isinstance(code, str) or not CODE.fullmatch(code):
            raise SiteError(404, 'not-found')
        if not isinstance(body, dict) or set(body) != {'updatedAt', 'data'}:
            raise SiteError(400, 'body')
        if not isinstance(body['updatedAt'], str) or not ISO.fullmatch(body['updatedAt']):
            raise SiteError(400, 'updated-at')
        text = clean_data(body['data'])
        free = self.free_bytes()
        if free is not None and free < self.min_free_bytes:  # the disk is shared with the rest of the site
            raise SiteError(507, 'disk')
        self.db.execute('BEGIN IMMEDIATE')
        try:
            row = self.db.execute('SELECT owner, length(data) FROM cases WHERE code=?', (code,)).fetchone()
            if row and row[0] != owner:
                raise SiteError(409, 'taken')
            count, size = self.db.execute('SELECT count(*), coalesce(sum(length(data)), 0) FROM cases WHERE owner=?', (owner,)).fetchone()
            if not row and count >= self.max_cases:
                raise SiteError(507, 'case-limit')
            if not row and count == 0 and self.db.execute('SELECT count(DISTINCT owner) FROM cases').fetchone()[0] >= self.max_owners:
                raise SiteError(507, 'capacity')
            old = row[1] if row else 0
            if size - old + len(text) > self.max_owner_bytes:
                raise SiteError(507, 'owner-full')
            if self.db.execute('SELECT coalesce(sum(length(data)), 0) FROM cases').fetchone()[0] - old + len(text) > self.max_total_bytes:
                raise SiteError(507, 'full')
            self.db.execute('INSERT INTO cases (code, owner, updated_at, saved_at, data) VALUES (?, ?, ?, ?, ?) '
                            'ON CONFLICT(code) DO UPDATE SET updated_at=excluded.updated_at, saved_at=excluded.saved_at, data=excluded.data',
                            (code, owner, body['updatedAt'], self.now(), text))
            self.db.execute('COMMIT')
        except BaseException:
            self.db.execute('ROLLBACK')
            raise
        return {}

    def delete(self, token, code):
        owner = self.owner(token)
        if not isinstance(code, str) or not CODE.fullmatch(code):
            raise SiteError(404, 'not-found')
        self.db.execute('DELETE FROM cases WHERE code=? AND owner=?', (code, owner))  # another device's code: nothing happens
        return {}

    def admin_list(self, offset=0, limit=500):
        total = self.db.execute('SELECT count(*) FROM cases').fetchone()[0]
        rows = self.db.execute('SELECT code, owner, updated_at, saved_at, data FROM cases ORDER BY saved_at DESC, code LIMIT ? OFFSET ?',
                               (limit, offset)).fetchall()
        # "source": a short tag of the sending device, so that the copies of one device can be told apart; not an identity.
        return {'total': total, 'cases': [{'code': c, 'source': 'K-' + o[:6], 'updatedAt': u, 'savedAt': s, 'data': json.loads(d)}
                                          for c, o, u, s, d in rows]}


class App:
    """WSGI application: routing, host and origin checks, JSON in and out."""

    def __init__(self, store, prefix='/nutriclinic/api/vault', admin_prefix='/nutriclinic/yonetim/api',
                 allowed_hosts=('sahnoroloji.org',), allowed_origins=('https://sahnoroloji.org',)):
        self.store = store
        self.prefix = prefix.rstrip('/')
        self.admin_prefix = admin_prefix.rstrip('/')
        self.allowed_hosts = {h.strip().lower() for h in allowed_hosts if h.strip()}
        self.allowed_origins = {o.strip() for o in allowed_origins if o.strip()}

    def __call__(self, environ, start_response):
        try:
            status, body = self.handle(environ)
        except SiteError as error:
            status, body = error.status, {'error': error.code}
        except Exception:  # never show internals
            status, body = 500, {'error': 'server'}
        data = json.dumps(body, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
        reasons = {200: 'OK', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed',
                   409: 'Conflict', 413: 'Payload Too Large', 415: 'Unsupported Media Type', 421: 'Misdirected Request',
                   500: 'Internal Server Error', 507: 'Insufficient Storage'}
        start_response('%d %s' % (status, reasons.get(status, 'Error')), [
            ('Content-Type', 'application/json; charset=utf-8'), ('Content-Length', str(len(data))), ('Cache-Control', 'no-store'),
            ('X-Content-Type-Options', 'nosniff'), ('Referrer-Policy', 'no-referrer')])
        return [data]

    def _body(self, environ):
        if (environ.get('CONTENT_TYPE') or '').split(';')[0].strip().lower() != 'application/json':
            raise SiteError(415, 'content-type')
        try:
            length = int(environ.get('CONTENT_LENGTH') or 0)
        except ValueError:
            raise SiteError(400, 'length')
        if length <= 0:
            raise SiteError(400, 'body')
        if length > MAX_BODY:
            raise SiteError(413, 'too-large')
        raw = environ['wsgi.input'].read(length)
        try:
            return json.loads(raw.decode('utf-8'), parse_constant=_reject_constant)
        except (UnicodeDecodeError, ValueError, RecursionError):
            raise SiteError(400, 'json')

    def handle(self, environ):
        method = environ.get('REQUEST_METHOD', 'GET')
        path = environ.get('PATH_INFO', '')
        if path == '/healthz':
            return 200, {'ok': True}
        host = (environ.get('HTTP_HOST') or '').split(':')[0].lower()
        if host not in self.allowed_hosts:
            raise SiteError(421, 'host')
        origin = environ.get('HTTP_ORIGIN')
        if origin is not None and origin not in self.allowed_origins:
            raise SiteError(403, 'origin')
        if path.startswith(self.admin_prefix + '/'):
            if not (environ.get('HTTP_X_REMOTE_USER') or '').strip():
                raise SiteError(401, 'admin')
            if method != 'GET' or path[len(self.admin_prefix):] != '/cases':
                raise SiteError(404, 'not-found')
            query = dict(part.split('=', 1) for part in (environ.get('QUERY_STRING') or '').split('&') if '=' in part)
            try:
                offset = max(0, int(query.get('offset', '0')))
                limit = min(2000, max(1, int(query.get('limit', '500'))))
            except ValueError:
                raise SiteError(400, 'query')
            return 200, self.store.admin_list(offset, limit)
        if not path.startswith(self.prefix + '/'):
            raise SiteError(404, 'not-found')
        rest = path[len(self.prefix) + 1:]
        token = environ.get('HTTP_X_SITE_TOKEN', '')
        if rest == '':
            if method == 'GET':
                return 200, self.store.list(token)
            raise SiteError(405, 'method')
        if '/' in rest:
            raise SiteError(404, 'not-found')
        if method == 'PUT':
            return 200, self.store.put(token, rest, self._body(environ))
        if method == 'DELETE':
            return 200, self.store.delete(token, rest)
        raise SiteError(405, 'method')


def create_app(env=os.environ):
    numbers = lambda name, default: int(env.get(name, default))
    store = Store(env.get('NUTRICLINIC_VAULT_DATA', '/data'), max_owners=numbers('NUTRICLINIC_VAULT_ACCOUNTS', 5000),
                  max_cases=numbers('NUTRICLINIC_VAULT_CASES', 200), max_owner_bytes=numbers('NUTRICLINIC_VAULT_ACCOUNT_MB', 2) * 1024 * 1024,
                  max_total_bytes=numbers('NUTRICLINIC_VAULT_TOTAL_MB', 1024) * 1024 * 1024,
                  min_free_bytes=numbers('NUTRICLINIC_VAULT_MIN_FREE_GB', 5) * 1024 ** 3)
    return App(store, prefix=env.get('NUTRICLINIC_VAULT_PREFIX', '/nutriclinic/api/vault'),
               admin_prefix=env.get('NUTRICLINIC_ADMIN_PREFIX', '/nutriclinic/yonetim/api'),
               allowed_hosts=env.get('NUTRICLINIC_ALLOWED_HOSTS', 'sahnoroloji.org').split(','),
               allowed_origins=env.get('NUTRICLINIC_VAULT_ORIGINS', 'https://sahnoroloji.org').split(','))


application = create_app() if os.environ.get('NUTRICLINIC_VAULT_DATA') else None
