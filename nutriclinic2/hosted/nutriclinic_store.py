"""NutriClinic patient-record store for the hosted edition.

Python standard-library port of ../local-persistence.mjs: the same SQLite
schema, validation rules, revision checks and backup rules, and JSON text
written exactly as JavaScript's JSON.stringify would write it. A database
created by the desktop (Node) edition opens here and vice versa.
"""
import json
import math
import os
import re
import secrets
import sqlite3
import stat
from datetime import datetime, timezone
from pathlib import Path

WORKSPACE_SCHEMA = 'nutriklinik-local-workspace-0.1.0'
MAX_WORKSPACE_BYTES = 16 * 1024 * 1024
MAX_SAFE_INTEGER = 2 ** 53 - 1


class LocalStoreError(Exception):
    def __init__(self, code, status=400, extra=None):
        super().__init__(code)
        self.code = code
        self.status = status
        self.extra = extra or {}


# --- JavaScript-compatible JSON -------------------------------------------

def _parse_int(text):
    value = int(text)
    # JSON.parse reads every number as a double.
    return value if abs(value) <= MAX_SAFE_INTEGER else float(text)


def _reject_constant(name):
    raise ValueError('non-standard JSON constant ' + name)


def parse_json(text):
    """JSON.parse equivalent: numbers as doubles, no NaN/Infinity literals."""
    return json.loads(text, parse_int=_parse_int, parse_constant=_reject_constant)


def _shortest_digits(value):
    """Shortest round-trip digits d and exponent n with value = 0.d x 10^n."""
    mantissa, _, exponent = repr(value).partition('e')
    integer, _, fraction = mantissa.partition('.')
    if fraction == '0':
        fraction = ''
    digits = (integer + fraction).lstrip('0')
    trimmed = digits.rstrip('0')
    n = len(trimmed) + int(exponent or 0) - len(fraction) + (len(digits) - len(trimmed))
    return trimmed, n


def js_number(value):
    """Number.prototype.toString for finite numbers (as JSON.stringify writes them)."""
    if isinstance(value, bool):
        raise TypeError('boolean is not a number')
    if isinstance(value, int):
        if abs(value) <= MAX_SAFE_INTEGER:
            return str(value)
        value = float(value)
    if not math.isfinite(value):
        raise LocalStoreError('invalid-json-value')
    if value == 0:
        return '0'
    if value.is_integer() and abs(value) <= MAX_SAFE_INTEGER:
        return str(int(value))
    sign = '-' if value < 0 else ''
    digits, n = _shortest_digits(abs(value))
    k = len(digits)
    if k <= n <= 21:
        return sign + digits + '0' * (n - k)
    if 0 < n <= 21:
        return sign + digits[:n] + '.' + digits[n:]
    if -6 < n <= 0:
        return sign + '0.' + '0' * -n + digits
    e = n - 1
    tail = 'e' + ('+' if e >= 0 else '-') + str(abs(e))
    return sign + (digits if k == 1 else digits[0] + '.' + digits[1:]) + tail


_STRING_ESCAPES = {'"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t'}
_NEEDS_ESCAPE = re.compile('["\\\\\x00-\x1f\ud800-\udfff]')


def _js_string(text):
    # Lone surrogates are escaped as JSON.stringify does since ES2019.
    return '"' + _NEEDS_ESCAPE.sub(lambda m: _STRING_ESCAPES.get(m.group(), '\\u%04x' % ord(m.group())), text) + '"'


_ARRAY_INDEX = re.compile(r'^(?:0|[1-9][0-9]*)$')


def _is_array_index(key):
    return bool(_ARRAY_INDEX.match(key)) and int(key) < 2 ** 32 - 1


def _js_key_order(keys):
    # JavaScript objects list array-index keys first in numeric order, then the rest in insertion order.
    keys = list(keys)
    return sorted((k for k in keys if _is_array_index(k)), key=int) + [k for k in keys if not _is_array_index(k)]


