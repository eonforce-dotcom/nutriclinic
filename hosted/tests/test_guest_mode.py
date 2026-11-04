"""Guest mode: open guest spaces per browser cookie, full access behind basic auth."""
import io
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from nutriclinic_api import Api  # noqa: E402

HOST = 'sahnoroloji.org'
ORIGIN = 'https://sahnoroloji.org'
GUEST = '/nutriclinic/api/local/'
FULL = '/nutriclinic/tam/api/local/'
DRAFT = '39b4be89-a91f-4f7c-98d7-cdd2ec4fe1cd'


def workspace(code='SYNTHETIC-GUEST'):
    return {'schema': 'nutriklinik-local-workspace-0.1.0',
            'current': {'draftId': DRAFT, 'input': {'studyId': code, 'albumin': 31}},
            'records': [], 'importedComparisons': []}


class GuestMode(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp(prefix='nutriclinic-guest-')
        self.make_api()

    def make_api(self, **options):
        self.api = Api(data_root=self.root, allowed_hosts=[HOST], allowed_origins=[ORIGIN], path_prefix='/nutriclinic',
                       guest_mode=True, full_prefix='/nutriclinic/tam', **options)

    def tearDown(self):
        for store in list(self.api.stores.values()) + ([self.api.template] if self.api.template else []):
            store.close()
        shutil.rmtree(self.root)

    def call(self, path, method='GET', body=None, headers=None, cookie=None, user=None):
        path, _, query = path.partition('?')
        data = b'' if body is None else json.dumps(body).encode()
        environ = {'REQUEST_METHOD': method, 'PATH_INFO': path, 'QUERY_STRING': query, 'HTTP_HOST': HOST,
                   'wsgi.input': io.BytesIO(data), 'CONTENT_LENGTH': str(len(data)),
                   'CONTENT_TYPE': 'application/json' if body is not None else ''}
        if cookie:
            environ['HTTP_COOKIE'] = cookie
        if user is not None:
            environ['HTTP_X_REMOTE_USER'] = user
        for name, value in (headers or {}).items():
            environ['HTTP_' + name.upper().replace('-', '_')] = value
        captured = {}
        raw = b''.join(self.api(environ, lambda status, response_headers: captured.update(
            status=int(status.split()[0]), headers=dict(response_headers))))
        return captured['status'], (json.loads(raw) if raw else None), captured['headers']

    def guest(self):
        """A new browser: bootstrap without a cookie and keep the cookie it receives."""
        status, value, headers = self.call(GUEST + 'bootstrap')
        self.assertEqual((status, value['access']), (200, 'guest'))
        cookie = headers['Set-Cookie'].split(';')[0]
        return cookie, {'X-NutriKlinik-Token': value['token'], 'Origin': ORIGIN}

    def admin(self):
        status, value, _ = self.call(FULL + 'bootstrap', user='nutriclinic')
        self.assertEqual((status, value['access']), (200, 'full'))
        return {'X-NutriKlinik-Token': value['token'], 'Origin': ORIGIN}

    def users(self):
        folder = Path(self.root) / 'users'
        return sorted(p.name for p in folder.iterdir()) if folder.is_dir() else []

    def test_cookie_is_secure_http_only_and_scoped_to_the_guest_api(self):
        _, _, headers = self.call(GUEST + 'bootstrap')
        cookie = headers['Set-Cookie']
        for part in ('Path=/nutriclinic/api/local/', 'HttpOnly', 'SameSite=Strict', 'Secure', 'Max-Age=34560000'):
            self.assertIn(part, cookie)
        self.assertRegex(cookie.split(';')[0], r'^nc_misafir=[a-f0-9]{64}$')
        self.assertNotIn('Set-Cookie', self.call(FULL + 'bootstrap', user='nutriclinic')[2])

    def test_a_visit_without_writing_creates_no_database(self):
        cookie, headers = self.guest()
        read = self.call(GUEST + 'workspace', headers=headers, cookie=cookie)
        self.assertEqual(read[:2], (200, {'revision': 0, 'snapshot': None, 'updatedAt': None}))
        self.assertEqual(self.call(GUEST + 'patients', headers=headers, cookie=cookie)[1], {'patients': []})
        self.assertEqual(self.call(GUEST + 'backups', headers=headers, cookie=cookie)[1], {'backups': []})
        self.assertEqual(self.call(GUEST + 'patient?studyId=x', headers=headers, cookie=cookie)[1]['total'], 0)
        self.assertEqual(self.call(GUEST + 'draft?draftId=' + DRAFT, headers=headers, cookie=cookie)[0], 404)
        self.assertEqual(self.users(), [])

    def test_guests_see_only_their_own_records(self):
        cookie_a, headers_a = self.guest()
        cookie_b, headers_b = self.guest()
        self.assertNotEqual(cookie_a, cookie_b)
        saved = self.call(GUEST + 'workspace', 'PUT', {'expectedRevision': 0, 'snapshot': workspace('GUEST-A')}, headers_a, cookie_a)
        self.assertEqual((saved[0], saved[1]['revision']), (200, 1))
        self.assertEqual([p['studyId'] for p in self.call(GUEST + 'patients', headers=headers_a, cookie=cookie_a)[1]['patients']], ['GUEST-A'])
        self.assertEqual(self.call(GUEST + 'patients', headers=headers_b, cookie=cookie_b)[1]['patients'], [])
        self.assertEqual(self.call(GUEST + 'workspace', headers=headers_b, cookie=cookie_b)[1]['snapshot'], None)
        # The same browser keeps its records on later visits (same cookie).
        again = self.call(GUEST + 'bootstrap', cookie=cookie_a)
        self.assertEqual(again[2]['Set-Cookie'].split(';')[0], cookie_a)
        self.assertEqual(self.call(GUEST + 'workspace', headers=headers_a, cookie=cookie_a)[1]['revision'], 1)
        self.assertEqual(len(self.users()), 1)
        self.assertRegex(self.users()[0], r'^misafir-[a-f0-9]{40}$')
        self.assertNotIn(cookie_a.split('=')[1], self.users()[0])

    def test_guest_cannot_reach_shared_records_or_admin_routes(self):
        admin = self.admin()
        self.call(FULL + 'workspace', 'PUT', {'expectedRevision': 0, 'snapshot': workspace('SHARED-1')}, admin, user='nutriclinic')
        cookie, headers = self.guest()
        # A forged X-Remote-User on the open path is ignored.
        forged = self.call(GUEST + 'patients', headers=headers, cookie=cookie, user='nutriclinic')
        self.assertEqual(forged[1], {'patients': []})
        for route in ('guests', 'guest-patients?guest=misafir-' + '0' * 40, 'guest-patient?guest=x&studyId=SHARED-1'):
            self.assertEqual(self.call(GUEST + route, headers=headers, cookie=cookie)[0], 405)
        # No cookie (or a malformed one): no access beyond bootstrap.
        self.assertEqual(self.call(GUEST + 'workspace', headers=headers)[1]['error'], 'authentication-required')
        self.assertEqual(self.call(GUEST + 'workspace', headers=headers, cookie='nc_misafir=../../x')[1]['error'], 'authentication-required')
        self.assertEqual(self.call(GUEST + 'workspace', headers={**headers, 'Origin': 'https://attacker.example'}, cookie=cookie)[1]['error'], 'cross-origin-request')

    def test_full_access_needs_basic_auth_user_and_keeps_shared_records(self):
        self.assertEqual(self.call(FULL + 'bootstrap')[1]['error'], 'authentication-required')
        self.assertEqual(self.call(FULL + 'bootstrap', user='misafir-' + 'a' * 40)[1]['error'], 'authentication-required')
        admin = self.admin()
        self.call(FULL + 'workspace', 'PUT', {'expectedRevision': 0, 'snapshot': workspace('SHARED-1')}, admin, user='nutriclinic')
        self.assertTrue((Path(self.root) / 'users' / 'nutriclinic' / 'data' / 'nutriklinik.sqlite').is_file())
        self.assertEqual(self.call(FULL + 'patients', headers=admin, user='nutriclinic')[1]['patients'][0]['studyId'], 'SHARED-1')
        self.assertEqual(self.call('/api/local/bootstrap', user='nutriclinic')[0], 404)

    def test_full_access_reads_guest_records_without_changing_them(self):
        cookie, headers = self.guest()
        self.call(GUEST + 'workspace', 'PUT', {'expectedRevision': 0, 'snapshot': workspace('GUEST-A')}, headers, cookie)
        admin = self.admin()
        guests = self.call(FULL + 'guests', headers=admin, user='nutriclinic')[1]['guests']
        self.assertEqual(len(guests), 1)
        self.assertEqual((guests[0]['patientCount'], guests[0]['draftCount'], guests[0]['recordCount']), (1, 1, 0))
        name = guests[0]['guest']
        patients = self.call(FULL + 'guest-patients?guest=' + name, headers=admin, user='nutriclinic')[1]
        self.assertEqual([p['studyId'] for p in patients['patients']], ['GUEST-A'])
        page = self.call(FULL + 'guest-patient?guest=' + name + '&studyId=GUEST-A', headers=admin, user='nutriclinic')[1]
        self.assertEqual(page['latestDraft']['current']['input']['studyId'], 'GUEST-A')
        self.assertEqual(self.call(FULL + 'guests', 'POST', {}, admin, user='nutriclinic')[0], 405)
        for bad in ('misafir-' + '0' * 40, '../nutriclinic', 'nutriclinic'):
            self.assertEqual(self.call(FULL + 'guest-patients?guest=' + bad, headers=admin, user='nutriclinic')[1]['error'], 'guest-not-found')
        # The guest's own data are unchanged by the reads.
        self.assertEqual(self.call(GUEST + 'workspace', headers=headers, cookie=cookie)[1]['revision'], 1)

    def test_guest_count_size_and_backup_limits(self):
        self.tearDown()
        self.root = tempfile.mkdtemp(prefix='nutriclinic-guest-')
        self.make_api(guest_limit=1, guest_bytes=10 ** 9, guest_backups=2)
        cookie_a, headers_a = self.guest()
        self.assertEqual(self.call(GUEST + 'workspace', 'PUT', {'expectedRevision': 0, 'snapshot': workspace()}, headers_a, cookie_a)[0], 200)
        cookie_b, headers_b = self.guest()
        refused = self.call(GUEST + 'workspace', 'PUT', {'expectedRevision': 0, 'snapshot': workspace()}, headers_b, cookie_b)
        self.assertEqual((refused[0], refused[1]['error']), (507, 'guest-capacity-reached'))
        self.assertEqual(self.call(GUEST + 'backup', 'POST', {}, headers_a, cookie_a)[0], 201)
        self.assertEqual(self.call(GUEST + 'backup', 'POST', {}, headers_a, cookie_a)[0], 201)
        self.assertEqual(self.call(GUEST + 'backup', 'POST', {}, headers_a, cookie_a)[1]['error'], 'guest-backup-limit-reached')
        self.api.guest_bytes = 1
        full = self.call(GUEST + 'workspace', 'PUT', {'expectedRevision': 1, 'snapshot': workspace()}, headers_a, cookie_a)
        self.assertEqual((full[0], full[1]['error']), (507, 'guest-storage-full'))
        # A full guest space can still be read.
        self.assertEqual(self.call(GUEST + 'workspace', headers=headers_a, cookie=cookie_a)[1]['revision'], 1)

    def test_guest_mode_requires_distinct_prefixes(self):
        with self.assertRaises(ValueError):
            Api(data_root=self.root, allowed_hosts=[HOST], allowed_origins=[ORIGIN], path_prefix='/nutriclinic', guest_mode=True)


if __name__ == '__main__':
    unittest.main()
