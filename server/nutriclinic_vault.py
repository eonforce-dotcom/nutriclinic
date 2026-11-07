"""NutriClinic case vault: end-to-end encrypted storage for the staged recommender's cases.

The browser encrypts every case with a key derived from the clinician's personal code (WebCrypto, AES-GCM 256); this
service keeps the encrypted text only. It never receives the code, the key or any clinical value. An account is a
directory named by an identifier derived from the code; every request carries an access token derived from the same
code, of which only the SHA-256 is stored. Python standard library only.

Routes under NUTRICLINIC_VAULT_PREFIX (default /nutriclinic/api/vault):
  POST <prefix>/<account>/        create the account                          201; 409 when it exists
  GET  <prefix>/<account>/        {cases: [{id, revision, updatedAt, deleted}]} 404 when there is no account
  GET  <prefix>/<account>/<case>  {id, revision, updatedAt, payload} or {id, revision, updatedAt, deleted: true}
  PUT  <prefix>/<account>/<case>  {baseRevision, updatedAt, payload} or {baseRevision, updatedAt, deleted: true}
                                  -> {revision}; 409 {revision} when baseRevision is not the stored revision
  GET  /healthz
Every account route needs the header X-Vault-Auth (43 base64url characters). A deleted case keeps a small marker
(no payload) so that the clinician's other devices remove their copy too.
"""
# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Gökay Duman
import base64
import binascii
import hashlib
import hmac
import json
import os
import re
import tempfile
from datetime import datetime, timezone

try:
    import fcntl
except ImportError:  # not on Linux: only for running the tests elsewhere; the service runs on Linux
    fcntl = None

ACCOUNT = re.compile(r'^[0-9a-f]{32}$')
CASE = re.compile(r'^c-[0-9a-f]{16}$')
AUTH = re.compile(r'^[A-Za-z0-9_-]{43}$')
ISO = re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$')
B64 = re.compile(r'^[A-Za-z0-9+/]+={0,2}$')
MAX_BODY = 160 * 1024


class VaultError(Exception):
    def __init__(self, status, code, extra=None):
        super().__init__(code)
        self.status = status
        self.code = code
        self.extra = extra or {}


