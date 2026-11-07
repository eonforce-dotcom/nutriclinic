"""NutriClinic site copies: anonymised cases of the staged recommender, kept in a SQLite database.

A clinician who ticks "Also keep cases on the site" sends each case without its label (the only free text in a case)
under a random case code such as NC-7K3P-Q2M9; the device keeps the label and the whole case, and matches the code to
show the real case. The copy holds clinical values only, and age only as a five-year band. Each device holds a random
owner token, of which the database keeps only the SHA-256: a device reads, writes and deletes only its own copies. The
administrator reads every copy, anonymised (day of saving only, no device trace), through a separate path that nginx
protects with the site's password. A device sending its first copy counts against a daily limit per internet address
(NUTRICLINIC_VAULT_NEW_PER_DAY, default 30; IPv6 by /64; nginx passes the address in X-NC-Client), kept hashed with
a salt that exists only in memory and changes every day, for that day only. Python standard library only.

What a copy may hold (anything else is refused, so no name, ID number, telephone number, e-mail address or date can be
stored): numbers of at most six digits before and four after the decimal mark, true/false, the answer words of the
application's own questions (CHOICES; tests/vault.test.mjs checks the list against web/app.mjs), the laboratory
units, and the age band (a plain age is turned into its band, one that cannot be banded is left out). A device whose
copies were all deleted (site storage turned off) cannot send again with the same token (410).

Public routes (prefix NUTRICLINIC_VAULT_PREFIX, default /nutriclinic/api/vault), header X-Site-Token (43 base64url):
  GET    <prefix>/                 {cases: [{code, updatedAt}]} of this device
  DELETE <prefix>/                 deletes every copy of this device and closes its token
  PUT    <prefix>/<code>           {updatedAt, data} -> {}; 409 when the code belongs to another device, 410 when the token
                                   was closed
  DELETE <prefix>/<code>           -> {}
Administrator routes (prefix NUTRICLINIC_ADMIN_PREFIX, default /nutriclinic/yonetim/api; only with the X-Remote-User
that nginx sets after the site's password and clears everywhere else; NUTRICLINIC_ADMIN_USERS, when set, also limits
it to the user names listed):
  GET    <admin>/cases[?offset=&limit=]   {total, offset, cases: [{code, savedOn, data}]}, at most 200 a page, by day of
                                          saving (newest first) and code: nothing shows which copies came together
  GET    /healthz
"""
# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Gökay Duman
import hashlib
import ipaddress
import json
import math
import os
import re
import sqlite3
import sys
from datetime import datetime, timezone

CODE = re.compile(r'NC-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}')
TOKEN = re.compile(r'[A-Za-z0-9_-]{43}')
ISO = re.compile(r'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{3})?Z')
KEY = re.compile(r'[A-Za-z][A-Za-z0-9]{0,40}')
DECIMAL = re.compile(r'[+-]?[0-9]{1,6}([.,][0-9]{1,4})?')
# The answer words of the application's questions (web/app.mjs STEPS); numeric answers are numbers.
CHOICES = frozenset(['acute', 'advanced', 'aki', 'anuria12', 'bedside', 'chronic', 'constipation', 'continuous', 'contraindicated',
                     'controlled', 'crrt', 'diarrhea', 'ecmo', 'fees', 'female', 'icu', 'ihd', 'intermittent', 'male', 'moderate', 'modified',
                     'no', 'none', 'normal', 'ok', 'oliguria12', 'oliguria24', 'oliguria6', 'ongoing', 'safe', 'severe', 'social',
                     'uncontrolled', 'unknown', 'unsafe', 'vfss', 'ward', 'yes'])
