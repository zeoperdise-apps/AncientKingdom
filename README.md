# 古都 ～Ancient Kingdom～

Studio Arkの2007年携帯Java試作を、Three.js / TypeScript / Web Audioで遊べるブラウザRPGに仕上げたものです。原作の茶褐色の壁、白い斧騎士、原曲と四方向探索を継承。全5階を探索し、三つの王印、白騎士、忘却の王を越えて結末へ進みます。

## 起動

Node.js **22.12以降**とnpmが必要です。Windowsでは `Start-Game.cmd` をダブルクリックすると、初回の依存導入後、ブラウザが開きます。サーバーのウィンドウはプレイ中開いたままにし、終了は Ctrl+C。日本語や空白を含むフォルダーに対応しています。

ターミナルから起動する場合:

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

`http://127.0.0.1:5173/` を開きます。ビルドと確認は以下です。

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 5173 --strictPort
```

ポート5173が使用中なら、起動済みのゲームを開くか、自分で開始したサーバーを終了してください。起動スクリプトは既存プロセスを停止しません。配布版は `release/AncientKingdom-browser.zip` をすべて展開し、同梱の `Start-Game.cmd` で起動できます（依存導入不要）。`file://` でHTMLを直接開く方法は使用できません。

## 遊び方

W/↑ 前進、S/↓ 後退、A/D/←/→ 回転、E/Enter/Space 調べる。M 地図、K 記憶、I 持物、Esc 設定/閉じる。画面のタッチボタンでも操作できます。戦闘は1攻撃・2防御・3スキル・4回復薬・5魔力薬・6逃走。大技の予告には防御、属性の反対は弱点です。聖のスキルは回復用。階段・宝箱・泉は同じマスで調べます。

記憶は探索中/拠点で何度でも整理できます。帰還糸で拠点へ戻ると全回復し、最低1本を補給。無料休息・薬購入・武器強化で準備できます。戦闘不能でも成長と王印を維持して救出、または戦闘前から再開できます。

自動保存はブラウザのlocalStorage（`ancient-kingdom.save.v1`、戦闘前 `ancient-kingdom.checkpoint.v1`）。戦闘中も「冒険の続きを辿る」で再開できます。同じブラウザ・URLを使ってください。**hostやportが変わると保存場所が別になります**。ブラウザデータを消すと保存も消えます。新規開始は上書き確認があります。

## 原作と追加要素・クレジット

原作 **Studio Ark · 2007**。作品名、画像3点（wall.png / title.png / teki.png）、原曲cave.mid、crash.wav/step.wav、四方向探索、属性とスキルメモリーの構想を継承しています。原曲1176音をWeb Audioのシンセで再生するため、元MIDI音源とは音色が異なります。原作は `original/` に変更せず保存しています。

Gitには原作のJavaソース、設定資料、正本の `res/`、既存配布の `deployed/` を収録します。原作内の `.gitignore` に従い、重複素材とコンパイル済みクラスを含む `bin/` は追跡しません。制作環境では元ZIPの全51ファイルを保管しています。

物語、全5階の進行/結末、戦闘/成長/保存と数値、コードで描いた追加の敵・迷宮はブラウザ版（2026）の新設です。原作素材の権利は原作者に帰属し、この制作で新たな利用許諾を付与するものではありません。Three.jsのMIT Licenseは `THIRD_PARTY_LICENSES.txt` を参照してください。

## 検証と構成

```sh
npm test
npm run typecheck
npm run qa:representative
npm run qa:full
```

ブラウザ検証にはChromeと、別ターミナルで起動した5173サーバーが必要です。`qa:representative` は正規simulation操作で作った代表状態を使用、`qa:full` は新規から通常クリック/キーボードだけで全5階を連続攻略します。B1は未踏の壁/イベント位置を参照しない探索です。テストは一時的な別ブラウザプロファイルを使い、普段の保存を変更しません。配布作成は `npm run release`。結果と制約は [docs/QA_REPORT.md](docs/QA_REPORT.md)、設計は [DESIGN.md](DESIGN.md)、原作調査は [INSPECTION.md](INSPECTION.md)。

`artifacts/` の検証出力・fixtureと `release/` のZIPは生成物のためGitには含めません。fixtureを使うnpm検証コマンドは実行時に `qa:fixtures` から再作成します。`qa:visual` と `qa:walls` は開発サーバーが必要です。別ポートを使う場合は環境変数 `QA_URL` に末尾 `/` 付きのURLを指定してください。配布作成にはPython 3も必要です。

`src/simulation/` は独立したルール、`src/render/` はThree.js迷宮、`src/ui/` は画面、`src/audio/` は音、`public/assets/` は素材です。Safari/Firefox・スマートフォン実機・耳による音色評価、初見プレイヤーの30〜45分という所要時間は未確認です。