def _now():
    moment = datetime.now(timezone.utc)
    return moment.strftime('%Y-%m-%dT%H:%M:%S.') + '%03dZ' % (moment.microsecond // 1000)


def _reject_constant(name):
    raise ValueError(name)


def _b64_bytes(text, limit):
    if not isinstance(text, str) or not text or len(text) > limit or not B64.match(text):
        return None
    try:
        return base64.b64decode(text, validate=True)
    except (binascii.Error, ValueError):
        return None


def _write_json(path, value):
    directory = os.path.dirname(path)
    fd, tmp = tempfile.mkstemp(dir=directory, prefix='.tmp-', suffix='.json')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as handle:
            json.dump(value, handle, separators=(',', ':'), ensure_ascii=False)
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(tmp, 0o600)
        os.replace(tmp, path)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def _read_json(path):
    with open(path, 'r', encoding='utf-8') as handle:
        return json.load(handle)


class Vault:
    def __init__(self, root, max_accounts=1000, max_cases=200, max_payload=64 * 1024, max_account_bytes=2 * 1024 * 1024, min_free_bytes=5 * 1024 ** 3, now=_now, free_bytes=None):
        self.root = os.path.join(root, 'vault')
        os.makedirs(self.root, mode=0o700, exist_ok=True)
        self.max_accounts = max_accounts
        self.max_cases = max_cases
        self.max_payload = max_payload
        self.max_account_bytes = max_account_bytes
        self.min_free_bytes = min_free_bytes
        self.now = now
        self.free_bytes = free_bytes or self._free_bytes

    def _free_bytes(self):
        if not hasattr(os, 'statvfs'):  # not on Linux (tests elsewhere)
            return None
        st = os.statvfs(self.root)
        return st.f_bavail * st.f_frsize

    def _room(self):
        # The server's disk is shared with the rest of the site: writing stops well before it fills.
        free = self.free_bytes()
        if free is not None and free < self.min_free_bytes:
            raise VaultError(507, 'disk')

    def _dir(self, account):
        if not ACCOUNT.match(account or ''):
            raise VaultError(404, 'not-found')
        return os.path.join(self.root, account)

    def _lock(self, account):
        handle = open(os.path.join(self._dir(account), '.lock'), 'a+')
        if fcntl:
            fcntl.flock(handle, fcntl.LOCK_EX)
        return handle

    def _check(self, account, auth):
        directory = self._dir(account)
        meta = os.path.join(directory, 'meta.json')
        if not os.path.isfile(meta):
            raise VaultError(404, 'no-account')
        if not AUTH.match(auth or ''):
            raise VaultError(401, 'auth')
        stored = _read_json(meta).get('authHash', '')
        if not hmac.compare_digest(stored, hashlib.sha256(auth.encode('ascii')).hexdigest()):
            raise VaultError(401, 'auth')
        return directory

    def create(self, account, auth):
        directory = self._dir(account)
        if not AUTH.match(auth or ''):
            raise VaultError(401, 'auth')
        if os.path.exists(directory):
            raise VaultError(409, 'exists')
        accounts = sum(1 for name in os.listdir(self.root) if ACCOUNT.match(name))
        if accounts >= self.max_accounts:
            raise VaultError(507, 'capacity')
        self._room()
        os.mkdir(directory, 0o700)
        os.mkdir(os.path.join(directory, 'cases'), 0o700)
        _write_json(os.path.join(directory, 'meta.json'), {'authHash': hashlib.sha256(auth.encode('ascii')).hexdigest(), 'createdAt': self.now()})
        return {}

    def _cases(self, directory):
        folder = os.path.join(directory, 'cases')
        out = []
        for name in sorted(os.listdir(folder)):
            if name.endswith('.json') and CASE.match(name[:-5]):
                out.append((os.path.join(folder, name), _read_json(os.path.join(folder, name))))
        return out

    def list(self, account, auth):
        directory = self._check(account, auth)
        return {'cases': [{'id': rec['id'], 'revision': rec['revision'], 'updatedAt': rec['updatedAt'], 'deleted': bool(rec.get('deleted'))}
                          for _, rec in self._cases(directory)]}

    def get(self, account, auth, case):
        directory = self._check(account, auth)
        path = os.path.join(directory, 'cases', case + '.json')
        if not CASE.match(case) or not os.path.isfile(path):
            raise VaultError(404, 'not-found')
        rec = _read_json(path)
        out = {'id': rec['id'], 'revision': rec['revision'], 'updatedAt': rec['updatedAt']}
        if rec.get('deleted'):
            out['deleted'] = True
        else:
            out['payload'] = rec['payload']
        return out

    def _valid_body(self, body):
        if not isinstance(body, dict):
            raise VaultError(400, 'body')
        keys = set(body)
        if keys not in ({'baseRevision', 'updatedAt', 'payload'}, {'baseRevision', 'updatedAt', 'deleted'}):
            raise VaultError(400, 'body')
        base = body['baseRevision']
        if base is not None and (isinstance(base, bool) or not isinstance(base, int) or base < 1):
            raise VaultError(400, 'revision')
        if not isinstance(body['updatedAt'], str) or not ISO.match(body['updatedAt']):
            raise VaultError(400, 'updated-at')
        if 'deleted' in body:
            if body['deleted'] is not True:
                raise VaultError(400, 'body')
            return None
        payload = body['payload']
        if not isinstance(payload, dict) or set(payload) != {'v', 'iv', 'ct'} or payload['v'] != 1 or isinstance(payload['v'], bool):
            raise VaultError(400, 'payload')
        if isinstance(payload['ct'], str) and len(payload['ct']) > self.max_payload:
            raise VaultError(413, 'too-large')
        iv = _b64_bytes(payload['iv'], 32)
        ct = _b64_bytes(payload['ct'], self.max_payload)
        if iv is None or len(iv) != 12 or ct is None or len(ct) < 17:  # 12-byte nonce; at least one byte and the 16-byte tag
            raise VaultError(400, 'payload')
        return payload

    def put(self, account, auth, case, body):
        directory = self._check(account, auth)
        if not CASE.match(case or ''):
            raise VaultError(404, 'not-found')
        payload = self._valid_body(body)
        self._room()
        lock = self._lock(account)
        try:
            path = os.path.join(directory, 'cases', case + '.json')
            current = _read_json(path) if os.path.isfile(path) else None
            base = body['baseRevision']
            if (current is None and base is not None) or (current is not None and base != current['revision']):
                raise VaultError(409, 'conflict', {'revision': current['revision'] if current else None})
            cases = self._cases(directory)
            if payload is not None and (current is None or current.get('deleted')):
                live = sum(1 for _, rec in cases if not rec.get('deleted'))
                if live >= self.max_cases:
                    raise VaultError(507, 'case-limit')
            if len(cases) >= self.max_cases * 2 and current is None:
                raise VaultError(507, 'case-limit')
            size = sum(os.path.getsize(p) for p, _ in cases if p != path)
            record = {'id': case, 'revision': (current['revision'] + 1) if current else 1, 'updatedAt': body['updatedAt'], 'savedAt': self.now()}
            if payload is None:
                record['deleted'] = True
            else:
                record['payload'] = payload
            if size + len(json.dumps(record)) > self.max_account_bytes:
                raise VaultError(507, 'account-full')
            _write_json(path, record)
            return {'revision': record['revision']}
        finally:
            if fcntl:
                fcntl.flock(lock, fcntl.LOCK_UN)
            lock.close()


class App:
    """WSGI application: routing, host and origin checks, JSON in and out."""

    def __init__(self, vault, prefix='/nutriclinic/api/vault', allowed_hosts=('sahnoroloji.org',), allowed_origins=('https://sahnoroloji.org',)):
        self.vault = vault
        self.prefix = prefix.rstrip('/')
        self.allowed_hosts = {h.strip().lower() for h in allowed_hosts if h.strip()}
        self.allowed_origins = {o.strip() for o in allowed_origins if o.strip()}

    def __call__(self, environ, start_response):
        try:
            status, body = self.handle(environ)
        except VaultError as error:
            status, body = error.status, {'error': error.code, **error.extra}
        except Exception:  # never show internals
            status, body = 500, {'error': 'server'}
        data = json.dumps(body, separators=(',', ':')).encode('utf-8')
        reasons = {200: 'OK', 201: 'Created', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed',
                   409: 'Conflict', 413: 'Payload Too Large', 415: 'Unsupported Media Type', 421: 'Misdirected Request', 500: 'Internal Server Error', 507: 'Insufficient Storage'}
        start_response('%d %s' % (status, reasons.get(status, 'Error')), [
            ('Content-Type', 'application/json; charset=utf-8'), ('Content-Length', str(len(data))), ('Cache-Control', 'no-store'),
            ('X-Content-Type-Options', 'nosniff'), ('Referrer-Policy', 'no-referrer')])
        return [data]

    def _body(self, environ):
        if (environ.get('CONTENT_TYPE') or '').split(';')[0].strip().lower() != 'application/json':
            raise VaultError(415, 'content-type')
        try:
            length = int(environ.get('CONTENT_LENGTH') or 0)
        except ValueError:
            raise VaultError(400, 'length')
        if length <= 0:
            raise VaultError(400, 'body')
        if length > MAX_BODY:
            raise VaultError(413, 'too-large')
        raw = environ['wsgi.input'].read(length)
        try:
            return json.loads(raw.decode('utf-8'), parse_constant=_reject_constant)
        except (UnicodeDecodeError, ValueError):
            raise VaultError(400, 'json')

    def handle(self, environ):
        method = environ.get('REQUEST_METHOD', 'GET')
        path = environ.get('PATH_INFO', '')
        if path == '/healthz':
            return 200, {'ok': True}
        host = (environ.get('HTTP_HOST') or '').split(':')[0].lower()
        if host not in self.allowed_hosts:
            raise VaultError(421, 'host')
        origin = environ.get('HTTP_ORIGIN')
        if origin is not None and origin not in self.allowed_origins:
            raise VaultError(403, 'origin')
        if not path.startswith(self.prefix + '/'):
            raise VaultError(404, 'not-found')
        parts = path[len(self.prefix) + 1:].split('/')
        if len(parts) != 2:
            raise VaultError(404, 'not-found')
        account, case = parts
        auth = environ.get('HTTP_X_VAULT_AUTH', '')
        if case == '':
            if method == 'POST':
                return 201, self.vault.create(account, auth)
            if method == 'GET':
                return 200, self.vault.list(account, auth)
            raise VaultError(405, 'method')
        if method == 'GET':
            return 200, self.vault.get(account, auth, case)
        if method == 'PUT':
            return 200, self.vault.put(account, auth, case, self._body(environ))
        raise VaultError(405, 'method')


def create_app(env=os.environ):
    numbers = lambda name, default: int(env.get(name, default))
    vault = Vault(env.get('NUTRICLINIC_VAULT_DATA', '/data'), max_accounts=numbers('NUTRICLINIC_VAULT_ACCOUNTS', 1000),
                  max_cases=numbers('NUTRICLINIC_VAULT_CASES', 200), max_account_bytes=numbers('NUTRICLINIC_VAULT_ACCOUNT_MB', 2) * 1024 * 1024,
                  min_free_bytes=numbers('NUTRICLINIC_VAULT_MIN_FREE_GB', 5) * 1024 ** 3)
    return App(vault, prefix=env.get('NUTRICLINIC_VAULT_PREFIX', '/nutriclinic/api/vault'),
               allowed_hosts=env.get('NUTRICLINIC_ALLOWED_HOSTS', 'sahnoroloji.org').split(','),
               allowed_origins=env.get('NUTRICLINIC_VAULT_ORIGINS', 'https://sahnoroloji.org').split(','))


application = create_app() if os.environ.get('NUTRICLINIC_VAULT_DATA') else None
