"""Build a minimal distributable without saves, node_modules or QA fixtures."""
from pathlib import Path
import zipfile
ROOT = Path(__file__).resolve().parent.parent
dist = ROOT / 'dist'
assert (dist / 'index.html').is_file(), 'Run npm run build first'
out = ROOT / 'release' / 'AncientKingdom-browser.zip'
out.parent.mkdir(exist_ok=True)
launcher = '''@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 goto no_node
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=12)?0:1)"
if errorlevel 1 goto no_node
node server.cjs
if errorlevel 1 goto failed
exit /b 0
:no_node
echo Node.js 22.12以降が必要です。https://nodejs.org/ から導入後、再実行してください。
pause
exit /b 1
:failed
echo 起動できませんでした。上のエラーを確認してください。
pause
exit /b 1
'''
with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED) as z:
    for file in sorted(dist.rglob('*')):
        if file.is_file():
            z.write(file, file.relative_to(ROOT).as_posix())
    z.write(ROOT / 'scripts/serve-release.cjs', 'server.cjs')
    z.write(ROOT / 'docs/RELEASE_README.md', 'README.md')
    z.write(ROOT / 'THIRD_PARTY_LICENSES.txt', 'THIRD_PARTY_LICENSES.txt')
    z.writestr('Start-Game.cmd', launcher.replace('\n', '\r\n').encode('utf-8'))
with zipfile.ZipFile(out) as z:
    assert z.testzip() is None
    assert all(n.startswith('dist/') or n in {'server.cjs','README.md','THIRD_PARTY_LICENSES.txt','Start-Game.cmd'} for n in z.namelist())
    print(f'{out}: {len(z.namelist())} files, {out.stat().st_size:,} bytes')
