# Tests of the NutriClinic site copies (standard library only; synthetic data).
# SPDX-License-Identifier: AGPL-3.0-only
import io
import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from nutriclinic_vault import App, Store, age_band, clean_data, client_key  # noqa: E402

A = 'A' * 43
B = 'B' * 43
CODE = 'NC-7K3P-Q2M9'
DATA = {'values': {'setting': 'icu', 'age': '65-69', 'sex': 'male', 'weightKg': '78,5', 'heightCm': 172, 'stroke': True, 'fois': '3',
                   'potassiumUnit': 'mmol/L', 'plateletsUnit': '10³/µL', 'kidney': 'anuria12'},
        'product': {'ons': {'kcal': '300', 'unit': 'mL'}, 'form': 'powder'}, 'followup': [{'day': '2', 'kcal': '1200', 'protein': '60'}],
        'decisions': {'icu-protein': 'progressive-local'}, 'engine': '1.9.1'}
OK = {'updatedAt': '2026-11-07T20:00:00.000Z', 'data': DATA}


def with_values(**values):
    return {**OK, 'data': {**DATA, 'values': {**DATA['values'], **values}}}


class SiteTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.today = '2026-11-07T20:00:01.000Z'
        # free_bytes: the disk floor is tested on its own (a small /tmp in a test container must not trip it).
        self.store = Store(self.tmp.name, max_owners=3, max_cases=2, max_owner_bytes=4000, max_total_bytes=9000, max_new_per_day=2,
                           now=lambda: self.today, free_bytes=lambda: None)
        self.app = App(self.store, allowed_hosts=['sahnoroloji.org'], allowed_origins=['https://sahnoroloji.org'])

    def tearDown(self):
        self.store.close()
        self.tmp.cleanup()

    def call(self, method, path, body=None, token=A, host='sahnoroloji.org', origin=None, user=None, query='', client=None,
             content_type='application/json'):
        data = b'' if body is None else (body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode())
        environ = {'REQUEST_METHOD': method, 'PATH_INFO': path, 'QUERY_STRING': query, 'HTTP_HOST': host, 'wsgi.input': io.BytesIO(data),
                   'CONTENT_LENGTH': str(len(data)), 'CONTENT_TYPE': content_type}
        if token is not None:
            environ['HTTP_X_SITE_TOKEN'] = token
        if origin is not None:
            environ['HTTP_ORIGIN'] = origin
        if user is not None:
            environ['HTTP_X_REMOTE_USER'] = user
        if client is not None:
            environ['HTTP_X_NC_CLIENT'] = client
        seen = {}
        out = self.app(environ, lambda status, headers: seen.update(status=int(status.split()[0]), headers=dict(headers)))
        self.assertEqual(seen['headers']['Cache-Control'], 'no-store')
        return seen['status'], json.loads(b''.join(out))

    def put(self, body=OK, code=CODE, **kw):
        return self.call('PUT', f'/nutriclinic/api/vault/{code}', body, **kw)

    def admin(self, query='', user='nutriclinic'):
        return self.call('GET', '/nutriclinic/yonetim/api/cases', token=None, user=user, query=query)

    def test_each_device_sees_and_deletes_only_its_own_copies(self):
        self.assertEqual(self.call('GET', '/nutriclinic/api/vault/'), (200, {'cases': []}))
        self.assertEqual(self.put(), (200, {}))
        self.assertEqual(self.put({**OK, 'updatedAt': '2026-11-07T20:05:00.000Z'}), (200, {}))
        self.assertEqual(self.call('GET', '/nutriclinic/api/vault/'), (200, {'cases': [{'code': CODE, 'updatedAt': '2026-11-07T20:05:00.000Z'}]}))
        # Another device: sees nothing, cannot overwrite (409) or delete (nothing happens), not even all at once.
        C = 'C' * 43
        self.assertEqual(self.call('GET', '/nutriclinic/api/vault/', token=B), (200, {'cases': []}))
        self.assertEqual(self.put(token=B), (409, {'error': 'taken'}))
        self.assertEqual(self.call('DELETE', f'/nutriclinic/api/vault/{CODE}', token=B), (200, {}))
        self.assertEqual(self.call('DELETE', '/nutriclinic/api/vault/', token=C), (200, {}))
        self.assertEqual(len(self.call('GET', '/nutriclinic/api/vault/')[1]['cases']), 1)
        self.assertEqual(self.call('DELETE', f'/nutriclinic/api/vault/{CODE}'), (200, {}))
        self.assertEqual(self.call('GET', '/nutriclinic/api/vault/'), (200, {'cases': []}))
        # Every copy of a device at once (turning site storage off); the other device's copy stays. The token is closed
        # then: a sending that arrives late changes nothing.
        self.put()
        self.put(code='NC-0000-0001')
        self.put(code='NC-0000-0002', token=B)
        self.assertEqual(self.call('DELETE', '/nutriclinic/api/vault/'), (200, {}))
        self.assertEqual(self.call('GET', '/nutriclinic/api/vault/'), (200, {'cases': []}))
        self.assertEqual(self.put(), (410, {'error': 'closed'}))
        self.assertEqual(self.call('GET', '/nutriclinic/api/vault/'), (200, {'cases': []}))
        self.assertEqual(self.call('DELETE', '/nutriclinic/api/vault/'), (200, {}))
        self.assertEqual(len(self.call('GET', '/nutriclinic/api/vault/', token=B)[1]['cases']), 1)
        self.assertEqual(self.put(code='NC-0000-0003', token=B)[0], 200)
        self.assertEqual(self.call('DELETE', '/nutriclinic/api/vault/', token='short')[0], 401)
        # The token itself is never stored.
        with open(self.store.path, 'rb') as handle:
            self.assertNotIn(A.encode(), handle.read())

    def test_only_the_answers_of_the_form_are_accepted(self):
        self.assertEqual(self.put()[0], 200)
        for bad in ({**OK, 'data': {**DATA, 'label': 'Yatak 5'}},
                    with_values(note='Ahmet Yilmaz'), with_values(note='Ahmet'), with_values(x='a\nb'), with_values(x='y' * 25),
                    with_values(weightKg='mehmetyilmaz'), with_values(weightKg='ayse'), with_values(x='12345,678901'),
                    with_values(phone='05321234567'), with_values(born='07.11.1950'),
                    with_values(tc='12345678901'), with_values(mail='a@b.co'), with_values(x='1e9'), with_values(x='mmol/l'),
                    with_values(x=10 ** 7), with_values(x=10 ** 30), with_values(x=[1]), with_values(x={'a': 1}), with_values(x=None),
                    {**OK, 'data': {**DATA, 'product': {'ons': {'unit': 'iki kutu'}}}},
                    {**OK, 'data': {**DATA, 'product': {'ons': {'name': 'Marka'}}}},
                    {**OK, 'data': {**DATA, 'product': {'en': {'kcalPerMl': 'bir'}}}},
                    {**OK, 'data': {**DATA, 'followup': [{'day': '2', 'kcal': '1200', 'note': 'x'}]}},
                    {**OK, 'data': {**DATA, 'followup': [{'day': '07.11.2026'}]}},
                    {**OK, 'data': {**DATA, 'decisions': {'icu-protein': 'Dr Ali'}}},
                    {**OK, 'data': {**DATA, 'engine': 'latest'}},
                    {**OK, 'extra': 1}, {**OK, 'updatedAt': 'yesterday'}, [1]):
            self.assertEqual(self.put(bad)[0], 400, bad)
        for good in (with_values(age='0-17'), with_values(age='90+'), with_values(x=''), with_values(x='-0,25'), with_values(x='123456.1234'),
                     with_values(x=False), with_values(x=12.5), with_values(x='unknown'), with_values(x='anuria12'), with_values(x='12')):
            self.assertEqual(self.put(good)[0], 200, good)
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
        self.assertEqual(self.put(code='NC-0000-0005', token='C' * 43)[0], 200)
        self.assertEqual(self.put(code='NC-0000-0006', token='D' * 43), (507, {'error': 'capacity'}))
        big = {**OK, 'data': {**DATA, 'values': {f'k{i}': '123456.1234' for i in range(300)}}}
        self.assertEqual(self.put(big, code='NC-0000-0007', token=B), (507, {'error': 'owner-full'}))
        self.store.free_bytes = lambda: 4 * 1024 ** 3  # below the 5 GB floor
        self.assertEqual(self.put(code='NC-0000-0001'), (507, {'error': 'disk'}))

    def test_sizes_are_counted_in_bytes(self):
        # µ and ³ take two bytes each: a limit between the length in characters and in bytes must refuse the copy.
        data = {**DATA, 'values': {f'u{i}': '10³/µL' for i in range(60)}}
        text = clean_data(data)
        chars, size = len(text), len(text.encode('utf-8'))
        self.assertGreater(size, chars + 100)
        self.store.max_owner_bytes = (chars + size) // 2
        self.assertEqual(self.put({**OK, 'data': data}), (507, {'error': 'owner-full'}))

    def test_new_devices_per_address_and_day(self):
        tokens = [c * 43 for c in 'CDEF']
        self.store.max_owners = 10
        self.assertEqual(self.put(code='NC-0000-0011', token=tokens[0], client='203.0.113.7')[0], 200)
        self.assertEqual(self.put(code='NC-0000-0012', token=tokens[1], client='203.0.113.7')[0], 200)
        self.assertEqual(self.put(code='NC-0000-0013', token=tokens[2], client='203.0.113.7'), (429, {'error': 'new-device-limit'}))
        # A device already on the site, and another address, are not held back.
        self.assertEqual(self.put(code='NC-0000-0014', token=tokens[0], client='203.0.113.7')[0], 200)
        self.assertEqual(self.put(code='NC-0000-0013', token=tokens[2], client='198.51.100.9')[0], 200)
        with open(self.store.path, 'rb') as handle:
            self.assertNotIn(b'203.0.113.7', handle.read())  # the address is kept salted and hashed only
        # The next day it counts afresh, with a new salt, and the counts of the day before are dropped.
        salt = self.store.salt
        self.today = '2026-11-08T08:00:00.000Z'
        self.assertEqual(self.put(code='NC-0000-0015', token=tokens[3], client='203.0.113.7')[0], 200)
        days = {row[0] for row in self.store.db.execute('SELECT day FROM new_devices')}
        self.assertEqual(days, {'2026-11-08'})
        self.assertNotEqual(self.store.salt, salt)
        names = {row[0] for row in self.store.db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        self.assertEqual(names, {'cases', 'new_devices', 'closed'})  # the salt is never stored

    def test_one_ipv6_network_counts_as_one_address(self):
        self.assertEqual(client_key('2001:db8:1:2::1'), client_key('2001:db8:1:2:ffff::9'))
        self.assertNotEqual(client_key('2001:db8:1:2::1'), client_key('2001:db8:1:3::1'))
        self.assertEqual(client_key('::ffff:203.0.113.7'), '203.0.113.7')
        self.assertEqual(client_key(' 198.51.100.9 '), '198.51.100.9')
        self.store.max_owners = 10
        for i, (token, client) in enumerate((('C' * 43, '2001:db8:1:2::1'), ('D' * 43, '2001:db8:1:2::2'))):
            self.assertEqual(self.put(code=f'NC-0000-003{i}', token=token, client=client)[0], 200)
        self.assertEqual(self.put(code='NC-0000-0039', token='E' * 43, client='2001:db8:1:2:abcd::7'), (429, {'error': 'new-device-limit'}))

    def test_age_bands_and_pages_opened_before(self):
        cases = [(17, '0-17'), (18, '18-19'), ('19,9', '18-19'), (20, '20-24'), (64, '60-64'), (65, '65-69'), ('69.5', '65-69'), (70, '70-74'),
                 (89, '85-89'), (90, '90+'), (104, '90+'), ('abc', None), (-1, None), (131, None), ('', None), ('65-69', '65-69'), (True, None)]
        for age, band in cases:
            self.assertEqual(age_band(age), band, age)
        # A page opened before 1.9.1 sends the age itself: it is kept as its band; one that cannot be banded is left out.
        self.assertEqual(self.put(with_values(age='67')), (200, {}))
        self.assertEqual(self.admin()[1]['cases'][0]['data']['values']['age'], '65-69')
        for age in ('', 'sixty', '65-69 Ali', 200):
            self.assertEqual(self.put(with_values(age=age)), (200, {}), age)
            self.assertNotIn('age', self.admin()[1]['cases'][0]['data']['values'])

    def test_copies_stored_before_are_scrubbed_at_start(self):
        old = {'values': {'setting': 'icu', 'age': '67', 'weightKg': 'Ahmet', 'sex': 'male', 'note': 'Ali Veli', 'stroke': True},
               'product': {'ons': {'kcal': '300', 'brand': 'Marka', 'unit': 'mL'}}, 'followup': [{'day': '2', 'kcal': '1.200 kcal'}],
               'decisions': {'icu-protein': 'progressive-local'}, 'engine': '1.9.0'}
        good = clean_data(DATA)
        for code, data in (('NC-0000-0021', json.dumps(old, ensure_ascii=False)), ('NC-0000-0022', good), ('NC-0000-0023', '[1]')):
            self.store.db.execute('INSERT INTO cases (code, owner, updated_at, saved_at, data) VALUES (?, ?, ?, ?, ?)',
                                  (code, 'f' * 64, '2026-11-07T19:50:00.000Z', '2026-11-07T19:50:01.000Z', data))
        again = Store(self.tmp.name, now=lambda: self.today, free_bytes=lambda: None)
        self.assertEqual(again.migrated, 2)
        rows = dict(again.db.execute('SELECT code, data FROM cases').fetchall())
        self.assertEqual(json.loads(rows['NC-0000-0021']), {
            'values': {'setting': 'icu', 'age': '65-69', 'sex': 'male', 'stroke': True}, 'product': {'ons': {'kcal': '300', 'unit': 'mL'}},
            'followup': [{'day': '2'}], 'decisions': {'icu-protein': 'progressive-local'}, 'engine': '1.9.0'})
        self.assertEqual(rows['NC-0000-0022'], good)
        self.assertEqual(json.loads(rows['NC-0000-0023']), {})
        again.close()
        third = Store(self.tmp.name, now=lambda: self.today, free_bytes=lambda: None)
        self.assertEqual(third.migrated, 0)
        third.close()

    def test_administrator_sees_every_copy_anonymised_and_only_with_the_password(self):
        self.put()
        self.put(code='NC-0000-0009', token=B)
        self.assertEqual(self.admin(user=None)[0], 401)
        self.assertEqual(self.admin(user=' ')[0], 401)
        status, body = self.admin()
        self.assertEqual((status, body['total'], body['offset'], len(body['cases'])), (200, 2, 0, 2))
        first = next(c for c in body['cases'] if c['code'] == CODE)
        self.assertEqual(first, {'code': CODE, 'savedOn': '2026-11-07', 'data': DATA})  # the day only; nothing about the device
        self.assertNotIn(A, json.dumps(body))
        self.assertEqual(self.admin('offset=1&limit=1')[1]['total'], 2)
        self.assertEqual(len(self.admin('offset=1&limit=1')[1]['cases']), 1)
        self.assertEqual(len(self.admin('limit=100000')[1]['cases']), 2)
        self.assertEqual(self.admin('offset=99999999999999999999999')[0], 200)
        self.assertEqual(self.admin('offset=x')[0], 400)
        # The order shows the day of saving only: by day (newest first), then by code, never by the time of saving.
        self.today = '2026-11-07T20:00:02.000Z'
        self.put(code='NC-0000-0001', token=B)
        self.today = '2026-11-08T09:00:00.000Z'
        self.assertEqual(self.put(code='NC-ZZZZ-ZZZZ', token='C' * 43)[0], 200)
        self.assertEqual([c['code'] for c in self.admin()[1]['cases']], ['NC-ZZZZ-ZZZZ', 'NC-0000-0001', 'NC-0000-0009', CODE])
        self.assertEqual(self.call('PUT', '/nutriclinic/yonetim/api/cases', OK, token=None, user='nutriclinic')[0], 404)
        self.assertEqual(self.call('GET', '/nutriclinic/yonetim/api/other', token=None, user='nutriclinic')[0], 404)
        # With a list of administrator names, only those.
        self.app.admin_users = {'yonetici'}
        self.assertEqual(self.admin()[0], 401)
        self.assertEqual(self.admin(user='yonetici')[0], 200)


if __name__ == '__main__':
    unittest.main()
