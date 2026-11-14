# Simulation / 次の画面実装への引継ぎ

`src/simulation/index.ts` を入口にする。`src/data/game.ts` は表示名・説明・敵/スキル/拠点商品の正本。ルールにはThree.js、DOM、時刻、localStorageへの直接依存がない。すべてJSON化可能で、同じseedとコマンド列なら同じ状態になる。

## 最小接続

```ts
import {
  createGame, dispatch, getObjective, getInteractions, getStats,
  getActionAvailability, loadGame, saveGame, type Action,
} from './simulation';

const loaded = loadGame(localStorage);
// errorの場合はエラーと新規開始導線を表示する。保存は自動削除しない。
let state = loaded.status === 'ok' ? loaded.state : createGame(2007, 'flame');

function command(action: Action) {
  const result = dispatch(state, action);
  if (!result.ok) { showNotice(result.message); return; }
  const previous = state;
  state = result.state;
  const saved = saveGame(state, localStorage);
  if (!saved.ok) showNotice(saved.message);
  render(state, previous, result.events); // 描画補間だけがpreviousを使う
}
```

`dispatch` は入力を変更しない純粋なトランザクション。成功時に新しいstate、無効時に入力と同じstateを返す。無効な操作では乱数・MP・持物・敵ターンを消費しない。壁衝突のみ失敗結果にも`blocked`イベントが入るので効果音に使える。`getActionAvailability(state, action)` はボタンのdisabledと理由表示に使う。

## 状態と描画規約

- `phase`: `camp` / `explore` / `battle` / `defeated` / `ending`。終了後は`continue`で探索へ。`cleared`はその後もtrue。
- `floor`: 0～4（表示はB1～B5）。`FLOORS[floor]`が日本語名・敵候補・ボス。
- `position`: 行優先のセル番号。`x=position % size`、`z=Math.floor(position / size)`。
- `direction`: 0北・1東・2南・3西。北はz減少。入場/帰還/階段到着は南（上り時は北）を優先し、時計回りに開いた通路を選んで向く。壁や位置は変更しない。
- `floors[i].cells[n].walls`: bit 1北・2東・4南・8西。壁の両側に同じ境界があるのでThreeの重複壁生成を避ける。
- `cells[n].explored`: 足を踏み入れたセル。ミニマップでは未踏セル自体を隠し、踏破セルに接する壁を描く。生成時点では全階の入口だけ既知。
- 各階の`entrance`、`exit`、`fountain`、`chest`は異なる到達可能セル。入口は常に0。`exit`にボスが立ち、撃破後に下り階段を使える。B5のexitは玉座。
- `bossDefeated`、`fountainUsed`、`chestOpened`は階ごとに保持。帰還・救出でも消えない。
- `player`は現在HP/MP、LV、次LVまでに貯めたXP、gold、weapon強化値、記憶中skills、inventory。最大値と攻防/記憶枠は`getStats(state)`を使う。
- `battle`: 敵ID/現在HP/経過ターン/ボスか/現在予告。最大HP・能力・弱点・画像識別子は`ENEMIES[battle.enemyId]`。次に敵が行う行動が`intent`。日本語は`getIntentText`。
- 原作画像必須の白騎士は`enemy.art === 'whiteKnight'`かつ`enemy.id === 'whiteKnight'`。他のartキーはコード/描画側の図形ビルボードでよい。
- `getObjective(state)`を常設目標に、`getInteractions(state)`を同セルのプロンプト/調べるボタンに使う。使用済み泉/宝箱は`enabled:false`の説明付きで返す。
- `stats`に歩数/戦闘数/勝利/逃走/救出/宝箱数。結末と探索記録に使える。logは直近8行。回転や歩行も含むため、戦闘ログを長く残すならUIがeventsを表示履歴に蓄積してよい。

移動論理は即時確定。描画側だけ約140ms補間する。操作中の入力連打はUIが制御する。階段・泉・宝箱・ボスは踏むだけでは起動せず、必ず`interact`が必要。

## コマンド一覧