AGE_BAND = re.compile(r'[0-9]{1,2}-[0-9]{1,2}|90\+')
UNITS = frozenset(['mmol/L', 'mEq/L', 'mg/dL', 'µmol/L', 'g/dL', 'g/L', 'mg/L', '10³/µL', '/µL', 'ng/mL', 'nmol/L', 'BUN mg/dL'])
DECISION_ID = re.compile(r'[a-z][a-z0-9-]{0,40}')
CHOICE_ID = re.compile(r'[a-z0-9][a-z0-9-]{0,60}')
VERSION = re.compile(r'[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}')
MAX_BODY = 64 * 1024
MAX_DATA = 32 * 1024
PAGE = 200
SCHEMA = """CREATE TABLE IF NOT EXISTS cases (code TEXT PRIMARY KEY, owner TEXT NOT NULL, updated_at TEXT NOT NULL,
  saved_at TEXT NOT NULL, data TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS cases_owner ON cases(owner);
CREATE INDEX IF NOT EXISTS cases_day ON cases(substr(saved_at, 1, 10), code);
CREATE TABLE IF NOT EXISTS new_devices (client TEXT NOT NULL, day TEXT NOT NULL, count INTEGER NOT NULL, PRIMARY KEY (client, day));
CREATE TABLE IF NOT EXISTS closed (owner TEXT PRIMARY KEY, day TEXT NOT NULL);"""


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


def _number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and abs(value) <= 1e6 and math.isfinite(value)


def _value(key, value):
    """A value a copy may hold (the age only as a band such as 65-69)."""
    if key == 'age':
        return isinstance(value, str) and AGE_BAND.fullmatch(value) is not None
    if isinstance(value, bool) or _number(value):
        return True
    return isinstance(value, str) and (value == '' or DECIMAL.fullmatch(value) is not None or value in CHOICES or value in UNITS)


def client_key(client):
    """What the new-device limit counts: an IPv4 address, or the /64 network of an IPv6 address (one connection gets a
    whole /64)."""
    text = client.strip()
    try:
        address = ipaddress.ip_address(text)
    except ValueError:
        return text
    if address.version == 6:
        if address.ipv4_mapped:
            return str(address.ipv4_mapped)
        return str(ipaddress.ip_network('%s/64' % address, strict=False))
    return str(address)


