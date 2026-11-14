# 最終プレイテスト・配布記録

追記: 側壁/横道の見え方へのユーザー指摘に対応した後続修正と最新の配布サーバー情報は [WALL_RENDER_REVIEW.md](WALL_RENDER_REVIEW.md) を参照。以下の全周記録はその前の版であり、後続修正では限定回帰を実施した。

2026-11-14、Windows / Node.js 24.19 / Chrome 156、Playwright Core。`game-playtest` の手順で画面操作・画像・ルールを検証した。

## 結果

新規開始→聖泉属性→拠点→全5階→三王印→B4白い斧騎士→B5忘却の王→結末→探索継続を、**通常のボタンクリック/キーボードだけ**で連続完走した。最終走行はseed `3645893902`、**314歩、19戦（18勝/1逃走）、LV12、宝箱5/5、救出0**。途中の状態load/command API、fixture挿入、localStorageの書換、seed固定は使っていない。保存の読み取りのみ使用した。

B1は未探索セルの壁と未発見イベントの位置を経路データから除去し、探索済みセルの壁から未踏の隣接セルへ進む方式で36/36セルを探索した。B2以降は保存内の地図を経路選択に参照した。戦闘判断は表示HP/MP・予告・記憶スキルと公開データに従う。30〜45分という人間の初見所要時間の検証ではない。

同じ連続走行で地図/持物/記憶、属性選択、忘却/記憶、水/土/火/風/闇の攻撃、聖の回復、回復薬/魔力薬、防御、逃走、戦闘中reload→タイトルの続き、帰還糸、拠点休息/武器強化/薬購入、階段の下り/上り/再下り、結末後の継続を確認。詳細は `artifacts/full-playthrough.json` と `scripts/full-playthrough.cjs`。

全周の進行/薬使用assertは通過したが、runnerの末尾通信assertは開発用Three.js取得の **`net::ERR_ABORTED` 1件**により非ゼロ終了した。開発中にファイル/依存メタデータを変更した走行であり、取消の正確な原因は未断定。原記録の `success:false` とエラーを残し、`progressionSuccess:true` と注記を併記した。JS例外/console error/実HTTPエラーは0。最終配布ZIPからのproduction smokeでは通信取消も含め全エラー0だった。追加の全周は実施していない。先行走行も272歩/17戦で結末へ到達したが、魔力薬使用の網羅assertが未達だったため最終走行を実施した。

## 修正と画像

- 階段の金色支柱が視界を覆う: 階段を閉じた壁側の奥へ配置し、枠を細く暗くした。通路の装飾柱も壁際へ寄せ、入口/出口には置かない。原作壁の暖色と質感は維持。
- 階層間snap後に古い位置から再補間する: start位置/角度も到着値へ揃えた。実ブラウザでsnap直後と2フレーム後のカメラ位置が一致した。
- タイトル/拠点/モーダルで不要なWebGL描画: 非アクティブ時のrenderを停止。90ms観測でrender呼出0を確認。通常の非表示タブ/context-loss停止も維持。
- 360pxでは通路が横の画面外へ隠れる: 縦画面の水平視野を確保し、敵の見かけの大きさを補正。
- 780×360で下部操作が画面外: 短い横画面用の配置を追加。移動ボタン全4個がviewport内、横スクロールなしを確認。
- 結末の長い重複通知が見出しを覆う: 結末へ移行した際の通知を消去。

次の画像を実際に開いて確認した（代表画像はfixtureを使う限定検証。全周画像と区別する）。

| 状態 | 証拠 |
| --- | --- |
| 修正後入口・PC/360px/横画面 | `artifacts/final-entrance-desktop.png` / `final-entrance-mobile.png` / `final-landscape.png` |
| 6セルの直線通路・PC/360px、交差路 | `artifacts/final-long-corridor-desktop.png` / `final-long-corridor-mobile.png` / `final-junction.png` |
| 泉・階段へ接近した視界 | `artifacts/final-fountain-approach.png` / `final-stairs-approach.png` |
| 全周中の白騎士PC/360px | `artifacts/full-white-knight-desktop.png` / `full-white-knight-mobile.png` |
| 全周中の結末PC/360px | `artifacts/full-ending-desktop.png` / `full-ending-mobile.png` |

## 回帰・配布確認

- `npm test`: 8/8成功。40seed×5階の連結/壁/イベント、全3属性×3seed攻略、保存/戦闘/無効操作/記憶/階段/拠点を含む。
- `npm run typecheck` / 最終`npm run build`: 成功。JS約606kB（gzip約159kB）の500kB警告は残る。
- `npm run qa:representative`: 18項目成功、console/pageerror/HTTP/request失敗0。敗北チェックポイント/救出、保存破損/書込失敗、WebGL初期不可/喪失復旧、音設定/上書き確認/モーダルフォーカスも確認。`artifacts/browser-qa.json`。
- `npm run qa:visual`: snapと描画停止、修正画像、横画面ボタンを確認。`artifacts/visual-qa.json`。
- `playwright-core` をdevDependency化し、既存QAのユーザー固有npmキャッシュ絶対パスを除去。Chromeがインストールされた環境でnpm scriptsから再現可能。
- 配布ZIPを `artifacts/配布 起動テスト/` へ展開。同梱 `Start-Game.cmd` からNode組込serverを実起動し、productionのタイトル/新規/疾風属性/拠点/探索/移動/地図/保存reload続き/360pxを確認。開発用状態変更APIが存在しないことも確認。console/pageerror/HTTP/request失敗0。`artifacts/production-smoke.json`。
- ソース側 `Start-Game.cmd` も実在の日本語/空白パスから起動し、所有サーバーとの5173競合を正しく表示して他プロセスを停止しないことを確認。初回依存導入は `npm install` 成功。Node未導入端末・まっさらなWindowsへの導入は未実機検証。
- ユーザー提供の原ZIP `AncientKingdom.zip` のSHA-256は `4c2546ff04d16223997fa3f0929001ada15261e964ed36aff4ea74089eae89b0`。**全51ファイルをoriginal/と最終バイト比較、相違0**。`artifacts/original-integrity.json`。

配布物: **`release/AncientKingdom-browser.zip`**、15ファイル、238,788 bytes。dist一式、Node標準機能だけのserver、Windows起動、README、Three.jsのMIT表記を含む。node_modules・テスト状態・ユーザーセーブ・機密は含めない。ZIP内容と起動中の展開ファイルも全15件バイト一致。原作素材に新しい利用許諾は付与していない。外部公開/remote pushなし。

## 最終サーバーと未検証

所有Vite PID55364を識別後に終了し、**配布版を `http://127.0.0.1:5173/` で維持**。PID **60184**、ツールsession **2819**。HTTP 200確認。起動コマンドは `node "artifacts/配布 起動テスト/server.cjs" --no-open`。検証用4173サーバーは終了した。止める場合はこの起動セッションでCtrl+C。再起動は配布ZIPを展開して `Start-Game.cmd`。同じhost/portのためブラウザの保存場所も維持される。

耳による音色評価、Safari/Firefox、実機スマートフォン、初見プレイヤーの所要時間/長時間の体感バランスは未確認。Web Audioはrunning、原曲1176音・原WAV2種のロード/再生を確認済み。重大な進行阻害は観測していない。