| action | 使用場所・挙動 |
| --- | --- |
| `{type:'enter'}` | 拠点からB1入口へ。自動的な再階移動はない |
| `{type:'move', backward?:true}` | 前進/後退。新規セルで遭遇カウントが速く進む。回転は遭遇に加算しない |
| `{type:'turn',delta:-1\|1}` | 左/右90度 |
| `{type:'interact'}` | 同セルのボス/階段/泉/宝箱/拠点入口。状態は`getInteractions`で事前取得 |
| `{type:'attack'}` | 通常攻撃→敵行動。撃破した場合は敵が反撃しない |
| `{type:'defend'}` | 敵の現在行動を軽減。大技なら約82%軽減、通常は65%軽減 |
| `{type:'skill',skill:SkillId}` | 記憶中かつMP充足が必要。holyは戦闘外も可、その他は戦闘限定。回復満タンなら無効 |
| `{type:'item',item:'potion'\|'ether'\|'thread'}` | 回復薬HP35、魔力薬MP14。戦闘中は敵ターンを進める。帰還糸は探索専用、拠点へ全回復帰還 |
| `{type:'flee'}` | 通常敵から確実に逃走、10歩の遭遇猶予。ボス戦は無効・理由付き |
| `{type:'memorize',skill}` / `{type:'forget',skill}` | 探索/拠点でいつでも整理。全6スキルは最初から習得可能。忘却は永続消失ではない |
| `{type:'rest'}` | 拠点で無料全回復、帰還糸を最低1個に補給 |
| `{type:'buy',item}` | 拠点で薬/糸を購入。priceと説明はITEMS。持物は各99個まで |
| `{type:'upgrade'}` | 拠点で武器強化。価格はgetStats().upgradePrice、上限+10 |
| `{type:'rescue'}` | 戦闘不能から拠点へ。金貨25%損失、印/成長/探索状態を維持し全回復 |
| `{type:'continue'}` | endingから探索へ。クリアは保持、王戦は再発生しない |

戦闘中のコマンドは攻撃/防御/スキル/回復薬/魔力薬/逃走。キーボードの1～6を対応させ、スキル選択のリストは`player.skills`から作る。スキルのmp/name/descriptionはSKILLSを使う。`getActionAvailability`を必ず通して、無効理由をUIにも見せる。

## 属性とメモリー

`ORIGINS`の3候補を新規開始時に選ぶ。affinityは`[火↔水,風↔土,聖↔闇]`のベクトル。スキルの軸との内積が正なら親和、負なら反対。

`getSkillCost(state,id)`は生来属性による記憶費用1～3、`getMemoryUsed`は使用量、`getStats().memory`は上限（初期6、2LVごとに+1）。習得は確定で、親しい属性ほど少ない枠で覚えられる。初期は火の攻撃と聖の回復を全属性が記憶できる。`getAffinityMultiplier(skillId, enemy.affinity)`が攻撃相性（0.7～1.5倍）。holyは回復なので、闇の敵には直接弱点を突けないことを敵説明にも明記済み。全属性がいつでも攻撃/回復の組合せを作り直せる。

## 保存・敗北・新規開始

`serializeGame`/`parseGame`はversion1のchecksum付きエンベロープ。parse時に迷路をseedから再生成し、壁/イベント配置、進行順、HP/MP/記憶/持物/戦闘などの整合性も確認する。不正なら日本語Error。

`saveGame(state, localStorage)`は例外を捕まえ`{ok,message}`、`loadGame(localStorage)`は`empty|ok|error`を返す。データ破損を自動削除しない。ストレージが利用不能な場合もメモリー上のプレイを続けられるようUIに通知する。`SAVE_KEY`は`ancient-kingdom.save.v1`。

成功したコマンドごとに保存すれば、戦闘中も敵HP/予告/乱数をそのまま再開する。`defeated`も保存できる。敗北時に「保存から再開」を提供する場合は、UIが**戦闘開始直前のチェックポイント**を別キーに保存し、救出以外の選択肢としてそのsnapshotを復元する。通常の自動保存を再読込するだけだと敗北状態が再開する。現simulationはチェックポイント管理までは行わず、任意の正規状態をserialize/parseできるAPIを提供している。

新規開始の既存データ削除確認はUIの責務。確認後に`createGame(seed, origin)`を保存するか、`deleteSave(storage)`を呼ぶ。タイトルに入っただけでは消さない。

## 実装済み検証

`npm test`、`npm run typecheck`、`npm run build`。テストは40seed×5階の壁/連結/階段、記憶上限、無効操作/防御/救出、戦闘save/loadと破損処理、全3属性×3seedの通常操作による全5階攻略。自動攻略はマップ全体を経路選択に参照するが、状態変更は通常の公開コマンドのみ。宝箱→泉→ボス、途中通常戦闘、予告で防御、必要時に回復/属性記憶の戦略。救出/拠点での追加強化なしでクリアした。

画面・音・操作の実ブラウザ検証、探索時間30～45分の体感バランスは次のタスク。数値は詰みにくい側に設定し、初回3seedの攻略は最終LV11～12、歩数216～246、戦闘15～17。地図が見えない人間の探索では歩数は増える。クリア済み階層では通常遭遇が止まり、安全な帰路になる。
