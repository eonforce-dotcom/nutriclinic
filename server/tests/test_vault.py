# Tests of the NutriClinic case vault (standard library only; synthetic data).
# SPDX-License-Identifier: AGPL-3.0-only
import base64
import io
import json
import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from nutriclinic_vault import App, Vault  # noqa: E402

ACC = '0123456789abcdef0123456789abcdef'
AUTH = 'A' * 43
CASE = 'c-0123456789abcdef'
PAYLOAD = {'v': 1, 'iv': base64.b64encode(b'\x01' * 12).decode(), 'ct': base64.b64encode(b'\x02' * 40).decode()}


class VaultTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        # free_bytes: the disk floor is tested on its own (a small /tmp in a test container must not trip it).
        self.vault = Vault(self.tmp.name, max_accounts=3, max_cases=2, max_payload=200, max_account_bytes=4000, now=lambda: '2026-11-07T20:00:00.000Z', free_bytes=lambda: None)
        self.app = App(self.vault, prefix='/nutriclinic/api/vault', allowed_hosts=['sahnoroloji.org'], allowed_origins=['https://sahnoroloji.org'])

    def tearDown(self):
        self.tmp.cleanup()

    def call(self, method, path, body=None, auth=AUTH, host='sahnoroloji.org', origin=None, content_type='application/json'):
        data = b'' if body is None else (body if isinstance(body, bytes) else json.dumps(body).encode())
        environ = {'REQUEST_METHOD': method, 'PATH_INFO': path, 'HTTP_HOST': host, 'wsgi.input': io.BytesIO(data), 'CONTENT_LENGTH': str(len(data)), 'CONTENT_TYPE': content_type}
        if auth is not None:
            environ['HTTP_X_VAULT_AUTH'] = auth
        if origin is not None:
            environ['HTTP_ORIGIN'] = origin
        seen = {}
        out = self.app(environ, lambda status, headers: seen.update(status=int(status.split()[0]), headers=dict(headers)))
        self.assertEqual(seen['headers']['Cache-Control'], 'no-store')
        return seen['status'], json.loads(b''.join(out))

    def put(self, body, case=CASE, **kw):
        return self.call('PUT', f'/nutriclinic/api/vault/{ACC}/{case}', body, **kw)

    def test_account_lifecycle_and_cases(self):
        base = f'/nutriclinic/api/vault/{ACC}/'
        self.assertEqual(self.call('GET', base)[0], 404)
        self.assertEqual(self.call('POST', base), (201, {}))
        self.assertEqual(self.call('POST', base)[0], 409)
        self.assertEqual(self.call('GET', base), (200, {'cases': []}))
        self.assertEqual(self.put({'baseRevision': None, 'updatedAt': '2026-11-07T19:00:00.000Z', 'payload': PAYLOAD}), (200, {'revision': 1}))
        self.assertEqual(self.put({'baseRevision': None, 'updatedAt': '2026-11-07T19:00:00.000Z', 'payload': PAYLOAD}), (409, {'error': 'conflict', 'revision': 1}))
        self.assertEqual(self.put({'baseRevision': 1, 'updatedAt': '2026-11-07T19:05:00.000Z', 'payload': PAYLOAD}), (200, {'revision': 2}))
        self.assertEqual(self.call('GET', base + CASE), (200, {'id': CASE, 'revision': 2, 'updatedAt': '2026-11-07T19:05:00.000Z', 'payload': PAYLOAD}))
        self.assertEqual(self.put({'baseRevision': 2, 'updatedAt': '2026-11-07T19:10:00.000Z', 'deleted': True}), (200, {'revision': 3}))
        self.assertEqual(self.call('GET', base + CASE), (200, {'id': CASE, 'revision': 3, 'updatedAt': '2026-11-07T19:10:00.000Z', 'deleted': True}))
        self.assertEqual(self.call('GET', base), (200, {'cases': [{'id': CASE, 'revision': 3, 'updatedAt': '2026-11-07T19:10:00.000Z', 'deleted': True}]}))
        # Only the hash of the access token is stored, and nothing but the encrypted text.
        with open(os.path.join(self.tmp.name, 'vault', ACC, 'meta.json'), encoding='utf-8') as handle:
            meta = json.load(handle)
        self.assertNotIn(AUTH, json.dumps(meta))
        self.assertEqual(len(meta['authHash']), 64)

    def test_access_token_host_and_origin(self):
        base = f'/nutriclinic/api/vault/{ACC}/'
        self.call('POST', base)
        self.assertEqual(self.call('GET', base, auth='B' * 43)[0], 401)
        self.assertEqual(self.call('GET', base, auth=None)[0], 401)
        self.assertEqual(self.call('GET', base, auth='short')[0], 401)
        self.assertEqual(self.call('GET', base, host='attacker.example')[0], 421)
        self.assertEqual(self.call('GET', base, origin='https://attacker.example')[0], 403)
        self.assertEqual(self.call('GET', base, origin='https://sahnoroloji.org')[0], 200)
        self.assertEqual(self.call('GET', '/nutriclinic/api/vault/NOT-HEX/')[0], 404)
        self.assertEqual(self.call('GET', base + 'not-a-case')[0], 404)
        self.assertEqual(self.call('DELETE', base + CASE)[0], 405)
        self.assertEqual(self.call('GET', '/healthz', auth=None, host='')[0], 200)

    def test_bodies_and_limits(self):
        base = f'/nutriclinic/api/vault/{ACC}/'
        self.call('POST', base)
        ok = {'baseRevision': None, 'updatedAt': '2026-11-07T19:00:00.000Z', 'payload': PAYLOAD}
        for bad in ({**ok, 'extra': 1}, {**ok, 'updatedAt': 'yesterday'}, {**ok, 'baseRevision': 0}, {**ok, 'baseRevision': True},
                    {**ok, 'payload': {**PAYLOAD, 'v': 2}}, {**ok, 'payload': {**PAYLOAD, 'iv': base64.b64encode(b'x' * 8).decode()}},
                    {**ok, 'payload': {**PAYLOAD, 'ct': 'not base64!'}}, {'baseRevision': None, 'updatedAt': ok['updatedAt'], 'deleted': False}, [1, 2]):
            self.assertEqual(self.put(bad)[0], 400, bad)
        self.assertEqual(self.put(b'{not json')[0], 400)
        self.assertEqual(self.put(b'{"baseRevision": NaN}')[0], 400)
        self.assertEqual(self.put(ok, content_type='text/plain')[0], 415)
        self.assertEqual(self.put({**ok, 'payload': {**PAYLOAD, 'ct': 'A' * 400}})[0], 413)
        # Two live cases at most here; a third is refused, a deleted one frees its place.
        self.assertEqual(self.put(ok, case='c-0000000000000001')[0], 200)
        self.assertEqual(self.put(ok, case='c-0000000000000002')[0], 200)
        self.assertEqual(self.put(ok, case='c-0000000000000003'), (507, {'error': 'case-limit'}))
        self.assertEqual(self.put({'baseRevision': 1, 'updatedAt': ok['updatedAt'], 'deleted': True}, case='c-0000000000000002')[0], 200)
        self.assertEqual(self.put(ok, case='c-0000000000000003')[0], 200)
        # Account limit.
        for i in range(2):
            self.assertEqual(self.call('POST', f'/nutriclinic/api/vault/{i:032x}/')[0], 201)
        self.assertEqual(self.call('POST', f'/nutriclinic/api/vault/{9:032x}/'), (507, {'error': 'capacity'}))

    def test_review_ids_marks_and_empty_accounts(self):
        # Whole-string checks: a trailing newline or non-ASCII digits are refused.
        self.assertEqual(self.call('POST', f'/nutriclinic/api/vault/{ACC}\n/')[0], 404)
        self.assertFalse(os.path.exists(os.path.join(self.tmp.name, 'vault', ACC + '\n')))
        base = f'/nutriclinic/api/vault/{ACC}/'
        self.assertEqual(self.call('POST', base)[0], 201)
        self.assertEqual(self.call('GET', base, auth=AUTH + '\n')[0], 401)
        self.assertEqual(self.put({'baseRevision': None, 'updatedAt': '２０２６-11-07T19:00:00.000Z', 'payload': PAYLOAD})[0], 400)
        self.assertEqual(self.call('GET', base + CASE + '\n')[0], 404)
        # Deletion marks count for 90 days only (max_cases=2 here: 4 entries in all).
        clock = {'now': datetime(2026, 11, 7, 20, 0, tzinfo=timezone.utc)}
        self.vault.now = lambda: clock['now'].strftime('%Y-%m-%dT%H:%M:%S.000Z')
        ok = {'baseRevision': None, 'updatedAt': '2026-11-07T19:00:00.000Z', 'payload': PAYLOAD}
        for i in range(4):
            case = 'c-%016x' % i
            self.assertEqual(self.put(ok, case=case)[0], 200)
            self.assertEqual(self.put({'baseRevision': 1, 'updatedAt': '2026-11-07T19:01:00.000Z', 'deleted': True}, case=case)[0], 200)
        self.assertEqual(self.put(ok, case='c-00000000000000ff'), (507, {'error': 'case-limit'}))
        clock['now'] += timedelta(days=91)
        self.assertEqual(self.put(ok, case='c-00000000000000ff')[0], 200)
        # Accounts without any case stop counting after a day (max_accounts=3 here).
        self.assertEqual(self.call('POST', f'/nutriclinic/api/vault/{1:032x}/')[0], 201)
        self.assertEqual(self.call('POST', f'/nutriclinic/api/vault/{2:032x}/')[0], 201)
        self.assertEqual(self.call('POST', f'/nutriclinic/api/vault/{3:032x}/'), (507, {'error': 'capacity'}))
        clock['now'] += timedelta(days=2)
        self.assertEqual(self.call('POST', f'/nutriclinic/api/vault/{3:032x}/')[0], 201)

    def test_disk_floor_stops_writes(self):
        base = f'/nutriclinic/api/vault/{ACC}/'
        self.call('POST', base)
        self.vault.free_bytes = lambda: 4 * 1024 ** 3  # below the 5 GB floor
        ok = {'baseRevision': None, 'updatedAt': '2026-11-07T19:00:00.000Z', 'payload': PAYLOAD}
        self.assertEqual(self.put(ok), (507, {'error': 'disk'}))
        self.assertEqual(self.call('POST', f'/nutriclinic/api/vault/{1:032x}/'), (507, {'error': 'disk'}))
        self.assertEqual(self.call('GET', base)[0], 200)  # reading still works


if __name__ == '__main__':
    unittest.main()
