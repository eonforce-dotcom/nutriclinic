import os
import shutil
import sqlite3
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from nutriclinic_store import (LocalStoreError, MAX_WORKSPACE_BYTES, dump_json, js_number, open_store,  # noqa: E402
                               parse_json, stable)

DRAFT = '39b4be89-a91f-4f7c-98d7-cdd2ec4fe1cd'


def workspace(albumin=31, records=None, study='SYNTHETIC-ONLY'):
    return {'schema': 'nutriklinik-local-workspace-0.1.0',
            'current': {'draftId': DRAFT, 'input': {'studyId': study, 'albumin': albumin}, 'provenance': []},
            'records': records or [], 'importedComparisons': []}


def record(record_id, value=1, study='SYNTHETIC-ONLY'):
    return {'recordId': record_id, 'savedAt': '2026-10-29T10:00:00.000Z', 'input': {'studyId': study, 'value': value}}


class Clock:
    def __init__(self):
        self.moment = datetime(2026, 10, 29, 10, 0, 0, tzinfo=timezone.utc)

    def __call__(self):
        self.moment += timedelta(milliseconds=7)
        return self.moment


class JsonCompatibility(unittest.TestCase):
    def test_numbers_are_written_like_javascript(self):
        cases = {0: '0', -0.0: '0', 1.0: '1', 68: '68', 0.5: '0.5', -12.25: '-12.25', 0.1 + 0.2: '0.30000000000000004',
                 1e-7: '1e-7', 1.5e-7: '1.5e-7', 1e-6: '0.000001', 0.0001: '0.0001', 1e16: '10000000000000000',
                 1e21: '1e+21', 2.5e20: '250000000000000000000', 123456789012345680.0: '123456789012345680',
                 5e-324: '5e-324', 1.7976931348623157e308: '1.7976931348623157e+308'}
        for value, expected in cases.items():
            self.assertEqual(js_number(value), expected, repr(value))

    def test_parse_reads_numbers_as_doubles_and_rejects_constants(self):
        self.assertEqual(dump_json(parse_json('12345678901234567890')), '12345678901234567000')
        self.assertEqual(dump_json(parse_json('[1.0, -0, 2e2]')), '[1,0,200]')
        for text in ('NaN', '[Infinity]', '-Infinity'):
            with self.assertRaises(ValueError):
                parse_json(text)

    def test_key_order_and_escapes_match_json_stringify(self):
        value = stable({'b': 1, '10': 2, '2': 3, 'a': {'\U0001F600': 1, '！': 2}, '': 0})
        self.assertEqual(dump_json(value), '{"2":3,"10":2,"":0,"a":{"\U0001F600":1,"！":2},"b":1}')
        self.assertEqual(dump_json('a"b\\c\n\t\x01 /\ud800é'), '"a\\"b\\\\c\\n\\t\\u0001 /\\ud800é"')

    def test_stable_rejects_deep_or_non_finite_values(self):
        deep = []
        for _ in range(102):
            deep = [deep]
        with self.assertRaises(LocalStoreError) as caught:
            stable(deep)
        self.assertEqual(caught.exception.code, 'json-nesting-too-deep')
        with self.assertRaises(LocalStoreError) as caught:
            stable({'x': float('inf')})
        self.assertEqual(caught.exception.code, 'invalid-json-value')


