# itch.io 公開準備

## 再生成

```sh
npm run release:itch
npm run qa:itch
```

`release:itch` は型検査とViteビルド後、`release/AncientKingdom-itch.zip` を生成する。ZIP直下は `index.html`、`assets/`、`THIRD_PARTY_LICENSES.txt` のみ。Nodeサーバー、起動バッチ、原作、原ソース、セーブ、QA状態は含めない。既存のローカル配布版は `npm run release` で別途生成する。

`qa:itch` は実ZIPを `artifacts/itch-runtime/` に展開し、自分で開いたランダムポートのローカルHTTPサーバーでサブディレクトリ配信する。別ポートの親ページからsandbox付きクロスオリジンiframeへ埋め込み、一時Chrome contextで検証する。通常のChromeプロファイルや5173の既存サーバーは変更しない。終了時は所有するサーバーを閉じる。

## 掲載設定

| 項目 | 値 |
| --- | --- |
| タイトル | 古都 ～Ancient Kingdom～ |
| URL候補 | ancient-kingdom（アカウント内の未使用確認が必要） |
| Short description | 記憶を紡ぎ、滅びた王国の地下へ。全5階の一人称ダンジョンRPG。 |
| Classification | Games |
| Kind of project | HTML |
| Pricing | No payments（無料、寄付なし） |
| Release status | Released |
| Genre | Role Playing |
| Language | Japanese |
| Tags候補 | dungeon-crawler, retro, turn-based, first-person, fantasy, singleplayer |
| Browser表示 | Embed in page / 手動サイズ960×600 / fullscreenボタン有効 |
| Mobile friendly | 実機未検証のためチェックしない |

アップロードしたZIPを「This file will be played in the browser」に設定する。起動前のclick-to-playを有効にする。本文は `docs/ITCH_PAGE.md`。ユーザーの公開依頼はあるが、この準備タスクでは外部フォームの作成・保存・送信を行っていない。

## 画像

すべて `release/itch-media/` に生成する。

| ファイル | 用途 |
| --- | --- |
| cover-630x500.png | cover、630×500。実ゲームのタイトル画面を掲載用サイズに整えて撮影 |
| 01-title.png | タイトル、1440×900 |
| 02-dungeon.png | B1の分岐、1440×900 |
| 03-battle.png | B4の白い斧騎士との戦闘、1440×900 |

スクリーンショットは実ZIPの表示。迷宮・戦闘は通常のsimulation操作から生成し、検証済みセーブ形式を通して読み込んだ代表状態。coverは撮影用DOMスタイルのみ調整し、素材画像の編集や新規外部アートは使用していない。

## 検証記録

`artifacts/itch-qa.json` に検証結果、`artifacts/itch-960x600.png` などに埋込サイズ別の画面を保存する。サブパス起動、画像、MIDIノート再生、WAVデコードと再生開始、自動保存・再開、地図、設定、960×600 / 360×780 / 844×390 のWebGL表示と戦闘ボタンの収まり、通常ルート配信、開発用API不在を確認する。

実itch.ioへのアップロード後は別途、draftのプレビューで起動・音・保存・全画面を確認し、ページ設定と画像を確認してからPublicへ変更する。現段階ではitch.ioログイン状態・アカウント名・slug未使用を確認できていない。ブラウザツールが現在URLを安全に確定できず停止したため、既存ログイン情報にはアクセスしていない。公開担当はUIを新しく取得する必要がある。

Safari/Firefox、スマートフォン実機、耳による音色評価は未検証。ローカルの別ポートによるクロスオリジンiframe検証は、itch.ioの実際の配信ホストやサードパーティ保存ポリシーを完全には再現しない。
