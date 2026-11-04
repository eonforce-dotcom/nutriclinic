"""WSGI application for the hosted NutriClinic record API.

Python standard library only. Mirrors the /api/local/* routes of
../../../local-server.mjs so the unchanged browser client works against it.
In production it runs under gunicorn behind nginx, which terminates TLS,
requires basic auth for /nutriclinic/ and passes the authenticated user in
X-Remote-User. Each user name gets its own database directory.

Guest mode (NUTRICLINIC_GUEST_MODE=1, user decision 2026-11-04):
- <prefix>/api/local/ is open. Each browser gets a random HttpOnly cookie and a
  database of its own (users/misafir-<sha256 of the cookie>); X-Remote-User is
  ignored there. A guest sees and edits only its own records.
- <full prefix>/api/local/ stays behind nginx basic auth (X-Remote-User) and can
  also read every guest database through the read-only guest-* routes.
- A guest database is created on its first write, within count and size limits.
"""
import hashlib
import hmac
import math
import os
import re
import secrets
import sys
import threading
from http import HTTPStatus
from urllib.parse import parse_qsl

from nutriclinic_store import (LocalStoreError, MAX_SAFE_INTEGER, MAX_WORKSPACE_BYTES, SERVER_LOCATION,
                               dump_json, open_store, parse_json, secure_directory)

API = '/api/local/'
TOKEN = re.compile(r'^[-a-f0-9]{64}$')
USER = re.compile(r'^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$')
JSON_TYPE = re.compile(r'^application/json(?:\s*;|$)', re.I)
CONTROL = re.compile('[\x00-\x1f\x7f]')
_JS_WHITESPACE = '\t\n\x0b\x0c\r \xa0                　﻿'
_DECIMAL = re.compile(r'^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$')
GUEST_COOKIE = 'nc_misafir'
GUEST_SECRET = re.compile(r'^[a-f0-9]{64}$')
GUEST_NAME = re.compile(r'^misafir-[a-f0-9]{40}$')
GUEST_COOKIE_SECONDS = 400 * 24 * 3600  # the longest lifetime current browsers keep
GUEST_WRITES = (('workspace', 'PUT'), ('backup', 'POST'), ('restore', 'POST'))
ADMIN_ROUTES = ('guests', 'guest-patients', 'guest-patient')


def js_number_from_string(text):
    """Number(text) for URL query values."""
    value = text.strip(_JS_WHITESPACE)
    if value == '':
        return 0
    for prefix, base in (('0x', 16), ('0o', 8), ('0b', 2)):
        if value[:2].lower() == prefix:
            try:
                return int(value[2:], base) if value[2:] and value[2:].isalnum() else math.nan
            except ValueError:
                return math.nan
    if value in ('Infinity', '+Infinity'):
        return math.inf
    if value == '-Infinity':
        return -math.inf
    if not _DECIMAL.match(value):
        return math.nan
    number = float(value)
    return int(number) if number.is_integer() and abs(number) <= MAX_SAFE_INTEGER else number


