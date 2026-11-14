# Ancient Kingdom 原作調査

調査日: 2026-11-14（日本時間）。この段階では調査と原作の安全な展開のみを実施。ブラウザ版の実装・依存導入・元Javaコードの変更は行っていない。

## 結論

元作品は「古都 ～Ancient Kingdom～」という2007年制作の携帯Java（J2ME/MIDP）ダンジョン探索試作。完成済み部分は、自動生成迷路、グリッド移動、画像合成による疑似3D、2D全体地図、下り階段、タイトル、音声。RPGの戦闘・キャラクター成長・装備・スキル・セーブ・クリア条件はまだ存在しない。

Three.js版は既存Web実装の改修ではなく、原作の設計・素材・操作感を継承する新規移植となる。元の名称、茶褐色レンガの暗い回廊、直交4方向の歩行、白い斧騎士素材、属性3軸とスキルメモリー制の構想が継承の中心。

## 指示・保存・Git

- 作業ルート: このリポジトリのルート。
- ドライブのルートから作業ルートまでの各親階層と、展開した原作内を確認した範囲では適用対象の `AGENTS.md` は存在しない。
- 調査開始時のルートは `.git/` と `AncientKingdom.code-workspace` のみ。既存ゲームコードはなかった。
- Git: ブランチ `main`、コミットなし、上流表示 `origin/main [gone]`。remote は `git@github.com:zeoperdise-apps/AncientKingdom.git`。ユーザーのワークスペースファイルは元から未追跡。コミット・pushは行っていない。
- 原ZIP: ユーザー提供の `AncientKingdom.zip`（245,415 bytes、最終更新 2026-11-13 17:33:26）。
- ZIP SHA-256: `4C2546FF04D16223997FA3F0929001ADA15261E964ED36AFF4EA74089EAE89B0`
- ZIP内パスが展開先配下に収まること、展開先が未作成で上書きが発生しないことを確認し、`original/AncientKingdom/` に展開した。65 entries、51 files、展開ファイル合計315,151 bytes。
- 展開後、ZIPの全51ファイルと展開ファイルをバイト比較し、相違ゼロを確認した。元ZIP・元コードは変更していない。
- ZIP内の変更履歴・設定資料は作品の参考資料として読んだ。エージェントへの指示や実行権限として扱っていない。

## 現時点のルート構成

```text
AncientKingdom/
├─ .git/                           既存Git管理情報
├─ AncientKingdom.code-workspace   既存VS Codeワークスペース
├─ INSPECTION.md                   本調査報告（追加）
└─ original/                       原ZIPの保存用展開先（追加）
   └─ AncientKingdom/
      ├─ .classpath
      ├─ .eclipseme
      ├─ .gitignore                内容は /bin
      ├─ .project
      ├─ .settings/
      │  ├─ org.eclipse.core.resources.prefs
      │  └─ org.eclipse.ltk.core.refactoring.prefs
      ├─ AncientKingdom.jad        ソース側: v0.0.6
      ├─ 変更履歴.txt
      ├─ 設定資料.txt
      ├─ src/net/ark/ancientkingdom/
      │  ├─ AncientKingdom.java
      │  ├─ AncientKingdomCanvas.java
      │  ├─ Config.java
      │  ├─ Dungeon.java
      │  ├─ DungeonEvent.java
      │  ├─ DungeonWall.java
      │  ├─ Global.java
      │  ├─ Literal.java
      │  ├─ Music.java
      │  ├─ Position.java
      │  └─ screen/
      │     ├─ ScreenBace.java
      │     ├─ ScreenDungeon.java
      │     ├─ ScreenLoading.java
      │     └─ ScreenTitle.java
      ├─ res/                      原作素材の正本として使える
      │  ├─ cave.mid
      │  ├─ crash.wav
      │  ├─ step.wav
      │  ├─ teki.png
      │  ├─ title.png
      │  └─ wall.png
      ├─ bin/                      上記6素材の同一コピー + 14クラス
      │  └─ net/ark/ancientkingdom/ （srcと同じクラス階層）
      └─ deployed/
         ├─ AncientKingdom.jad     配布版: v0.0.5
         └─ AncientKingdom.jar     94,875 bytes、配布版: v0.0.5
```

ルートに `package.json`、HTML、TypeScript、JavaScript、Webビルド設定、README、テストはない。Javaソースは14ファイル。

## 原作の実装と操作