def dump_json(value):
    """JSON.stringify equivalent (no spacing)."""
    if value is None:
        return 'null'
    if value is True:
        return 'true'
    if value is False:
        return 'false'
    if isinstance(value, (int, float)):
        return js_number(value)
    if isinstance(value, str):
        return _js_string(value)
    if isinstance(value, list):
        return '[' + ','.join(dump_json(item) for item in value) + ']'
    if isinstance(value, dict):
        return '{' + ','.join(_js_string(k) + ':' + dump_json(value[k]) for k in _js_key_order(value)) + '}'
    raise TypeError('value is not JSON serialisable')


def _utf16_key(text):
    return text.encode('utf-16-be', 'surrogatepass')


def stable(value, depth=0):
    """Canonical copy with object keys sorted as Array.prototype.sort sorts strings."""
    if depth > 100:
        raise LocalStoreError('json-nesting-too-deep')
    if value is None or isinstance(value, (bool, str)):
        return value
    if isinstance(value, (int, float)):
        if isinstance(value, float) and not math.isfinite(value):
            raise LocalStoreError('invalid-json-value')
        return value
    if isinstance(value, list):
        return [stable(item, depth + 1) for item in value]
    if isinstance(value, dict):
        return {key: stable(value[key], depth + 1) for key in sorted(value, key=_utf16_key)}
    raise LocalStoreError('invalid-json-value')


# --- JavaScript value rules used by the validation ------------------------

_JS_WHITESPACE = '\t\n\x0b\x0c\r \xa0                　﻿'
_CONTROL = re.compile('[\x00-\x1f\x7f]')


def js_length(text):
    return len(text.encode('utf-16-le', 'surrogatepass')) // 2


def is_text(value, maximum):
    return isinstance(value, str) and 0 < js_length(value) <= maximum and not _CONTROL.search(value)


def is_object(value):
    return isinstance(value, dict)


def is_js_integer(value):
    if isinstance(value, bool):
        return False
    if isinstance(value, int):
        return True
    return isinstance(value, float) and math.isfinite(value) and value.is_integer()


def is_safe_integer(value):
    return is_js_integer(value) and abs(value) <= MAX_SAFE_INTEGER


def js_truthy(value):
    if value is None or value is False:
        return False
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return value != 0 and not (isinstance(value, float) and math.isnan(value))
    if isinstance(value, str):
        return value != ''
    return True


def js_to_string(value):
    if isinstance(value, str):
        return value
    if value is None:
        return 'null'
    if value is True:
        return 'true'
    if value is False:
        return 'false'
    if isinstance(value, (int, float)):
        return js_number(value) if math.isfinite(value) else ('NaN' if math.isnan(value) else ('Infinity' if value > 0 else '-Infinity'))
    if isinstance(value, list):
        return ','.join('' if item is None else js_to_string(item) for item in value)
    return '[object Object]'


def _get(value, key):
    return value.get(key) if isinstance(value, dict) else None


# --- Store -----------------------------------------------------------------

def encode_snapshot(snapshot):
    current = _get(snapshot, 'current')
    records = _get(snapshot, 'records')
    if (not is_object(snapshot) or snapshot.get('schema') != WORKSPACE_SCHEMA or not is_object(current)
            or not is_text(current.get('draftId'), 160) or not is_object(current.get('input'))
            or not isinstance(records, list) or len(records) > 200
            or not isinstance(snapshot.get('importedComparisons'), list)):
        raise LocalStoreError('invalid-workspace')
    draft_study = current['input'].get('studyId')
    if draft_study is not None and draft_study != '' and not is_text(draft_study, 160):
        raise LocalStoreError('invalid-study-id')
    ids = set()
    for record in records:
        study = _get(_get(record, 'input'), 'studyId')
        if (not is_object(record) or not is_text(record.get('recordId'), 160) or not is_object(record.get('input'))
                or not is_text(study, 160) or not study.strip(_JS_WHITESPACE) or record['recordId'] in ids):
            raise LocalStoreError('invalid-assessment-record')
        ids.add(record['recordId'])
    text = dump_json(stable(snapshot))
    if len(text.encode('utf-8')) > MAX_WORKSPACE_BYTES:
        raise LocalStoreError('workspace-too-large', 413)
    return text


