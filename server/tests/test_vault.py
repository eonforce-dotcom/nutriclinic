# Tests of the NutriClinic site copies (standard library only; synthetic data).
# SPDX-License-Identifier: AGPL-3.0-only
import io
import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from nutriclinic_vault import App, Store  # noqa: E402

A = 'A' * 43
B = 'B' * 43
CODE = 'NC-7K3P-Q2M9'
DATA = {'values': {'setting': 'icu', 'age': '67', 'sex': 'male', 'weightKg': 78, 'stroke': True, 'potassiumUnit': 'mmol/L'},
        'product': {'ons': {'kcal': '300', 'unit': 'mL'}}, 'followup': [{'day': '2', 'kcal': '1200', 'protein': '60'}],
        'decisions': {'icu-protein': 'progressive-local'}, 'engine': '1.9.0'}
OK = {'updatedAt': '2026-11-07T20:00:00.000Z', 'data': DATA}


class SiteTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        # free_bytes: the disk floor is tested on its own (a small /tmp in a test container must not trip it).
        self.store = Store(self.tmp.name, max_owners=2, max_cases=2, max_owner_bytes=4000, max_total_bytes=9000,
                           now=lambda: '2026-11-07T20:00:01.000Z', free_bytes=lambda: None)
        self.app = App(self.store, allowed_hosts=['sahnoroloji.org'], allowed_origins=['https://sahnoroloji.org'])

    def tearDown(self):
        self.store.close()
        self.tmp.cleanup()

    def call(self, method, path, body=None, token=A, host='sahnoroloji.org', origin=None, user=None, query='', content_type='application/json'):
        data = b'' if body is None else (body if isinstance(body, bytes) else json.dumps(body).encode())
        environ = {'REQUEST_METHOD': method, 'PATH_INFO': path, 'QUERY_STRING': query, 'HTTP_HOST': host, 'wsgi.input': io.BytesIO(data),
                   'CONTENT_LENGTH': str(len(data)), 'CONTENT_TYPE': content_type}
        if token is not None:
            environ['HTTP_X_SITE_TOKEN'] = token
        if origin is not None:
            environ['HTTP_ORIGIN'] = origin
        if user is not None:
            environ['HTTP_X_REMOTE_USER'] = user
        seen = {}
        out = self.app(environ, lambda status, headers: seen.update(status=int(status.split()[0]), headers=dict(headers)))
        self.assertEqual(seen['headers']['Cache-Control'], 'no-store')
        return seen['status'], json.loads(b''.join(out))

    def put(self, body=OK, code=CODE, **kw):
        return self.call('PUT', f'/nutriclinic/api/vault/{code}', body, **kw)

    def test_each_device_sees_only_its_own_copies(self):
        self.assertEqual(self.call('GET', '/nutriclinic/api/vault/'), (200, {'cases': []}))
        self.assertEqual(self.put(), (200, {}))
        self.assertEqual(self.put({**OK, 'updatedAt': '2026-11-07T20:05:00.000Z'}), (200, {}))
        self.assertEqual(self.call('GET', '/nutriclinic/api/vault/'), (200, {'cases': [{'code': CODE, 'updatedAt': '2026-11-07T20:05:00.000Z'}]}))
        # Another device: sees nothing, cannot overwrite (409) or delete (nothing happens).
        self.assertEqual(self.call('GET', '/nutriclinic/api/vault/', token=B), (200, {'cases': []}))
        self.assertEqual(self.put(token=B), (409, {'error': 'taken'}))
        self.assertEqual(self.call('DELETE', f'/nutriclinic/api/vault/{CODE}', token=B), (200, {}))
        self.assertEqual(len(self.call('GET', '/nutriclinic/api/vault/')[1]['cases']), 1)
        self.assertEqual(self.call('DELETE', f'/nutriclinic/api/vault/{CODE}'), (200, {}))
        self.assertEqual(self.call('GET', '/nutriclinic/api/vault/'), (200, {'cases': []}))
        # The token itself is never stored.
        self.put()
        with open(self.store.path, 'rb') as handle:
            self.assertNotIn(A.encode(), handle.read())

    def test_only_clinical_values_are_accepted(self):
        for bad in ({**OK, 'data': {**DATA, 'label': 'Yatak 5'}},
                    {**OK, 'data': {**DATA, 'values': {**DATA['values'], 'note': 'Ahmet Yilmaz'}}},
                    {**OK, 'data': {**DATA, 'values': {**DATA['values'], 'x': 'a\nb'}}},
                    {**OK, 'data': {**DATA, 'values': {**DATA['values'], 'x': 'y' * 41}}},
                    {**OK, 'data': {**DATA, 'product': {'ons': {'unit': 'iki kutu'}}}},
                    {**OK, 'data': {**DATA, 'followup': [{'day': '2', 'kcal': '1200', 'note': 'x'}]}},
                    {**OK, 'data': {**DATA, 'decisions': {'icu-protein': 'Dr Ali'}}},
                    {**OK, 'data': {**DATA, 'engine': 'latest'}},
                    {**OK, 'extra': 1}, {**OK, 'updatedAt': 'yesterday'}, [1]):
            self.assertEqual(self.put(bad)[0], 400, bad)
        self.assertEqual(self.put(b'{"updatedAt": NaN}')[0], 400)
        self.assertEqual(self.put(content_type='text/plain')[0], 415)
        self.assertEqual(self.put(b'{"updatedAt": "' + b'x' * 70000 + b'"}')[0], 413)  # body above 64 KB
        self.assertEqual(self.put(code='NC-7K3P-Q2M9\n')[0], 404)
        self.assertEqual(self.put(code='NC-IIII-OOOO')[0], 404)
        self.assertEqual(self.call('GET', '/nutriclinic/api/vault/', token='short')[0], 401)
        self.assertEqual(self.call('GET', '/nutriclinic/api/vault/', host='attacker.example')[0], 421)
        self.assertEqual(self.call('GET', '/nutriclinic/api/vault/', origin='https://attacker.example')[0], 403)
        self.assertEqual(self.call('POST', '/nutriclinic/api/vault/')[0], 405)
        self.assertEqual(self.call('GET', '/healthz', token=None, host='')[0], 200)

    def test_limits(self):
        self.assertEqual(self.put(code='NC-0000-0001')[0], 200)
        self.assertEqual(self.put(code='NC-0000-0002')[0], 200)
        self.assertEqual(self.put(code='NC-0000-0003'), (507, {'error': 'case-limit'}))
        self.assertEqual(self.put(code='NC-0000-0001')[0], 200)  # updating an existing copy is always possible
        self.assertEqual(self.put(code='NC-0000-0004', token=B)[0], 200)
        self.assertEqual(self.put(code='NC-0000-0005', token='C' * 43), (507, {'error': 'capacity'}))
        big = {**OK, 'data': {**DATA, 'values': {f'k{i}': 'x' * 40 for i in range(90)}}}
        self.assertEqual(self.put(big, code='NC-0000-0006', token=B), (507, {'error': 'owner-full'}))
        self.store.free_bytes = lambda: 4 * 1024 ** 3  # below the 5 GB floor
        self.assertEqual(self.put(code='NC-0000-0001'), (507, {'error': 'disk'}))

    def test_administrator_sees_every_copy_anonymised_and_only_with_the_password(self):
        self.put()
        self.put(code='NC-0000-0009', token=B)
        self.assertEqual(self.call('GET', '/nutriclinic/yonetim/api/cases', token=None)[0], 401)
        self.assertEqual(self.call('GET', '/nutriclinic/yonetim/api/cases', token=None, user=' ')[0], 401)
        status, body = self.call('GET', '/nutriclinic/yonetim/api/cases', token=None, user='nutriclinic')
        self.assertEqual((status, body['total'], len(body['cases'])), (200, 2, 2))
        first = next(c for c in body['cases'] if c['code'] == CODE)
        self.assertEqual(first['data'], DATA)
        self.assertRegex(first['source'], r'^K-[0-9a-f]{6}$')
        self.assertNotIn(A, json.dumps(body))
        self.assertEqual(self.call('GET', '/nutriclinic/yonetim/api/cases', token=None, user='nutriclinic', query='offset=1&limit=1')[1]['total'], 2)
        self.assertEqual(self.call('PUT', '/nutriclinic/yonetim/api/cases', OK, token=None, user='nutriclinic')[0], 404)
        self.assertEqual(self.call('GET', '/nutriclinic/yonetim/api/other', token=None, user='nutriclinic')[0], 404)


if __name__ == '__main__':
    unittest.main()