def age_band(value):
    """The band of an age (as the browser makes it): under 18, 18-19, five-year bands to 85-89, 90 or over; a band as is."""
    if isinstance(value, str) and AGE_BAND.fullmatch(value):
        return value
    if _number(value):
        x = float(value)
    elif isinstance(value, str) and DECIMAL.fullmatch(value.strip()):
        x = float(value.strip().replace(',', '.'))
    else:
        return None
    if x < 0 or x > 130:
        return None
    if x < 18:
        return '0-17'
    if x >= 90:
        return '90+'
    low = int(x // 5) * 5
    return '%d-%d' % (max(18, low), low + 4)


def scrub(data):
    """What may stay of a copy stored before 1.9.1: the age as a band, and only the parts the rules accept."""
    data = data if isinstance(data, dict) else {}
    out = {}
    values = data.get('values')
    if isinstance(values, dict):
        kept = {}
        for key, value in values.items():
            if not (isinstance(key, str) and KEY.fullmatch(key)):
                continue
            if key == 'age':
                value = age_band(value)
                if value is None:
                    continue
            if _value(key, value):
                kept[key] = value
        out['values'] = dict(list(kept.items())[:400])
    product = data.get('product')
    if isinstance(product, dict):
        kept = {}
        for group, items in product.items():
            if group == 'form' and items == 'powder':
                kept['form'] = 'powder'
            elif group in ('en', 'ons', 'module', 'powder') and isinstance(items, dict):
                good = {k: v for k, v in items.items() if isinstance(k, str) and KEY.fullmatch(k) and (
                    _number(v) or (isinstance(v, str) and (v == '' or DECIMAL.fullmatch(v))) or (group, k, v) in (('ons', 'unit', 'mL'), ('ons', 'unit', 'g')))}
                if good:
                    kept[group] = dict(list(good.items())[:20])
        out['product'] = kept
    followup = data.get('followup')
    if isinstance(followup, list):
        rows = []
        for row in followup[:31]:
            if isinstance(row, dict):
                good = {k: v for k, v in row.items() if k in ('day', 'kcal', 'protein') and isinstance(v, str) and (v == '' or DECIMAL.fullmatch(v))}
                if good:
                    rows.append(good)
        out['followup'] = rows
    decisions = data.get('decisions')
    if isinstance(decisions, dict):
        out['decisions'] = dict(list({k: v for k, v in decisions.items() if isinstance(k, str) and DECISION_ID.fullmatch(k)
                                      and isinstance(v, str) and CHOICE_ID.fullmatch(v)}.items())[:20])
    if isinstance(data.get('engine'), str) and VERSION.fullmatch(data['engine']):
        out['engine'] = data['engine']
    return out


def clean_data(data):
    """The case as stored (canonical JSON); SiteError(400) unless `data` holds only the clinical parts of a case."""
    if not isinstance(data, dict) or not set(data) <= {'values', 'product', 'followup', 'decisions', 'engine'}:
        raise SiteError(400, 'data')
    values = data.get('values', {})
    if not isinstance(values, dict) or len(values) > 400 or not all(isinstance(k, str) and KEY.fullmatch(k) and _value(k, v) for k, v in values.items()):
        raise SiteError(400, 'values')
    product = data.get('product', {})
    if not isinstance(product, dict):
        raise SiteError(400, 'product')
    for group, items in product.items():
        if group == 'form' and items == 'powder':
            continue
        if group not in ('en', 'ons', 'module', 'powder') or not isinstance(items, dict) or len(items) > 20 or not all(
                isinstance(k, str) and KEY.fullmatch(k) and (_number(v) or (isinstance(v, str) and (v == '' or DECIMAL.fullmatch(v))) or (group, k, v) in (('ons', 'unit', 'mL'), ('ons', 'unit', 'g')))
                for k, v in items.items()):
            raise SiteError(400, 'product')
    followup = data.get('followup', [])
    if not isinstance(followup, list) or len(followup) > 31 or not all(
            isinstance(r, dict) and set(r) <= {'day', 'kcal', 'protein'} and all(isinstance(v, str) and (v == '' or DECIMAL.fullmatch(v)) for v in r.values())
            for r in followup):
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
                 min_free_bytes=5 * 1024 ** 3, max_new_per_day=30, now=_now, free_bytes=None):
        directory = os.path.join(root, 'site')
        os.makedirs(directory, mode=0o700, exist_ok=True)
        self.path = os.path.join(directory, 'cases.sqlite')
        self.db = sqlite3.connect(self.path, isolation_level=None, check_same_thread=False)
        self.db.execute('PRAGMA journal_mode=WAL')
        self.db.execute('PRAGMA busy_timeout=5000')
        self.db.executescript(SCHEMA)
        self.salt = os.urandom(32).hex()  # in memory only; a new one every day
        self.purged = None
        self.migrated = self._migrate()
        self.max_owners = max_owners
        self.max_cases = max_cases
        self.max_owner_bytes = max_owner_bytes
        self.max_total_bytes = max_total_bytes
        self.min_free_bytes = min_free_bytes
        self.max_new_per_day = max_new_per_day
        self.now = now
        self.free_bytes = free_bytes or self._free_bytes

    def close(self):
        self.db.close()

    def _free_bytes(self):
        if not hasattr(os, 'statvfs'):  # not on Linux (tests elsewhere)
            return None
        st = os.statvfs(os.path.dirname(self.path))
        return st.f_bavail * st.f_frsize

    def _migrate(self):
        # Copies stored before 1.9.1 may hold the age itself or values the rules now refuse: they are scrubbed in place.
        changed = 0
        for code, text in self.db.execute('SELECT code, data FROM cases').fetchall():
            try:
                if clean_data(json.loads(text)) == text:
                    continue
            except SiteError:
                pass
            try:
                fixed = clean_data(scrub(json.loads(text)))
            except (SiteError, ValueError):
                fixed = clean_data({})
            self.db.execute('UPDATE cases SET data=? WHERE code=?', (fixed, code))
            changed += 1
        return changed

    def _purge(self):
        # The new-device counts of earlier days are dropped (the addresses are kept for the day they count only).
        day = self.now()[:10]
        if day != self.purged:
            self.db.execute('DELETE FROM new_devices WHERE day<>?', (day,))
            if self.purged is not None:
                self.salt = os.urandom(32).hex()
            self.purged = day

    @staticmethod
    def owner(token):
        if not isinstance(token, str) or not TOKEN.fullmatch(token):
            raise SiteError(401, 'token')
        return hashlib.sha256(token.encode('ascii')).hexdigest()

    def list(self, token):
        owner = self.owner(token)
        self._purge()
        rows = self.db.execute('SELECT code, updated_at FROM cases WHERE owner=? ORDER BY code', (owner,)).fetchall()
        return {'cases': [{'code': c, 'updatedAt': u} for c, u in rows]}

    def put(self, token, code, body, client=None):
        owner = self.owner(token)
        if not isinstance(code, str) or not CODE.fullmatch(code):
            raise SiteError(404, 'not-found')
        if not isinstance(body, dict) or set(body) != {'updatedAt', 'data'}:
            raise SiteError(400, 'body')
        if not isinstance(body['updatedAt'], str) or not ISO.fullmatch(body['updatedAt']):
            raise SiteError(400, 'updated-at')
        data = body['data']
        if isinstance(data, dict) and isinstance(data.get('values'), dict) and 'age' in data['values']:
            # A page opened before 1.9.1 sends the age itself: its band is kept; an age that cannot be banded is left out.
            values = dict(data['values'])
            band = age_band(values.pop('age'))
            data = {**data, 'values': {**values, **({'age': band} if band is not None else {})}}
        text = clean_data(data)
        size_new = len(text.encode('utf-8'))
        self._purge()
        free = self.free_bytes()
        if free is not None and free < self.min_free_bytes:  # the disk is shared with the rest of the site
            raise SiteError(507, 'disk')
        self.db.execute('BEGIN IMMEDIATE')
        try:
            if self.db.execute('SELECT 1 FROM closed WHERE owner=?', (owner,)).fetchone():
                raise SiteError(410, 'closed')  # site storage was turned off on that device: a late sending changes nothing
            row = self.db.execute('SELECT owner, length(CAST(data AS BLOB)) FROM cases WHERE code=?', (code,)).fetchone()
            if row and row[0] != owner:
                raise SiteError(409, 'taken')
            count, size = self.db.execute('SELECT count(*), coalesce(sum(length(CAST(data AS BLOB))), 0) FROM cases WHERE owner=?', (owner,)).fetchone()
            if not row and count >= self.max_cases:
                raise SiteError(507, 'case-limit')
            if not row and count == 0:
                # A device sending its first copy: limited per client (address) per day, and in number overall.
                if self.db.execute('SELECT count(DISTINCT owner) FROM cases').fetchone()[0] >= self.max_owners:
                    raise SiteError(507, 'capacity')
                if client:
                    # The address is kept only salted and hashed, and only for the day it counts.
                    key = hashlib.sha256((self.salt + client_key(client)).encode('utf-8', 'replace')).hexdigest()
                    day = self.now()[:10]
                    seen = self.db.execute('SELECT count FROM new_devices WHERE client=? AND day=?', (key, day)).fetchone()
                    if seen and seen[0] >= self.max_new_per_day:
                        raise SiteError(429, 'new-device-limit')
                    self.db.execute('INSERT INTO new_devices (client, day, count) VALUES (?, ?, 1) ON CONFLICT(client, day) DO UPDATE SET count=count+1', (key, day))
            old = row[1] if row else 0
            if size - old + size_new > self.max_owner_bytes:
                raise SiteError(507, 'owner-full')
            if self.db.execute('SELECT coalesce(sum(length(CAST(data AS BLOB))), 0) FROM cases').fetchone()[0] - old + size_new > self.max_total_bytes:
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

    def delete_all(self, token):
        owner = self.owner(token)
        self.db.execute('BEGIN IMMEDIATE')
        try:
            self.db.execute('DELETE FROM cases WHERE owner=?', (owner,))
            self.db.execute('INSERT OR IGNORE INTO closed (owner, day) VALUES (?, ?)', (owner, self.now()[:10]))
            self.db.execute('COMMIT')
        except BaseException:
            self.db.execute('ROLLBACK')
            raise
        return {}

    def admin_list(self, offset=0, limit=PAGE):
        total = self.db.execute('SELECT count(*) FROM cases').fetchone()[0]
        rows = self.db.execute('SELECT code, saved_at, data FROM cases ORDER BY substr(saved_at, 1, 10) DESC, code LIMIT ? OFFSET ?',
                               (min(limit, PAGE), offset)).fetchall()
        # Anonymised view: the day of saving only, no change time and no trace of the sending device.
        return {'total': total, 'offset': offset, 'cases': [{'code': c, 'savedOn': s[:10], 'data': json.loads(d)} for c, s, d in rows]}