def checked_revision(revision):
    if not is_safe_integer(revision) or revision < 0:
        raise LocalStoreError('invalid-revision')
    return int(revision)


def secure_directory(directory, root):
    absolute, base = os.path.abspath(directory), os.path.abspath(root)
    if absolute != base and not absolute.startswith(base + os.sep):
        raise LocalStoreError('unsafe-data-path', 500)
    if stat.S_ISLNK(os.lstat(base).st_mode):
        raise LocalStoreError('unsafe-data-path', 500)
    current = base
    for component in [part for part in os.path.relpath(absolute, base).split(os.sep) if part and part != '.']:
        current = os.path.join(current, component)
        if os.path.lexists(current):
            mode = os.lstat(current).st_mode
            if stat.S_ISLNK(mode) or not stat.S_ISDIR(mode):
                raise LocalStoreError('unsafe-data-path', 500)
        else:
            os.mkdir(current, 0o700)
    return absolute


def no_link(file):
    if os.path.lexists(file):
        mode = os.lstat(file).st_mode
        if stat.S_ISLNK(mode) or not stat.S_ISREG(mode):
            raise LocalStoreError('unsafe-data-path', 500)


SCHEMA_SQL = """CREATE TABLE IF NOT EXISTS workspace (singleton INTEGER PRIMARY KEY CHECK(singleton=1), revision INTEGER NOT NULL, snapshot TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS assessments (record_id TEXT PRIMARY KEY, study_id TEXT NOT NULL, record_json TEXT NOT NULL, saved_at TEXT, archived_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS assessments_study ON assessments(study_id,archived_at,record_id);
CREATE TABLE IF NOT EXISTS drafts (draft_id TEXT PRIMARY KEY, study_id TEXT NOT NULL, current_json TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS drafts_study ON drafts(study_id,updated_at,draft_id);
INSERT OR IGNORE INTO workspace(singleton,revision,snapshot,updated_at) VALUES(1,0,NULL,NULL);"""

BACKUP_NAME = re.compile(r'^(daily-\d{4}-\d{2}-\d{2}|manual-[0-9TZ-]+-[a-f0-9]{8}|before-restore-[0-9TZ-]+-[a-f0-9]{8})\.sqlite$')