class Api:
    def __init__(self, data_root, allowed_hosts, allowed_origins, path_prefix='', require_user=True,
                 local_user='local', now=None, location=None, guest_mode=False, full_prefix='',
                 cookie_secure=True, guest_limit=300, guest_bytes=40 * 1024 * 1024, guest_backups=20):
        self.data_root = os.path.abspath(data_root)
        self.allowed_hosts = set(allowed_hosts)
        self.allowed_origins = set(allowed_origins)
        self.path_prefix = path_prefix.rstrip('/')
        self.require_user = require_user
        self.local_user = local_user
        self.now = now
        self.location = location or SERVER_LOCATION
        self.guest_mode = bool(guest_mode)
        self.full_prefix = full_prefix.rstrip('/')
        if self.guest_mode and (not self.path_prefix or not self.full_prefix or self.full_prefix == self.path_prefix):
            raise ValueError('guest mode needs distinct guest and full-access prefixes')
        self.cookie_secure = cookie_secure
        self.guest_limit = guest_limit
        self.guest_bytes = guest_bytes
        self.guest_backups = guest_backups
        self.token = secrets.token_hex(32)
        self.stores = {}
        self.template = None
        self.lock = threading.Lock()

    def store_for(self, user):
        """(store, error); a failed open is retried on the next request."""
        store = self.stores.get(user)
        if store is not None:
            return store, None
        try:
            root = secure_directory(os.path.join(self.data_root, 'users', user), self.data_root)
            store = open_store(root, now=self.now, location=self.location)
        except Exception:
            return None, 'database-unavailable-or-corrupt'
        self.stores[user] = store
        return store, None

    def __call__(self, environ, start_response):
        try:
            status, value = self.handle(environ)
        except Exception as error:  # never echo request data into logs
            print('nutriclinic-api: unexpected ' + type(error).__name__, file=sys.stderr)
            status, value = 503, {'error': 'local-storage-operation-failed'}
        body = b'' if value is None else dump_json(value).encode('utf-8')
        headers = [('Content-Type', 'application/json; charset=utf-8'), ('Cache-Control', 'no-store'),
                   ('X-Content-Type-Options', 'nosniff'), ('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'"),
                   ('Content-Length', str(len(body)))]
        if environ.get('nutriclinic.set_cookie'):
            headers.append(('Set-Cookie', environ['nutriclinic.set_cookie']))
        start_response('%d %s' % (status, HTTPStatus(status).phrase), headers)
        return [body] if environ.get('REQUEST_METHOD') != 'HEAD' else [b'']

    # --- guest mode -------------------------------------------------------
    def users_root(self):
        return os.path.join(self.data_root, 'users')

    def guest_exists(self, user):
        return os.path.isdir(os.path.join(self.users_root(), user))

    def guest_names(self):
        try:
            return sorted(name for name in os.listdir(self.users_root()) if GUEST_NAME.match(name) and self.guest_exists(name))
        except FileNotFoundError:
            return []

    def guest_size(self, user):
        total = 0
        for folder, _, files in os.walk(os.path.join(self.users_root(), user)):
            for file in files:
                try:
                    total += os.lstat(os.path.join(folder, file)).st_size
                except OSError:
                    pass
        return total

    def empty_store(self):
        """An empty database that answers a guest's reads before its first write.

        It lives outside users/, so neither the off-server export nor the guest
        list sees it, and no request ever writes to it."""
        if self.template is None:
            try:
                root = secure_directory(os.path.join(self.data_root, 'guest-template'), self.data_root)
                self.template = open_store(root, now=self.now, location=self.location)
            except Exception:
                raise LocalStoreError('database-unavailable-or-corrupt', 503)
        return self.template

    def guest_cookie(self, environ):
        for part in (environ.get('HTTP_COOKIE') or '').split(';'):
            name, _, value = part.strip().partition('=')
            if name == GUEST_COOKIE and GUEST_SECRET.match(value):
                return value
        return None

    def set_guest_cookie(self, environ, secret):
        environ['nutriclinic.set_cookie'] = '%s=%s; Path=%s%s; Max-Age=%d; HttpOnly; SameSite=Strict%s' % (
            GUEST_COOKIE, secret, self.path_prefix, API, GUEST_COOKIE_SECONDS, '; Secure' if self.cookie_secure else '')

    def guest_store_for_write(self, user, route):
        if not self.guest_exists(user) and len(self.guest_names()) >= self.guest_limit:
            raise LocalStoreError('guest-capacity-reached', 507)
        if self.guest_exists(user) and self.guest_size(user) >= self.guest_bytes:
            raise LocalStoreError('guest-storage-full', 507)
        store, error = self.store_for(user)
        if store is None:
            raise LocalStoreError(error or 'database-unavailable', 503)
        if route in ('backup', 'restore'):
            kind = 'manual' if route == 'backup' else 'before-restore'
            if sum(1 for item in store.backups() if item['kind'] == kind) >= self.guest_backups:
                raise LocalStoreError('guest-backup-limit-reached', 429)
        return store

    def admin_route(self, route, method, environ):
        if method != 'GET':
            raise LocalStoreError('method-or-route-not-allowed', 405)
        query = dict(reversed(parse_qsl(environ.get('QUERY_STRING', '').encode('latin-1').decode('utf-8', 'replace'),
                                        keep_blank_values=True, errors='replace')))
        if route == 'guests':
            guests = []
            for name in self.guest_names():
                store, _ = self.store_for(name)
                if store is None:
                    guests.append({'guest': name, 'available': False})
                    continue
                patients = store.patients()
                guests.append({'guest': name, 'available': True, 'patientCount': len(patients),
                               'recordCount': sum(item['recordCount'] for item in patients),
                               'draftCount': sum(item['draftCount'] for item in patients),
                               'updatedAt': max([store.read()['updatedAt'] or ''] + [item['updatedAt'] or '' for item in patients]) or None})
            guests.sort(key=lambda item: (item.get('updatedAt') or '', item['guest']), reverse=True)
            return 200, {'guests': guests}
        guest = query.get('guest', '')
        if not GUEST_NAME.match(guest) or not self.guest_exists(guest):
            raise LocalStoreError('guest-not-found', 404)
        store, error = self.store_for(guest)
        if store is None:
            raise LocalStoreError(error or 'database-unavailable', 503)
        if route == 'guest-patients':
            return 200, {'guest': guest, 'patients': store.patients()}
        offset = js_number_from_string(query['offset']) if 'offset' in query else 0
        limit = js_number_from_string(query['limit']) if 'limit' in query else 200
        return 200, {'guest': guest, **store.patient(study_id=query.get('studyId'), offset=offset, limit=limit)}

    def handle(self, environ):
        method = environ.get('REQUEST_METHOD', 'GET')
        try:
            path = environ.get('PATH_INFO', '').encode('latin-1').decode('utf-8')
        except UnicodeError:
            return 400, None
        if path == '/healthz':
            return (200, {'status': 'ok'}) if method in ('GET', 'HEAD') else (405, None)
        if environ.get('HTTP_HOST', '') not in self.allowed_hosts:
            return 403, {'error': 'invalid-host'}
        if CONTROL.search(path):
            return 400, None
        access = None
        if self.guest_mode and path.startswith(self.full_prefix + '/'):
            path, access = path[len(self.full_prefix):], 'full'
        elif self.path_prefix and path.startswith(self.path_prefix + '/'):
            path, access = path[len(self.path_prefix):], ('guest' if self.guest_mode else None)
        if not path.startswith(API) or (self.guest_mode and access is None):
            return 404, {'error': 'not-found'}
        try:
            origin = environ.get('HTTP_ORIGIN')
            if (origin and origin not in self.allowed_origins) or environ.get('HTTP_SEC_FETCH_SITE') == 'cross-site':
                raise LocalStoreError('cross-origin-request', 403)
            route = path[len(API):]
            if access == 'guest':
                # Identity comes only from the cookie; a client-sent X-Remote-User is ignored.
                secret = self.guest_cookie(environ)
                if route == 'bootstrap' and method == 'GET':
                    secret = secret or secrets.token_hex(32)
                    self.set_guest_cookie(environ, secret)  # also renews the expiry
                if secret is None:
                    raise LocalStoreError('authentication-required', 403)
                user = 'misafir-' + hashlib.sha256(secret.encode('ascii')).hexdigest()[:40]
            else:
                user = environ.get('HTTP_X_REMOTE_USER', '') if self.require_user else self.local_user
                if self.guest_mode and GUEST_NAME.match(user or ''):
                    raise LocalStoreError('authentication-required', 403)
            if not USER.match(user or ''):
                raise LocalStoreError('authentication-required', 403)
            with self.lock:
                if route == 'bootstrap':
                    if method != 'GET':
                        raise LocalStoreError('method-not-allowed', 405)
                    if access == 'guest' and not self.guest_exists(user):
                        storage = self.empty_store().location()
                    else:
                        store, error = self.store_for(user)
                        storage = store.location() if store else {'mode': self.location['mode'], 'available': False, 'error': error}
                    return 200, {'token': self.token, 'storage': storage, **({'access': access} if access else {})}
                supplied = environ.get('HTTP_X_NUTRIKLINIK_TOKEN')
                if not isinstance(supplied, str) or not TOKEN.match(supplied) or not hmac.compare_digest(supplied, self.token):
                    raise LocalStoreError('invalid-local-token', 403)
                if route in ADMIN_ROUTES:
                    if access != 'full':
                        raise LocalStoreError('method-or-route-not-allowed', 405)
                    return self.admin_route(route, method, environ)
                if access == 'guest':
                    if (route, method) in GUEST_WRITES:
                        return self.route(self.guest_store_for_write(user, route), route, method, environ)
                    if not self.guest_exists(user):
                        return self.route(self.empty_store(), route, method, environ)
                store, error = self.store_for(user)
                if store is None:
                    raise LocalStoreError(error or 'database-unavailable', 503)
                return self.route(store, route, method, environ)
        except LocalStoreError as error:
            return error.status, {'error': error.code, **error.extra}

    def route(self, store, route, method, environ):
        query = dict(reversed(parse_qsl(environ.get('QUERY_STRING', '').encode('latin-1').decode('utf-8', 'replace'),
                                        keep_blank_values=True, errors='replace')))
        if route == 'workspace' and method == 'GET':
            return 200, store.read()
        if route == 'workspace' and method == 'PUT':
            body = self.body(environ)
            return 200, store.save(**self.arguments(body, expected_revision='expectedRevision', snapshot='snapshot'))
        if route == 'patients' and method == 'GET':
            return 200, {'patients': store.patients()}
        if route == 'patient' and method == 'GET':
            offset = js_number_from_string(query['offset']) if 'offset' in query else 0
            limit = js_number_from_string(query['limit']) if 'limit' in query else 200
            return 200, store.patient(study_id=query.get('studyId'), offset=offset, limit=limit)
        if route == 'draft' and method == 'GET':
            return 200, store.draft(draft_id=query.get('draftId'))
        if route == 'backups' and method == 'GET':
            return 200, {'backups': store.backups()}
        if route == 'backup' and method == 'POST':
            self.body(environ)
            return 201, {'backup': store.backup()}
        if route == 'restore' and method == 'POST':
            body = self.body(environ)
            return 200, store.restore(**self.arguments(body, expected_revision='expectedRevision', backup_file='backupFile'))
        raise LocalStoreError('method-or-route-not-allowed', 405)

    @staticmethod
    def arguments(body, **names):
        # Destructuring null throws in the Node server (503); other non-objects read as empty.
        if body is None:
            raise RuntimeError('null body')
        source = body if isinstance(body, dict) else {}
        return {argument: source.get(key) for argument, key in names.items()}

    @staticmethod
    def body(environ):
        if not JSON_TYPE.match(environ.get('CONTENT_TYPE', '') or ''):
            raise LocalStoreError('json-content-type-required', 415)
        try:
            declared = int((environ.get('CONTENT_LENGTH') or '0').strip() or '0')
        except ValueError:
            declared = 0
        if declared > MAX_WORKSPACE_BYTES + 1024:
            raise LocalStoreError('workspace-too-large', 413)
        stream, chunks, size = environ['wsgi.input'], [], 0
        while size < declared:
            chunk = stream.read(min(65536, declared - size))
            if not chunk:
                break
            size += len(chunk)
            chunks.append(chunk)
        try:
            return parse_json(b''.join(chunks).decode('utf-8-sig'))
        except (ValueError, RecursionError):
            raise LocalStoreError('invalid-json', 400)


def _environment_list(name, default):
    return [item.strip() for item in os.environ.get(name, default).split(',') if item.strip()]


def create_application_from_environment():
    hosts = _environment_list('NUTRICLINIC_ALLOWED_HOSTS', 'sahnoroloji.org,www.sahnoroloji.org')
    origins = _environment_list('NUTRICLINIC_ALLOWED_ORIGINS', ','.join('https://' + host for host in hosts))
    guest_mode = os.environ.get('NUTRICLINIC_GUEST_MODE', '') == '1'
    return Api(data_root=os.environ.get('NUTRICLINIC_DATA_ROOT', '/data'), allowed_hosts=hosts, allowed_origins=origins,
               path_prefix=os.environ.get('NUTRICLINIC_PATH_PREFIX', '/nutriclinic'), guest_mode=guest_mode,
               full_prefix=os.environ.get('NUTRICLINIC_FULL_PREFIX', '/nutriclinic/tam') if guest_mode else '',
               guest_limit=int(os.environ.get('NUTRICLINIC_GUEST_LIMIT', '300')),
               guest_bytes=int(os.environ.get('NUTRICLINIC_GUEST_MB', '40')) * 1024 * 1024)


application = create_application_from_environment() if os.environ.get('NUTRICLINIC_DATA_ROOT') else None