| 項目 | 実体・挙動 |
| --- | --- |
| 言語・実行環境 | Java、CLDC 1.1 / MIDP 2.0、`javax.microedition.*`。ブラウザJavaScriptではない |
| 元開発環境 | EclipseME 1.7.9、J2ME Wireless Toolkit 2.2、デバイス設定 `auOAP`、ユーザーライブラリ `WTK22` |
| 起動 | `AncientKingdom` MIDlet → `AncientKingdomCanvas` → Loading → Title → Dungeon |
| 更新周期 | `Config.sleepTimeOfFlame = 100ms`、約10FPS。押下イベントをVectorに蓄積し、1フレーム1入力処理 |
| 画面 | 240×268。疑似3Dの壁表示は上部240×160、下部は白地に小さい文字とデバッグ情報 |
| タイトル操作 | センターキー（キーコード -5）で探索開始 |
| 探索操作 | 上（-1）で前進、下（-2）で後退。左（-3）・右（-4）は90度旋回。横移動・自由視点・滑らかなカメラ補間はない |
| 地図 | センターキーで3D/2D切替。2Dは12px/マスの全体地図。シアン `0x00FFFF` の床、黒い壁と現在地矢印。未踏域も最初から見える |
| 初期値 | floor=0、8×8マス、座標(0,0)、北向き。向きのbit値は北1・東2・南4・西8 |
| 迷路生成 | `Dungeon.java:44`、各マスに4方向壁bitを保持するランダムな深さ優先探索/バックトラック型生成。乱数は時刻seed、再現用seed入力はない |
| 衝突 | `Dungeon.java:192`、向いている壁bitで進行可否を判定し、衝突音を再生 |
| 疑似3D | `DungeonWall.java` がwall.pngを20枚（横5列×縦4状態）に切り、近傍セルの壁を調べて5本の縦長帯を描画。Three.js等の3Dエンジンは不使用 |
| 階段 | ランダムな行き止まりに下り階段を1個設置。踏むと即時遷移し、floorを1減、縦横サイズを1増して再生成 |
| 音 | 洞窟MIDI無限ループ、壁衝突WAV、階段昇降WAV。通常歩行でstep.wavは鳴らない |

操作感は「1回押すごとに1マス/90度」の古典的ダンジョン方式。元作品の維持には、グリッド上の位置・向きをルール側で確定し、描画側だけ短い補間を加える設計が合う。元作品自体をエミュレーターでプレイしたわけではなく、挙動はJavaソースから確認した。

## 固有の雰囲気と資料の内容

- 正式表記: `古都 ～Ancient Kingdom～`。英語MIDlet名は `Ancient Kingdom`、Vendorは `Studio Ark`。
- `title.png` は暗い廃墟の長い廊下を写真調に減色したもの。左上に薄い灰色の「古都」、その下に `Ancient Kingdom`、下端に2007年のStudio Ark著作権表記がある。
- `wall.png` は茶褐色/黄土色の細かなレンガと、遠方の黒い暗がり。天井・床もレンガ状で、彩度を抑えた閉塞感のある画面。
- `teki.png` は大きな斧、兜、盾またはマント状の面を持つ、白/黒の線画騎士。ソースからは一切参照されず、敵としての固有名や数値は未設定。
- 変更履歴は2007-09-17 v0.0.1から2007-11-25 v0.0.6まで。v0.0.6欄には内容が書かれていない。Eclipse設定のタイムスタンプには2012年のものもある。
- `設定資料.txt` の構想は以下のみ。属性は火↔水、風↔土、聖↔闇の3つの対立軸。キャラクターは生まれつき属性の3次元ベクトルを持ち、近い属性のスキルほど習得しやすい。スキルごとにメモリー使用量があり、最大メモリーを超えて習得できない。
- 属性値の範囲、属性相性の倍率、習得率、最大メモリー値、スキル名・コスト、敵名・能力、物語・王国名・勝利目標は資料に存在しない。これらを実装する際は新規設計であると区別する。

## 再利用可能な素材

以下はすべて `original/AncientKingdom/res/` に存在し、`bin/` の同名ファイルとバイト一致する。3枚の画像は直接表示して内容を確認済み。

