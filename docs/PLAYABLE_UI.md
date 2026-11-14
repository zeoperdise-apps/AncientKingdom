# プレイ可能版 UI / 描画検証

2026-11-14、Windows Chrome 156、Playwright + 実Chrome headless。`original/` は元ZIP全51ファイルと再比較し、相違なし。

## 実装

- `src/render/dungeon.ts`: 原wall.pngの正面部分を抽出したThree.js迷宮。床・天井・柱・松明・階段・宝箱・泉、通常敵/守護者の限定色ピクセル図形、原作teki.pngの白い斧騎士。低解像度最近傍表示、145ms移動補間、resize、コンテキスト喪失/復旧。
- `src/main.ts`, `src/ui/templates.ts`, `src/style.css`: 全フェーズ、初期属性、拠点、6戦闘コマンド、敵予告/弱点、記憶/忘却、持物、霧付き地図、設定、敗北救出/戦闘前チェックポイント、結末/継続、保存失敗/破損/上書き確認。キーボードとタッチ、native dialogによる移動停止/フォーカス管理、360px対応。
- `src/audio/sound.ts`, `scripts/prepare-assets.py`, `public/assets/`: 原MIDI1176音を解析したWeb Audio再生と原WAV2種。原音源と異なる音色であることをクレジットに明記。別タブ表示時は音/描画停止。
- `src/simulation/engine.ts`: 到着時に壁を向かないよう、希望方向から時計回りに開いた通路を選ぶ決定的なarrivalDirectionを追加。新規・入場・帰還・上り下りが対象。壁・位置・乱数は変更しない。

## 検証結果

`npm test`: 8テスト成功。既存の全3属性×3seed通常simulationコマンドによる全5階攻略に加え、40seedで新規/入場/帰還の方向と迷路/乱数不変、全階の上り下り方向を確認。`npm run typecheck`, `npm run build` 成功。

`scripts/playtest.cjs`: タイトルから新規/属性/拠点/探索、地図/持物/記憶、360pxを通常UIで確認。`scripts/browser-qa.cjs`: 18項目成功。詳細は `artifacts/browser-qa.json`。

通常UIで宝/泉、戦闘ショートカット/スキル画面、戦闘中保存からの再読み込み、敗北チェックポイント再開と救出、休息/購入、設定、上書き確認キャンセル、初期の開いた方向への移動を確認。白騎士PC/360px、結末/継続、モバイル調べる/記憶、WebGL喪失/復旧、初期WebGL不可、破損保存、書き込み失敗を確認。メイン検証ページの予期しないconsole/pageerror/リソース失敗はゼロ。Web Audioはrunning、1176音ロード、WAV2種デコード、再生中9ボイスを確認（耳による音色評価は未実施）。

深層/白騎士/結末は `scripts/qa-fixtures.ts` が**通常simulationコマンドのみで到達した正規snapshot**を開いて代表UIを検証した。タイトルから全5階をブラウザ通常UIだけで連続完走する独立プレイテストと、30～45分の体感バランス評価は次タスク。

テスト状態APIは `import.meta.env.DEV` かつ URL `?test=1` の明示指定時だけ。productionビルドには公開しない。ブラウザ検証スクリプトはINSPECTION.mdの既存Playwrightキャッシュを使い、依存関係の追加は行っていない。

## 代表画像

- `artifacts/title-desktop.png`: 修正後タイトル（原背景の文字なし廃墟部分を使用）
- `artifacts/camp-desktop.png`: 拠点
- `artifacts/explore-desktop.png`, `artifacts/explore-mobile.png`: 修正後入口/調べる/操作
- `artifacts/battle-desktop.png`, `artifacts/battle-skills.png`: 戦闘/スキル
- `artifacts/white-knight-desktop.png`, `artifacts/white-knight-mobile.png`: 原作白騎士（スマホで全身表示）
- `artifacts/ending-desktop.png`, `artifacts/ending-mobile.png`: 結末
- `artifacts/defeated-desktop.png`, `artifacts/webgl-fallback.png`: 敗北/初期WebGL不可

すべて直接画像を開いて視覚確認した。タイトル文字重複、モバイルHUD重なり、調べる欄の消失、敵のスマホ時はみ出しは修正済み。

## 引継ぎ

開発サーバー: `http://127.0.0.1:5173/`。起動コマンド `npm run dev -- --host 127.0.0.1`、確認時PID 55364、ツール実行session 81708。親レビュー/独立QAで再利用するため起動を維持。

既知の残作業: 独立ブラウザ全周プレイ、README、Windows起動手段。ビルドは成功するが、Three.js込みJSが約603kB（gzip約158kB）で500kB警告がある。機能上のブロッカーは今回の代表検証では見つかっていない。外部公開・commit/pushは行っていない。