class App:
    """WSGI application: routing, host and origin checks, JSON in and out."""

    def __init__(self, store, prefix='/nutriclinic/api/vault', admin_prefix='/nutriclinic/yonetim/api', admin_users=(),
                 allowed_hosts=('sahnoroloji.org',), allowed_origins=('https://sahnoroloji.org',)):
        self.store = store
        self.prefix = prefix.rstrip('/')
        self.admin_prefix = admin_prefix.rstrip('/')
        self.admin_users = {u.strip() for u in admin_users if u.strip()}
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
                   409: 'Conflict', 410: 'Gone', 413: 'Payload Too Large', 415: 'Unsupported Media Type', 421: 'Misdirected Request', 429: 'Too Many Requests',
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
            user = (environ.get('HTTP_X_REMOTE_USER') or '').strip()
            if not user or (self.admin_users and user not in self.admin_users):
                raise SiteError(401, 'admin')
            if method != 'GET' or path[len(self.admin_prefix):] != '/cases':
                raise SiteError(404, 'not-found')
            query = dict(part.split('=', 1) for part in (environ.get('QUERY_STRING') or '').split('&') if '=' in part)
            try:
                offset = min(10 ** 9, max(0, int(query.get('offset', '0'))))
                limit = min(PAGE, max(1, int(query.get('limit', str(PAGE)))))
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
            if method == 'DELETE':
                return 200, self.store.delete_all(token)
            raise SiteError(405, 'method')
        if '/' in rest:
            raise SiteError(404, 'not-found')
        if method == 'PUT':
            return 200, self.store.put(token, rest, self._body(environ), client=environ.get('HTTP_X_NC_CLIENT'))
        if method == 'DELETE':
            return 200, self.store.delete(token, rest)
        raise SiteError(405, 'method')