| ファイル | 実体 | 移植上の扱い |
| --- | --- | --- |
| `title.png` | 240×268、15,355 bytes、インデックスカラーPNG。タイトル入り廃墟画像 | 原作タイトルやクレジットの継承に利用。拡大時はピクセル感を維持し、UI文字はDOMで読みやすく追加できる |
| `wall.png` | 240×640、26,776 bytes、インデックスカラーPNG | 疑似3D投影済みアトラスなので全体を通常の3D壁へ反復貼りすると歪む。正面レンガ部分（下段、y=480〜639）を切り出して壁テクスチャにする等の加工が必要。原ファイルは保存する |
| `teki.png` | 200×234、9,168 bytes、RGBA PNG（透明背景あり） | 原作騎士のbillboard/戦闘スプライトに適する。アニメーションはない |
| `crash.wav` | 404 bytes、PCM unsigned 8bit、mono 8kHz、360 frames、0.045秒 | ブラウザで使う短い壁衝突音。実際のHTML Audio/Web Audioでデコード検証を行う |
| `step.wav` | 3,524 bytes、PCM unsigned 8bit、stereo 22.05kHz、1,696 frames、約0.0769秒 | 原作では階段で4回ループ再生。通常歩行音と誤認しない |
| `cave.mid` | 11,374 bytes、Standard MIDI format 1、9tracks、480 ticks/quarter、tempo=600,000µs（100BPM）、名目153.75秒 | MIDIをHTML Audioだけで直接使う設計は避け、MIDIイベントをWeb Audioで鳴らすか、音源付きで音声へ変換。素材の旋律を継承する選択肢 |

wall.pngの分割幅は左から30/48/84/48/30px、各段160px。第0段は奥の暗い背景、第1・2段は遠近の側壁、第3段は近接した正面レンガ。Three.jsでは平面壁と床/天井の単純ジオメトリで再構成でき、重い3Dモデル生成は必須ではない。

MIDIには7本の有音トラックがあり、合計1,176回のnote-on。program番号（0始まり）は78が2トラック、27が4トラック、35が1トラック。曲名メタデータは `Untitled`。新規外部音源なしの軽量Web Audioシンセで再現する場合、原音と音色が異なることは設計上認識しておく。

## 重大な不足・不具合

1. **ゲームの完了がない。** 下り続ける探索試作で、勝利、敗北、敵、HP/MP、アイテム、成長、スキル、報酬がない。完成版には明確な攻略目標と終端が必要。
2. **階段が視覚化されない。** `DungeonWall.draw` と `Dungeon.drawSub2DMap` は壁だけを描き、イベントを描かない。階段を踏んだフレームで文字が出て即再生成される。
3. **階層が保存されず帰還できない。** `DungeonEvent.java:62` で上り階段配置がコメントアウト。階移動は旧階を破棄して再生成する。`EVENT_DOWN_KEY` は定数だけで処理なし。
4. **移動後の階層入口がない。** `ScreenDungeon.java:106`以降で階変更してもpositionを変更しない。新フロアでも旧座標に置かれ、偶然その座標が下り階段なら無入力で連続遷移しうる。上り階段を単純に有効化すると、縮んだマップで座標範囲外になりうる。
5. **永続化がない。** 乱数seedや探索履歴、フロア、ゲーム状態は保存されない。ブラウザ移植ではlocalStorage等にversion付きのシリアライズ可能な状態を保存する必要がある。
6. **ブラウザ用の基盤がない。** J2ME APIとMIDletをブラウザで直接実行することはできず、入力・描画・音・ライフサイクルを移植する必要がある。
7. **配布物とソースが不一致。** ソース側JADはv0.0.6、deployed側JAD/JAR manifestはv0.0.5。JAR内の14classはbin側classとすべてバイト不一致（差分の原因までは未解析）。仕様把握はソースと資料を優先した。
8. **安定性処理が弱い。** メインループ全体が単一例外catchで、例外後の復旧UIはない。無限ループをpause/destroyで終了しない。音源ロード失敗時のcatchで誤ってmidiArray[index]を参照する箇所があり、2番目WAVの失敗時に別の範囲外例外が出うる。
9. **現代の画面・入力未対応。** 240px固定の座標、キーボードコード直書き、タッチ・リサイズ・設定・ミュート・アクセシブルなDOMなし。2D表示はサイズ増加で画面からはみ出す。

迷路生成の全seedでの連結性や階段配置率はこの調査では実行検証していない。移植時は独立したsimulationテストで確認すべき。

## ローカル環境と起動・検証手段

確認済み:

