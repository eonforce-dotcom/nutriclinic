"""Build dist/source-code.zip: the AGPLv3 corresponding source of the hosted NutriClinic.

    python hosted/build_source_zip.py

Contents: the browser application exactly as served (edition.mjs set to the
server edition), the Python record service and its local test server, the test
suites, and the license/notice/citation files. Server deployment scripts and
host-specific notes are not part of the program and are left out. The archive
is reproducible: fixed timestamps, sorted names.
"""
import hashlib
import os
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist' / 'source-code.zip'
STAMP = (2026, 11, 4, 0, 0, 0)
PREFIX = 'NutriClinic-source/'
README = """# NutriClinic: corresponding source

Copyright (C) 2026 Gökay Duman (Dr. Gökay Duman · Neurology).
License: GNU Affero General Public License v3.0 only (AGPL-3.0-only); see LICENSE and NOTICE.
Third-party: Mozilla PDF.js (Apache-2.0), see dist/legal/THIRD-PARTY-NOTICES.txt.
Live service: https://sahnoroloji.org/nutriclinic/

## Layout
- dist/            browser application exactly as served (edition.mjs = 'server').
                   For the desktop edition set EDITION = 'local' in dist/edition.mjs.
- hosted/          Python record service (standard library only; runs under gunicorn behind nginx)
                   nutriclinic_api.py   HTTP API, guest mode, full-access read-only guest views
                   nutriclinic_store.py SQLite storage, backups, restore
                   dev_server.py        local test server: python hosted/dev_server.py <empty-dir> 4210 --guest
                   tests/               python -m unittest discover -s hosted/tests
- tests/           browser-module tests: node --test tests/*.test.mjs (no npm packages needed)

## Hosted setup in short
nginx serves dist/ at /nutriclinic/ (open, guest mode) and /nutriclinic/tam/ (HTTP basic auth),
proxies /nutriclinic/api/local/ and /nutriclinic/tam/api/local/ to the record service, clears
X-Remote-User on the open path and sets it from basic auth on /tam/. Environment:
NUTRICLINIC_DATA_ROOT, NUTRICLINIC_PATH_PREFIX=/nutriclinic, NUTRICLINIC_GUEST_MODE=1,
NUTRICLINIC_FULL_PREFIX=/nutriclinic/tam, NUTRICLINIC_ALLOWED_HOSTS.
Optional: nginx may set a readable cookie nc_ulke=<country code> (for example from Cloudflare's
CF-IPCountry) so that visitors from Turkey open the Turkish interface.

## Clinical use
Research version that supports clinical decisions and does not replace them; the clinical team reviews every result, with its inputs and sources, before use.
No patient data, credentials or server secrets are included in this archive.
"""


def files():
    for path in sorted((ROOT / 'dist').rglob('*')):
        if path.is_file() and path != OUT:
            yield path, 'dist/' + path.relative_to(ROOT / 'dist').as_posix()
    for name in ('nutriclinic_api.py', 'nutriclinic_store.py', 'dev_server.py', 'build_source_zip.py'):
        yield ROOT / 'hosted' / name, 'hosted/' + name
    # Off-server backup and desktop-parity tests depend on files outside this program.
    for name in ('test_api.py', 'test_store.py', 'test_guest_mode.py'):
        yield ROOT / 'hosted' / 'tests' / name, 'hosted/tests/' + name
    for path in sorted((ROOT / 'tests').rglob('*')):
        if path.is_file() and '__pycache__' not in path.parts:
            yield path, 'tests/' + path.relative_to(ROOT / 'tests').as_posix()
    for name in ('LICENSE', 'NOTICE', 'CITATION.cff', 'package.json'):
        yield ROOT / name, name


def main():
    entries = []
    for path, name in files():
        data = path.read_bytes()
        if name == 'dist/edition.mjs':
            local = b"export const EDITION = 'local';"
            if data.count(local) != 1:
                sys.exit('edition.mjs layout changed')
            data = data.replace(local, b"export const EDITION = 'server';")
        entries.append((name, data))
    entries.append(('SOURCE-README.md', README.encode('utf-8')))
    entries.sort()
    temporary = OUT.with_suffix('.zip.tmp')
    with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in entries:
            info = zipfile.ZipInfo(PREFIX + name, STAMP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, data)
    os.replace(temporary, OUT)
    digest = hashlib.sha256(OUT.read_bytes()).hexdigest()
    print('%s  %d files  %d bytes  sha256 %s' % (OUT.name, len(entries), OUT.stat().st_size, digest))


if __name__ == '__main__':
    main()
