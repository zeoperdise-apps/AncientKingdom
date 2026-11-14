"""Package the built HTML5 game for itch.io, with index.html at ZIP root."""
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parent.parent
dist = ROOT / 'dist'
assert (dist / 'index.html').is_file(), 'Run npm run build first'
out = ROOT / 'release' / 'AncientKingdom-itch.zip'
out.parent.mkdir(exist_ok=True)
files = {p.relative_to(dist).as_posix(): p for p in dist.rglob('*') if p.is_file()}
assert all(name == 'index.html' or name.startswith('assets/') for name in files), files.keys()
files['THIRD_PARTY_LICENSES.txt'] = ROOT / 'THIRD_PARTY_LICENSES.txt'
with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for name, source in sorted(files.items()):
        # Stable metadata makes an unchanged build produce the same archive.
        info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, source.read_bytes())
with zipfile.ZipFile(out) as archive:
    assert archive.testzip() is None
    assert 'index.html' in archive.namelist()
    assert not any(name.startswith(('dist/', 'src/', 'original/')) for name in archive.namelist())
    print(f'{out}: {len(archive.namelist())} files, {out.stat().st_size:,} bytes')