def iso_ms(moment):
    return moment.astimezone(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')


def _read_only(path):
    return sqlite3.connect(Path(path).resolve().as_uri() + '?mode=ro', uri=True, isolation_level=None)


def _quick_check_ok(connection):
    return connection.execute('PRAGMA quick_check').fetchone()[0] == 'ok'


class Store:
    def __init__(self, root, now, location):
        if not isinstance(root, str) or not os.path.isabs(root):
            raise LocalStoreError('invalid-data-root', 500)
        self.root = root
        self.now = now
        self._location = location
        data = secure_directory(os.path.join(root, 'data'), root)
        self.backups_dir = secure_directory(os.path.join(data, 'backups'), root)
        self.database = os.path.join(data, 'nutriklinik.sqlite')
        for suffix in ('', '-wal', '-shm'):
            no_link(self.database + suffix)
        self.db = None
        try:
            self.db = sqlite3.connect(self.database, isolation_level=None, check_same_thread=False)
            self.db.row_factory = sqlite3.Row
            self.db.executescript('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;')
            self.db.executescript(SCHEMA_SQL)
            if not _quick_check_ok(self.db):
                raise RuntimeError('integrity')
        except Exception:
            try:
                if self.db is not None:
                    self.db.close()
            except Exception:
                pass
            raise LocalStoreError('database-unavailable-or-corrupt', 503)
        self.closed = False

    def _timestamp(self):
        return iso_ms(self.now())

    def _require_open(self):
        if self.closed:
            raise LocalStoreError('database-closed', 503)

    def read(self):
        self._require_open()
        row = self.db.execute('SELECT revision,snapshot,updated_at FROM workspace WHERE singleton=1').fetchone()
        return {'revision': row['revision'], 'snapshot': None if row['snapshot'] is None else parse_json(row['snapshot']), 'updatedAt': row['updated_at']}

    def _count(self):
        return self.db.execute('SELECT count(*) AS count FROM assessments').fetchone()['count']

    def backups(self):
        self._require_open()
        items = []
        for file in os.listdir(self.backups_dir):
            if not BACKUP_NAME.match(file):
                continue
            target = os.path.join(self.backups_dir, file)
            no_link(target)
            info = os.stat(target)
            kind = 'daily' if file.startswith('daily-') else 'before-restore' if file.startswith('before-restore-') else 'manual'
            created = iso_ms(datetime.fromtimestamp(info.st_mtime, timezone.utc))
            items.append({'file': file, 'bytes': info.st_size, 'createdAt': created, 'kind': kind})
        items.sort(key=lambda item: (item['createdAt'], item['file']), reverse=True)
        return items

    def _snapshot_backup(self, kind='manual'):
        self._require_open()
        secure_directory(self.backups_dir, self.root)
        stamp = re.sub(r'\.\d{3}Z$', 'Z', self._timestamp().replace(':', '-'))
        if kind == 'daily':
            file = 'daily-' + self._timestamp()[:10] + '.sqlite'
        else:
            file = kind + '-' + stamp + '-' + secrets.token_hex(4) + '.sqlite'
        target = os.path.join(self.backups_dir, file)
        if os.path.lexists(target):
            raise LocalStoreError('backup-already-exists', 409)
        try:
            # VACUUM INTO is SQLite's consistent snapshot, including committed WAL data.
            self.db.execute('VACUUM INTO ?', (target,))
            check = _read_only(target)
            try:
                if not _quick_check_ok(check):
                    raise RuntimeError('integrity')
            finally:
                check.close()
        except Exception:
            try:
                if os.path.lexists(target):
                    os.unlink(target)
            except Exception:
                pass
            raise LocalStoreError('backup-failed', 503)
        return next((row for row in self.backups() if row['file'] == file), None)

    def backup(self):
        return self._snapshot_backup()

    def _daily_backup(self):
        if self.read()['revision'] == 0 and self._count() == 0:
            return
        file = 'daily-' + self._timestamp()[:10] + '.sqlite'
        if not any(item['file'] == file for item in self.backups()):
            self._snapshot_backup('daily')
        for item in [item for item in self.backups() if item['kind'] == 'daily'][14:]:
            os.unlink(os.path.join(self.backups_dir, item['file']))

    def _archive(self, records, stamp):
        for record in records:
            text = dump_json(stable(record))
            old = self.db.execute('SELECT record_json FROM assessments WHERE record_id=?', (record['recordId'],)).fetchone()
            if old is not None:
                if old['record_json'] != text:
                    raise LocalStoreError('assessment-id-conflict', 409)
                continue
            saved_at = record.get('savedAt') if isinstance(record.get('savedAt'), str) else None
            self.db.execute('INSERT INTO assessments(record_id,study_id,record_json,saved_at,archived_at) VALUES(?,?,?,?,?)',
                            (record['recordId'], record['input']['studyId'], text, saved_at, stamp))

    def save(self, expected_revision=None, snapshot=None):
        self._require_open()
        expected = checked_revision(expected_revision)
        text = encode_snapshot(snapshot)
        current = self.read()
        if current['revision'] != expected:
            raise LocalStoreError('workspace-conflict', 409, {'revision': current['revision']})
        self._daily_backup()
        stamp = self._timestamp()
        self.db.execute('BEGIN IMMEDIATE')
        try:
            latest = self.read()
            if latest['revision'] != expected:
                raise LocalStoreError('workspace-conflict', 409, {'revision': latest['revision']})
            self._archive(snapshot['records'], stamp)
            study = snapshot['current']['input'].get('studyId')
            self.db.execute('INSERT INTO drafts(draft_id,study_id,current_json,updated_at) VALUES(?,?,?,?) ON CONFLICT(draft_id) DO UPDATE SET '
                            'study_id=excluded.study_id,current_json=excluded.current_json,updated_at=excluded.updated_at',
                            (snapshot['current']['draftId'], js_to_string(study) if js_truthy(study) else '', dump_json(stable(snapshot['current'])), stamp))
            self.db.execute('UPDATE workspace SET revision=?,snapshot=?,updated_at=? WHERE singleton=1', (expected + 1, text, stamp))
            self.db.execute('COMMIT')
        except BaseException:
            self.db.execute('ROLLBACK')
            raise
        return self.read()

    def draft(self, draft_id=None):
        self._require_open()
        if not is_text(draft_id, 160):
            raise LocalStoreError('invalid-draft-query')
        row = self.db.execute('SELECT draft_id,study_id,current_json,updated_at FROM drafts WHERE draft_id=?', (draft_id,)).fetchone()
        if row is None:
            raise LocalStoreError('draft-not-found', 404)
        return {'draftId': row['draft_id'], 'studyId': row['study_id'], 'current': parse_json(row['current_json']), 'updatedAt': row['updated_at']}

    def patients(self):
        self._require_open()
        rows = self.db.execute("""WITH codes AS (SELECT study_id FROM assessments UNION SELECT study_id FROM drafts)
 SELECT codes.study_id AS studyId,(SELECT count(*) FROM assessments a WHERE a.study_id=codes.study_id) AS recordCount,
 (SELECT count(*) FROM drafts d WHERE d.study_id=codes.study_id) AS draftCount,
 (SELECT draft_id FROM drafts d WHERE d.study_id=codes.study_id ORDER BY updated_at DESC,draft_id DESC LIMIT 1) AS latestDraftId,
 (SELECT max(stamp) FROM (SELECT archived_at AS stamp FROM assessments a WHERE a.study_id=codes.study_id UNION ALL SELECT updated_at AS stamp FROM drafts d WHERE d.study_id=codes.study_id)) AS updatedAt
 FROM codes ORDER BY updatedAt DESC,studyId""").fetchall()
        return [dict(row) for row in rows]

    def patient(self, study_id=None, offset=0, limit=200):
        self._require_open()
        if ((study_id != '' and not is_text(study_id, 160)) or not is_js_integer(offset) or offset < 0
                or not is_js_integer(limit) or limit < 1 or limit > 200):
            raise LocalStoreError('invalid-patient-query')
        first, size = int(offset), int(limit)
        total = self.db.execute('SELECT count(*) AS count FROM assessments WHERE study_id=?', (study_id,)).fetchone()['count']
        rows = self.db.execute('SELECT record_json FROM assessments WHERE study_id=? ORDER BY archived_at DESC,record_id DESC LIMIT ? OFFSET ?', (study_id, size, first)).fetchall()
        draft_count = self.db.execute('SELECT count(*) AS count FROM drafts WHERE study_id=?', (study_id,)).fetchone()['count']
        latest = self.db.execute('SELECT draft_id FROM drafts WHERE study_id=? ORDER BY updated_at DESC,draft_id DESC LIMIT 1', (study_id,)).fetchone()
        draft_rows = self.db.execute('SELECT draft_id AS draftId,updated_at AS updatedAt FROM drafts WHERE study_id=? ORDER BY updated_at DESC,draft_id DESC LIMIT ? OFFSET ?', (study_id, size, first)).fetchall()
        return {'records': [parse_json(row['record_json']) for row in rows], 'total': total, 'offset': offset, 'limit': limit,
                'hasMore': first + len(rows) < total, 'draftCount': draft_count, 'drafts': [dict(row) for row in draft_rows],
                'draftsHasMore': first + len(draft_rows) < draft_count, 'latestDraft': self.draft(latest['draft_id']) if latest else None}

    def restore(self, expected_revision=None, backup_file=None):
        self._require_open()
        expected = checked_revision(expected_revision)
        current = self.read()
        if current['revision'] != expected:
            raise LocalStoreError('workspace-conflict', 409, {'revision': current['revision']})
        item = next((row for row in self.backups() if row['file'] == backup_file), None)
        if item is None:
            raise LocalStoreError('backup-not-found', 404)
        source = None
        try:
            source = _read_only(os.path.join(self.backups_dir, item['file']))
            source.row_factory = sqlite3.Row
            if not _quick_check_ok(source):
                raise RuntimeError('integrity')
            row = source.execute('SELECT revision,snapshot,updated_at FROM workspace WHERE singleton=1').fetchone()
            if row is None or not is_safe_integer(row['revision']) or row['revision'] < 0:
                raise RuntimeError('schema')
            recovered = None if row['snapshot'] is None else parse_json(row['snapshot'])
            if recovered is not None:
                encode_snapshot(recovered)
            records = source.execute('SELECT record_id,study_id,record_json,saved_at,archived_at FROM assessments').fetchall()
            for entry in records:
                record = parse_json(entry['record_json'])
                if not is_object(record) or record.get('recordId') != entry['record_id'] or _get(record.get('input'), 'studyId') != entry['study_id']:
                    raise RuntimeError('record')
                dump_json(stable(record))
            drafts = source.execute('SELECT draft_id,study_id,current_json,updated_at FROM drafts').fetchall()
            for entry in drafts:
                draft = parse_json(entry['current_json'])
                study = _get(_get(draft, 'input'), 'studyId')
                if not is_object(draft) or draft.get('draftId') != entry['draft_id'] or (js_to_string(study) if js_truthy(study) else '') != entry['study_id']:
                    raise RuntimeError('draft')
                dump_json(stable(draft))
        except Exception:
            raise LocalStoreError('invalid-or-corrupt-backup', 400)
        finally:
            try:
                if source is not None:
                    source.close()
            except Exception:
                pass
        safety_backup = self._snapshot_backup('before-restore')
        stamp = self._timestamp()
        self.db.execute('BEGIN IMMEDIATE')
        try:
            latest = self.read()
            if latest['revision'] != expected:
                raise LocalStoreError('workspace-conflict', 409, {'revision': latest['revision']})
            for entry in records:
                self._archive([parse_json(entry['record_json'])], entry['archived_at'])
            for entry in drafts:
                self.db.execute('INSERT OR IGNORE INTO drafts(draft_id,study_id,current_json,updated_at) VALUES(?,?,?,?)',
                                (entry['draft_id'], entry['study_id'], entry['current_json'], entry['updated_at']))
            self.db.execute('UPDATE workspace SET revision=?,snapshot=?,updated_at=? WHERE singleton=1',
                            (expected + 1, None if recovered is None else dump_json(stable(recovered)), stamp))
            self.db.execute('COMMIT')
        except BaseException:
            self.db.execute('ROLLBACK')
            raise
        return {**self.read(), 'safetyBackup': safety_backup}

    def location(self):
        return dict(self._location)

    def close(self):
        if not self.closed:
            self.db.close()
            self.closed = True


LOCAL_LOCATION = {'directory': 'data', 'database': 'data/nutriklinik.sqlite', 'backupDirectory': 'data/backups', 'mode': 'local-sqlite', 'available': True}
SERVER_LOCATION = {'directory': 'server', 'database': 'server', 'backupDirectory': 'server', 'mode': 'server-sqlite', 'available': True}


def open_store(root, now=None, location=None):
    return Store(root, now or (lambda: datetime.now(timezone.utc)), location or SERVER_LOCATION)