def create_app(env=os.environ):
    numbers = lambda name, default: int(env.get(name, default))
    store = Store(env.get('NUTRICLINIC_VAULT_DATA', '/data'), max_owners=numbers('NUTRICLINIC_VAULT_ACCOUNTS', 5000),
                  max_cases=numbers('NUTRICLINIC_VAULT_CASES', 200), max_owner_bytes=numbers('NUTRICLINIC_VAULT_ACCOUNT_MB', 2) * 1024 * 1024,
                  max_total_bytes=numbers('NUTRICLINIC_VAULT_TOTAL_MB', 1024) * 1024 * 1024,
                  min_free_bytes=numbers('NUTRICLINIC_VAULT_MIN_FREE_GB', 5) * 1024 ** 3,
                  max_new_per_day=numbers('NUTRICLINIC_VAULT_NEW_PER_DAY', 30))
    if store.migrated:
        print('nutriclinic-vault: %d copies stored before 1.9.1 scrubbed' % store.migrated, file=sys.stderr, flush=True)
    return App(store, prefix=env.get('NUTRICLINIC_VAULT_PREFIX', '/nutriclinic/api/vault'),
               admin_prefix=env.get('NUTRICLINIC_ADMIN_PREFIX', '/nutriclinic/yonetim/api'),
               admin_users=env.get('NUTRICLINIC_ADMIN_USERS', '').split(','),
               allowed_hosts=env.get('NUTRICLINIC_ALLOWED_HOSTS', 'sahnoroloji.org').split(','),
               allowed_origins=env.get('NUTRICLINIC_VAULT_ORIGINS', 'https://sahnoroloji.org').split(','))


application = create_app() if os.environ.get('NUTRICLINIC_VAULT_DATA') else None
