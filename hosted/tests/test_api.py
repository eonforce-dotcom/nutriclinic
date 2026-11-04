import io
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from nutriclinic_api import Api, js_number_from_string  # noqa: E402

HOST = 'sahnoroloji.org'
ORIGIN = 'https://sahnoroloji.org'
DRAFT = '39b4be89-a91f-4f7c-98d7-cdd2ec4fe1cd'


def workspace(albumin=31):
    return {'schema': 'nutriklinik-local-workspace-0.1.0',
            'current': {'draftId': DRAFT, 'input': {'studyId': 'SYNTHETIC-HTTP', 'albumin': albumin}},
            'records': [], 'importedComparisons': []}


class ApiBehaviour(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp(prefix='nutriclinic-api-')
        self.api = Api(data_root=self.root, allowed_hosts=[HOST], allowed_origins=[ORIGIN], path_prefix='/nutriclinic')

    def tearDown(self):
        for store in self.api.stores.values():
            store.close()
        shutil.rmtree(self.root)

    def call(self, path, method='GET', body=None, headers=None, user='nutriclinic', content_type='application/json'):
        path, _, query = path.partition('?')
        data = body if isinstance(body, bytes) else (b'' if body is None else json.dumps(body).encode())
        environ = {'REQUEST_METHOD': method, 'PATH_INFO': path, 'QUERY_STRING': query, 'HTTP_HOST': HOST,
                   'wsgi.input': io.BytesIO(data), 'CONTENT_LENGTH': str(len(data)), 'CONTENT_TYPE': content_type if body is not None else ''}
        if user is not None:
            environ['HTTP_X_REMOTE_USER'] = user
        for name, value in (headers or {}).items():
            environ['HTTP_' + name.upper().replace('-', '_')] = value
        captured = {}
        chunks = self.api(environ, lambda status, response_headers: captured.update(status=int(status.split()[0]), headers=dict(response_headers)))
        raw = b''.join(chunks)
        return captured['status'], (json.loads(raw) if raw else None), captured['headers']

    def token(self, user='nutriclinic'):
        status, value, _ = self.call('/nutriclinic/api/local/bootstrap', user=user)
        self.assertEqual(status, 200)
        return {'X-NutriKlinik-Token': value['token'], 'Origin': ORIGIN}

    def test_bootstrap_reports_server_storage_and_security_headers(self):
        status, value, headers = self.call('/nutriclinic/api/local/bootstrap')
        self.assertEqual(status, 200)
        self.assertEqual(len(value['token']), 64)
        self.assertEqual((value['storage']['mode'], value['storage']['available']), ('server-sqlite', True))
        self.assertEqual(headers['Cache-Control'], 'no-store')
        self.assertNotIn('Access-Control-Allow-Origin', headers)
        self.assertEqual(self.call('/nutriclinic/api/local/bootstrap', method='POST', body={})[0], 405)

    def test_requests_from_wrong_host_origin_site_or_user_are_refused(self):
        environ_host = self.call('/nutriclinic/api/local/bootstrap', headers={'Host': 'attacker.example'})
        self.assertEqual((environ_host[0], environ_host[1]['error']), (403, 'invalid-host'))
        for headers in ({'Origin': 'https://attacker.example'}, {'Origin': 'http://sahnoroloji.org'}, {'Sec-Fetch-Site': 'cross-site'}):
            self.assertEqual(self.call('/nutriclinic/api/local/bootstrap', headers=headers)[1]['error'], 'cross-origin-request')
        for user in (None, '', '../x', 'a' * 65, 'bad user'):
            self.assertEqual(self.call('/nutriclinic/api/local/bootstrap', user=user)[1]['error'], 'authentication-required')
        self.assertEqual(self.call('/nutriclinic/api/local/workspace')[0], 403)
        self.assertEqual(self.call('/nutriclinic/api/local/workspace', headers={'X-NutriKlinik-Token': '0' * 64})[1]['error'], 'invalid-local-token')
        self.assertEqual(self.call('/nutriclinic/other')[0], 404)

    def test_workspace_round_trip_with_node_compatible_errors(self):
        headers = self.token()
        self.assertEqual(self.call('/nutriclinic/api/local/workspace', headers=headers)[1]['revision'], 0)
        payload = {'expectedRevision': 0, 'snapshot': workspace()}
        self.assertEqual(self.call('/nutriclinic/api/local/workspace', 'PUT', payload, headers, content_type='text/plain')[0], 415)
        self.assertEqual(self.call('/nutriclinic/api/local/workspace', 'PUT', b'{bad', headers)[1]['error'], 'invalid-json')
        self.assertEqual(self.call('/nutriclinic/api/local/workspace', 'PUT', b'\xff', headers)[1]['error'], 'invalid-json')
        self.assertEqual(self.call('/nutriclinic/api/local/workspace', 'PUT', b'null', headers)[:2], (503, {'error': 'local-storage-operation-failed'}))
        self.assertEqual(self.call('/nutriclinic/api/local/workspace', 'PUT', b'[]', headers)[1]['error'], 'invalid-revision')
        saved = self.call('/nutriclinic/api/local/workspace', 'PUT', payload, headers)
        self.assertEqual((saved[0], saved[1]['revision']), (200, 1))
        conflict = self.call('/nutriclinic/api/local/workspace', 'PUT', payload, headers)
        self.assertEqual((conflict[0], conflict[1]), (409, {'error': 'workspace-conflict', 'revision': 1}))
        self.assertEqual(self.call('/nutriclinic/api/local/patients', headers=headers)[1]['patients'][0]['studyId'], 'SYNTHETIC-HTTP')
        self.assertEqual(self.call('/nutriclinic/api/local/draft?draftId=' + DRAFT, headers=headers)[1]['current']['input']['studyId'], 'SYNTHETIC-HTTP')
        page = self.call('/nutriclinic/api/local/patient?studyId=SYNTHETIC-HTTP&offset=%200%20&limit=0x0a', headers=headers)[1]
        self.assertEqual((page['offset'], page['limit'], page['draftCount']), (0, 10, 1))
        self.assertEqual(self.call('/nutriclinic/api/local/patient?studyId=x&offset=abc', headers=headers)[1]['error'], 'invalid-patient-query')
        self.assertEqual(self.call('/nutriclinic/api/local/backup', 'POST', {}, headers)[0], 201)
        # The first save of an empty database takes no daily backup, so only the manual one exists.
        self.assertEqual([b['kind'] for b in self.call('/nutriclinic/api/local/backups', headers=headers)[1]['backups']], ['manual'])
        self.assertEqual(self.call('/nutriclinic/api/local/workspace', 'HEAD', headers=headers)[0], 405)
        self.assertEqual(self.call('/nutriclinic/api/local/unknown', headers=headers)[1]['error'], 'method-or-route-not-allowed')

    def test_each_user_has_a_separate_database(self):
        first, second = self.token('team-a'), self.token('team-b')
        self.call('/nutriclinic/api/local/workspace', 'PUT', {'expectedRevision': 0, 'snapshot': workspace()}, first, user='team-a')
        self.assertEqual(len(self.call('/nutriclinic/api/local/patients', headers=first, user='team-a')[1]['patients']), 1)
        self.assertEqual(self.call('/nutriclinic/api/local/patients', headers=second, user='team-b')[1]['patients'], [])
        self.assertTrue((Path(self.root) / 'users' / 'team-a' / 'data' / 'nutriklinik.sqlite').is_file())

    def test_health_check_needs_no_host_or_user(self):
        environ = {'REQUEST_METHOD': 'GET', 'PATH_INFO': '/healthz', 'wsgi.input': io.BytesIO()}
        captured = {}
        body = b''.join(self.api(environ, lambda status, headers: captured.update(status=status)))
        self.assertEqual((captured['status'], json.loads(body)), ('200 OK', {'status': 'ok'}))

    def test_query_numbers_follow_javascript_number(self):
        for text, expected in (('', 0), (' 5 ', 5), ('1e2', 100), ('0x10', 16), ('0b11', 3), ('-0x10', None), ('abc', None), ('1.5', 1.5)):
            value = js_number_from_string(text)
            if expected is None:
                self.assertNotEqual(value, value)
            else:
                self.assertEqual(value, expected)


if __name__ == '__main__':
    unittest.main()
