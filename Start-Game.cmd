@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 goto no_node
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=12)?0:1)"
if errorlevel 1 goto no_node
where npm >nul 2>&1
if errorlevel 1 goto no_node
if exist "node_modules\vite\bin\vite.js" goto start_game
echo 初回の依存ライブラリをインストールしています。
call npm install
if errorlevel 1 goto failed
:start_game
echo 古都を起動します: http://127.0.0.1:5173/
echo 終了するときは、このウィンドウで Ctrl+C を押してください。
echo このウィンドウはプレイ中そのまま開いておいてください。
call npm run dev -- --host 127.0.0.1 --port 5173 --strictPort --open
if errorlevel 1 goto failed
exit /b 0
:no_node
echo Node.js 22.12以降とnpmが必要です。Node.jsをインストール後、もう一度実行してください。
echo https://nodejs.org/
pause
exit /b 1
:failed
echo 起動できませんでした。上のエラーを確認してください。
echo ポート5173が使用中なら、すでに起動した古都を開くか、その起動ウィンドウを閉じて再実行してください。
echo このファイルは他のプロセスを停止しません。
pause
exit /b 1
