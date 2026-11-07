"""Build web/source-code.zip: the corresponding source offered by the running service (AGPL-3.0 section 13).

    python -I tools/build_source_zip.py

The archive holds the application, tests, documents and this tool. Entries are sorted and carry a fixed
timestamp, so the same tree always gives the same archive. Standard library only.
"""
# SPDX-License-Identifier: AGPL-3.0-only
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'web' / 'source-code.zip'
FILES = ('README.md', 'LICENSE', 'NOTICE', 'CITATION.cff')
TREES = ('web', 'tests', 'docs', 'tools')
SKIP_SUFFIXES = {'.zip', '.pyc'}
STAMP = (2026, 11, 7, 0, 0, 0)


def entries():
    names = [ROOT / name for name in FILES]
    for tree in TREES:
        names += [p for p in (ROOT / tree).rglob('*') if p.is_file()]
    keep = [p for p in names if p.suffix not in SKIP_SUFFIXES and '__pycache__' not in p.parts]
    return sorted(keep, key=lambda p: p.relative_to(ROOT).as_posix())


def main():
    files = entries()
    with zipfile.ZipFile(OUT, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in files:
            info = zipfile.ZipInfo('nutriclinic/' + path.relative_to(ROOT).as_posix(), STAMP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, path.read_bytes())
    print('%s: %d files, %d bytes' % (OUT.name, len(files), OUT.stat().st_size))
    return 0


if __name__ == '__main__':
    sys.exit(main())