class StoreBehaviour(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp(prefix='nutriclinic-store-')
        self.clock = Clock()
        self.store = open_store(self.root, now=self.clock)

    def tearDown(self):
        self.store.close()
        shutil.rmtree(self.root)

    def error(self, call, *args, **kwargs):
        with self.assertRaises(LocalStoreError) as caught:
            call(*args, **kwargs)
        return caught.exception

    def test_save_increments_revision_and_detects_conflicts(self):
        self.assertEqual(self.store.read(), {'revision': 0, 'snapshot': None, 'updatedAt': None})
        saved = self.store.save(expected_revision=0, snapshot=workspace())
        self.assertEqual(saved['revision'], 1)
        self.assertEqual(saved['snapshot']['current']['input']['albumin'], 31)
        stale = self.error(self.store.save, expected_revision=0, snapshot=workspace(32))
        self.assertEqual((stale.code, stale.status, stale.extra), ('workspace-conflict', 409, {'revision': 1}))
        self.assertEqual(self.store.save(expected_revision=1.0, snapshot=workspace(33))['revision'], 2)

    def test_invalid_inputs_are_refused_with_node_error_codes(self):
        for revision in (None, True, -1, 1.5, 2 ** 53):
            self.assertEqual(self.error(self.store.save, expected_revision=revision, snapshot=workspace()).code, 'invalid-revision')
        bad = workspace()
        bad['schema'] = 'other'
        self.assertEqual(self.error(self.store.save, expected_revision=0, snapshot=bad).code, 'invalid-workspace')
        bad = workspace(study=7)
        self.assertEqual(self.error(self.store.save, expected_revision=0, snapshot=bad).code, 'invalid-study-id')
        for broken in ([record('r1'), record('r1')], [record('r1', study='  ')], [{'recordId': 'r2', 'input': {}}]):
            self.assertEqual(self.error(self.store.save, expected_revision=0, snapshot=workspace(records=broken)).code, 'invalid-assessment-record')
        huge = workspace()
        huge['current']['input']['note'] = 'x' * MAX_WORKSPACE_BYTES
        too_large = self.error(self.store.save, expected_revision=0, snapshot=huge)
        self.assertEqual((too_large.code, too_large.status), ('workspace-too-large', 413))

    def test_records_drafts_and_patient_pages(self):
        self.store.save(expected_revision=0, snapshot=workspace(records=[record('r1'), record('r2')]))
        self.store.save(expected_revision=1, snapshot=workspace(records=[record('r1'), record('r2'), record('r3')]))
        conflict = self.error(self.store.save, expected_revision=2, snapshot=workspace(records=[record('r1', value=9)]))
        self.assertEqual((conflict.code, conflict.status), ('assessment-id-conflict', 409))
        self.assertEqual(self.store.read()['revision'], 2)
        patients = self.store.patients()
        self.assertEqual([(p['studyId'], p['recordCount'], p['draftCount'], p['latestDraftId']) for p in patients], [('SYNTHETIC-ONLY', 3, 1, DRAFT)])
        page = self.store.patient(study_id='SYNTHETIC-ONLY', offset=1, limit=1)
        self.assertEqual((page['total'], page['offset'], page['limit'], page['hasMore'], len(page['records'])), (3, 1, 1, True, 1))
        self.assertEqual(page['latestDraft']['draftId'], DRAFT)
        self.assertEqual(self.store.draft(draft_id=DRAFT)['current']['input']['albumin'], 31)
        self.assertEqual(self.error(self.store.draft, draft_id='missing').status, 404)
        for query in ({'study_id': None}, {'study_id': 'x', 'offset': -1}, {'study_id': 'x', 'limit': 201}, {'study_id': 'x', 'offset': 0.5}):
            self.assertEqual(self.error(self.store.patient, **query).code, 'invalid-patient-query')

    def test_backups_daily_snapshot_and_restore_keep_newer_archive(self):
        self.store.save(expected_revision=0, snapshot=workspace(31, [record('r1')]))
        manual = self.store.backup()
        self.assertEqual(manual['kind'], 'manual')
        self.assertRegex(manual['file'], r'^manual-2026-10-29T10-00-00Z-[a-f0-9]{8}\.sqlite$')
        self.store.save(expected_revision=1, snapshot=workspace(40, [record('r1'), record('r2')]))
        kinds = sorted(item['kind'] for item in self.store.backups())
        self.assertEqual(kinds, ['daily', 'manual'])
        restored = self.store.restore(expected_revision=2, backup_file=manual['file'])
        self.assertEqual(restored['revision'], 3)
        self.assertEqual(restored['snapshot']['current']['input']['albumin'], 31)
        self.assertEqual(restored['safetyBackup']['kind'], 'before-restore')
        self.assertEqual(self.store.patients()[0]['recordCount'], 2)
        self.assertEqual(self.error(self.store.restore, expected_revision=3, backup_file='../x.sqlite').code, 'backup-not-found')
        self.assertEqual(self.error(self.store.restore, expected_revision=1, backup_file=manual['file']).status, 409)

    def test_corrupt_backup_is_refused(self):
        self.store.save(expected_revision=0, snapshot=workspace())
        backup = self.store.backup()
        with open(os.path.join(self.root, 'data', 'backups', backup['file']), 'wb') as handle:
            handle.write(b'not a database')
        self.assertEqual(self.error(self.store.restore, expected_revision=1, backup_file=backup['file']).code, 'invalid-or-corrupt-backup')

    def test_database_is_readable_with_plain_sqlite(self):
        self.store.save(expected_revision=0, snapshot=workspace(records=[record('r1')]))
        connection = sqlite3.connect(os.path.join(self.root, 'data', 'nutriklinik.sqlite'))
        try:
            row = connection.execute('SELECT record_json FROM assessments').fetchone()
        finally:
            connection.close()
        self.assertEqual(row[0], '{"input":{"studyId":"SYNTHETIC-ONLY","value":1},"recordId":"r1","savedAt":"2026-10-29T10:00:00.000Z"}')

    @unittest.skipIf(os.name == 'nt', 'symbolic links need extra rights on Windows')
    def test_symbolic_links_in_the_data_path_are_refused(self):
        other = tempfile.mkdtemp(prefix='nutriclinic-other-')
        try:
            root = tempfile.mkdtemp(prefix='nutriclinic-linked-')
            os.symlink(other, os.path.join(root, 'data'))
            with self.assertRaises(LocalStoreError) as caught:
                open_store(root)
            self.assertEqual(caught.exception.code, 'unsafe-data-path')
            shutil.rmtree(root)
        finally:
            shutil.rmtree(other)


if __name__ == '__main__':
    unittest.main()