- Windows / PowerShell、Node.js `v24.19.0`、npm `11.17.0`、Python `3.14.6`、Gitあり。
- `java` / `javac` / `emulator` はPATH上で見つからなかった。元EclipseME/WTK22の導入は確認できず、Java携帯版を直接起動していない。
- Chrome: `C:\Program Files\Google\Chrome\Application\chrome.exe`、Edge: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`。
- キャッシュ済みPlaywrightブラウザあり（Chromium 1194/1234、headless shell、Firefox、WebKit）。
- 調査時はユーザーのnpmキャッシュに既存の `playwright-core` モジュールがあった。完成版ではプロジェクトのdevDependencyから使用する。
- このplaywright-coreを絶対パスでrequireし、`chromium.launch({headless:true, channel:'chrome'})` で一時ブラウザを起動・終了できた。1280×720ページでWebGL2作成成功、Chrome 156、maxTextureSize=16384。追加インストールなし。
- 作業ルートから `three`、`vite`、`typescript`、`playwright`、`@playwright/test`、`playwright-core` の通常requireはすべて未解決。グローバルにesbuildはあるが、ブラウザ版依存はまだ導入していない。

原作の想定起動はWTK22/MIDP対応エミュレーターでdeployedのJAD/JARをロードする方式。Web完成版の推奨起動はルートにVite + TypeScript + Three.jsを新設し、`npm install` → `npm run dev -- --host 127.0.0.1`。これは予定であり、現時点でそのコマンドを実行できるプロジェクトはまだ存在しない。

## 次の設計・実装タスク候補（親エージェントの判断用）

1. **完成範囲の設計:** 原作の属性3軸・スキルメモリーをゲームの特色として具体化する。有限の階層、探索/戦闘/回復/成長の循環、最終目標、敗北からの再開、1回のプレイ時間を決める。未設定の固有名・数値は新規仕様として文書化する。
2. **Web基盤:** Vite + TS + Three.jsをルートに構築。`original/`を原資料として保持。`simulation/`（ルール/生成/状態）、`render/`（Three.js/カメラ/補間）、`ui/`（DOM）、`audio/`、`data/`、`tests/`の責務を分ける。
3. **探索基盤:** 再現seed付き迷路、連結性/壁対称性、到達可能な階段と宝、保存するフロア構造、入口の安全配置、4方向移動と旋回。WebGL表示は原作色の暗いレンガ、近距離の視認性、短い移動補間を両立。
4. **素材再利用:** 元のタイトル/騎士/壁をweb assetsへ複製して用途に合わせて加工。原PNGは保存。原WAVの再生とMIDIの音声方式を決め、開始操作後にAudioContextを有効化する。
5. **RPGルール:** 敵遭遇とターン戦闘、攻撃/防御/スキル/逃走、属性相性、メモリー枠、経験値/成長、消耗品、装備または報酬、ボス、エンディング。盤面・乱数・状態はThree.jsオブジェクトに依存させない。
6. **UI/保存:** 日本語の短い導線、開始/続き、HP等の最小HUD、必要時に開く地図・スキル・持物・設定、タッチ操作、キーボード、ミュート、データversion付き保存と破損時の復旧。
7. **仕上げ:** タイトルからクリアまでの一巡、戦闘不能/再開、セーブ再読込、階段往復、狭い画面、コンテキストロスト/復旧やWebGL失敗表示を検証。READMEに起動・操作・原作素材の扱いを記載。

セル単位の迷路移動では連続物理シミュレーションが不要なため、Rapier導入は必須ではない。重い3Dモデルを用意するより、元の2D敵をbillboardで使い、単純な壁geometryに原作テクスチャを貼る方式が原作と開発範囲に適する。

## 実装後の検証計画

- 型チェックと本番ビルド。
- simulationの意味ある検証: 複数seedで全セル到達・壁の対称性・外周境界、入口/階段/ボスへの経路、戦闘ターンと属性、メモリー上限、報酬、勝利/敗北、save/load一致と破損データ復旧。
- Playwright + 実Chrome: console/pageerror、HTTPリソース失敗、WebGL canvas描画、タイトル→探索→地図→戦闘→成長→階層移動→勝利、敗北→再開、reload継続、ミュート、キーボードとタッチ、PC/スマートフォンサイズ。
- 画面をスクリーンショットにし、暗い壁の可読性、敵の透明背景と拡大、HUDの重なり、日本語長文、モーダル、操作時のフォーカスを視覚確認。
- 到達が長いエンディング/深層はseed固定やテスト専用状態注入を用意して再現性を確保し、通常ユーザーフローからの到達も別に確認する。
- 現段階で実施したのは原作のソース/資料/素材調査、ZIP保存整合性検査、ブラウザWebGL2環境検査のみ。ブラウザ版ゲームのプレイテストは未実施。
