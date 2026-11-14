import { ENEMIES, FLOORS, ITEMS, ORIGINS, SKILLS, type Axis, type ItemId, type OriginId, type SkillId } from '../data/game';
import { generateFloor, neighbor } from './maze';
import { normalizeSeed, random } from './random';
import type { Action, ActionResult, Direction, FloorState, GameEvent, GameState } from './types';

/** Arrival faces a passage, preferring the original south/down or north/up heading. */
function arrivalDirection(floor: FloorState, position: number, preferred: Direction): Direction {
  for (let offset = 0; offset < 4; offset++) {
    const direction = ((preferred + offset) % 4) as Direction;
    if (!(floor.cells[position].walls & (1 << direction))) return direction;
  }
  return preferred;
}

export const dot = (a: Axis, b: Axis): number => a.reduce((n, value, i) => n + value * b[i], 0);
export function getStats(state: GameState) {
  const p = state.player;
  return { maxHp: 42 + (p.level - 1) * 10, maxMp: 20 + (p.level - 1) * 4, attack: 10 + (p.level - 1) * 3 + p.weapon * 2, defense: 3 + (p.level - 1) * 2, memory: 6 + Math.floor((p.level - 1) / 2), nextXp: 18 + p.level * 12, upgradePrice: 35 + p.weapon * 30 };
}
export function getSkillCost(state: GameState, id: SkillId): number { return Math.max(1, Math.min(3, 2 - Math.round(dot(ORIGINS[state.player.origin].affinity, SKILLS[id].affinity)))); }
export function getMemoryUsed(state: GameState): number { return state.player.skills.reduce((n, id) => n + getSkillCost(state, id), 0); }
export function getAffinityMultiplier(skill: SkillId, target: Axis): number { return Math.max(0.7, Math.min(1.5, 1 - dot(SKILLS[skill].affinity, target) * 0.5)); }
export function createGame(seed = 2007, origin: OriginId = 'flame'): GameState {
  if (!(origin in ORIGINS)) throw new Error('不明な生来属性です。');
  const normalized = normalizeSeed(seed);
  const floors = FLOORS.map((_, i) => generateFloor(normalized, i));
  return { version: 1, seed: normalized, rng: normalizeSeed(normalized ^ 0xa5a5a5a5), phase: 'camp', floor: 0, position: 0, direction: arrivalDirection(floors[0], 0, 2), floors, player: { origin, level: 1, xp: 0, hp: 42, mp: 20, gold: 30, weapon: 0, skills: ['fire', 'holy'], inventory: { potion: 3, ether: 2, thread: 1 } }, battle: null, seals: 0, cleared: false, encounterSteps: 0, encounterGrace: 8, stats: { steps: 0, battles: 0, victories: 0, escapes: 0, rescues: 0, treasures: 0 }, log: ['滅びた王国へ。三つの王印と、失われた記憶を探せ。'] };
}
export function getObjective(s: GameState): string {
  if (s.phase === 'ending') return '王の記憶は解き放たれた。探索記録を確かめよう。';
  if (s.phase === 'defeated') return '探索隊の救出を受けるか、保存から再開。';
  if (s.phase === 'camp') return s.cleared ? '記憶を取り戻した古都を、もう一度歩く。' : '休息・薬の準備をして、地下へ。';
  if (s.cleared) return '古都の記憶は戻った。地図を埋め、拠点へ帰還できる。';
  if (s.floors[s.floor].bossDefeated) return '守護者の先の階段を調べ、深層へ。';
  return s.floor < 3 ? `B${s.floor + 1}の守護者を倒し、第${s.floor + 1}王印を得る。` : s.floor === 3 ? '白い斧騎士を越え、王の玉座へ。' : '三つの王印を掲げ、忘却の王と向き合う。';
}
export interface Interaction { kind: 'camp' | 'up' | 'down' | 'boss' | 'fountain' | 'chest'; label: string; enabled: boolean; reason?: string }
export function getInteractions(s: GameState): Interaction[] {
  if (s.phase !== 'explore') return [];
  const f = s.floors[s.floor], items: Interaction[] = [];
  if (s.position === f.entrance) items.push({ kind: s.floor === 0 ? 'camp' : 'up', label: s.floor === 0 ? '地上の拠点へ戻る' : '上り階段を使う', enabled: true });
  if (s.position === f.exit) {
    if (!f.bossDefeated) items.push({ kind: 'boss', label: `${ENEMIES[FLOORS[s.floor].boss].name}に挑む`, enabled: true });
    else if (s.floor < 4) items.push({ kind: 'down', label: '下り階段を使う', enabled: true });
  }
  if (s.position === f.fountain) items.push({ kind: 'fountain', label: f.fountainUsed ? '泉は静かに枯れている' : '記憶の泉で全回復', enabled: !f.fountainUsed, reason: f.fountainUsed ? 'この泉は使用済みです。' : undefined });
  if (s.position === f.chest) items.push({ kind: 'chest', label: f.chestOpened ? '開いた記憶の宝箱' : '記憶の宝箱を開く', enabled: !f.chestOpened, reason: f.chestOpened ? 'この宝箱は空です。' : undefined });
  return items;
}
export function getIntentText(s: GameState): string {
  if (!s.battle) return '';
  return { attack: '攻撃の構え', heavy: '大技の予告 — 防御で大幅に軽減', guard: '防御の構え — 攻撃の威力が下がる' }[s.battle.intent];
}
export function getActionAvailability(s: GameState, action: Action): { enabled: boolean; reason: string } {
  const p = s.player, battle = s.phase === 'battle', exploring = s.phase === 'explore', camp = s.phase === 'camp', active = battle || exploring || camp;
  const yes = { enabled: true, reason: '' }, no = (reason: string) => ({ enabled: false, reason });
  switch (action.type) {
    case 'enter': return camp ? yes : no('拠点から出発してください。');
    case 'rest': return camp ? yes : no('休息は拠点で行えます。');
    case 'move': case 'turn': return exploring ? yes : no('探索中だけ移動できます。');
    case 'interact': return exploring && getInteractions(s).some(i => i.enabled) ? yes : no('ここには調べられるものがありません。');
    case 'attack': case 'defend': return battle ? yes : no('戦闘中だけ使えます。');
    case 'flee': return !battle ? no('戦闘中だけ使えます。') : s.battle?.boss ? no('守護者からは逃走できません。予告を見て防御してください。') : yes;
    case 'skill': {
      const skill = SKILLS[action.skill];
      if (!active || !skill || !p.skills.includes(action.skill)) return no('そのスキルを記憶していません。');
      if (p.mp < skill.mp) return no('MPが足りません。');
      if (skill.kind === 'heal') return p.hp < getStats(s).maxHp ? yes : no('HPは満タンです。');
      return battle ? yes : no('攻撃スキルは戦闘中に使えます。');
    }
    case 'memorize': return !(exploring || camp) ? no('記憶の整理は戦闘の外で行ってください。') : !SKILLS[action.skill] ? no('不明なスキルです。') : p.skills.includes(action.skill) ? no('すでに記憶しています。') : getMemoryUsed(s) + getSkillCost(s, action.skill) > getStats(s).memory ? no('メモリーが足りません。先に他のスキルを忘却してください。') : yes;
    case 'forget': return !(exploring || camp) ? no('記憶の整理は戦闘の外で行ってください。') : p.skills.includes(action.skill) ? yes : no('そのスキルを記憶していません。');
    case 'item': {
      if (!active || !ITEMS[action.item]) return no('今は使用できません。');
      if (p.inventory[action.item] <= 0) return no('持っていません。');
      if (action.item === 'thread') return exploring ? yes : no('帰還糸は探索中だけ使えます。');
      const full = action.item === 'potion' ? p.hp >= getStats(s).maxHp : p.mp >= getStats(s).maxMp;
      return full ? no(action.item === 'potion' ? 'HPは満タンです。' : 'MPは満タンです。') : yes;
    }
    case 'buy': return !camp ? no('購入は拠点で行えます。') : !ITEMS[action.item] ? no('不明な品物です。') : p.gold < ITEMS[action.item].price ? no('金貨が足りません。') : p.inventory[action.item] >= 99 ? no('これ以上持てません。') : yes;
    case 'upgrade': return !camp ? no('強化は拠点で行えます。') : p.weapon >= 10 ? no('武器は最大まで強化済みです。') : p.gold < getStats(s).upgradePrice ? no('金貨が足りません。') : yes;
    case 'rescue': return s.phase === 'defeated' ? yes : no('救出は戦闘不能時に受けられます。');
    case 'continue': return s.phase === 'ending' ? yes : no('結末の後に探索を続けられます。');
  }
}

/** Pure transaction: input state is never mutated, including rejected actions. */
export function dispatch(input: GameState, action: Action): ActionResult {
  const availability = getActionAvailability(input, action);
  if (!availability.enabled) return { state: input, ok: false, message: availability.reason, events: [] };
  const s: GameState = structuredClone(input), p = s.player, events: GameEvent[] = [];
  const emit = (type: GameEvent['type'], text: string, amount?: number) => { events.push({ type, text, ...(amount === undefined ? {} : { amount }) }); s.log.push(text); s.log = s.log.slice(-8); };
  const restore = () => { p.hp = getStats(s).maxHp; p.mp = getStats(s).maxMp; };
  const camp = () => { s.phase = 'camp'; s.floor = 0; s.position = 0; s.direction = arrivalDirection(s.floors[0], 0, 2); s.battle = null; s.encounterSteps = 0; s.encounterGrace = 8; restore(); p.inventory.thread = Math.max(1, p.inventory.thread); emit('camp', '地上の拠点へ帰還。休息し、帰還糸を補給した。'); };
  const gainXp = (amount: number) => {
    p.xp += amount;
    while (p.xp >= getStats(s).nextXp) { p.xp -= getStats(s).nextXp; p.level++; restore(); emit('levelUp', `レベル${p.level}。HPとMPが全回復した。`); }
  };
  const heal = (resource: 'hp' | 'mp', amount: number) => { const actual = Math.min(amount, getStats(s)[resource === 'hp' ? 'maxHp' : 'maxMp'] - p[resource]); p[resource] += actual; emit('heal', `${resource.toUpperCase()}が${actual}回復した。`, actual); };
  const startBattle = (boss: boolean) => {
    const data = FLOORS[s.floor], id = boss ? data.boss : data.enemies[Math.floor(random(s) * data.enemies.length)], e = ENEMIES[id];
    s.battle = { enemyId: id, hp: e.hp, turn: 0, boss, intent: e.pattern[0] }; s.phase = 'battle'; s.stats.battles++; emit('battleStart', `${e.name}が現れた。`);
  };
  const victory = () => {
    const battle = s.battle!, e = ENEMIES[battle.enemyId];
    p.gold += e.gold; s.stats.victories++; s.phase = 'explore'; s.battle = null; s.encounterSteps = 0; s.encounterGrace = 9;
    emit('victory', `${e.name}を倒した。経験値${e.xp}、金貨${e.gold}。`); gainXp(e.xp);
    if (battle.boss) {
      s.floors[s.floor].bossDefeated = true;
      if (s.floor < 3) { s.seals++; emit('victory', `第${s.floor + 1}王印を取り戻した。下り階段が開いた。`); }
      else if (s.floor === 3) emit('victory', '白い衛士は斧を下ろした。王の玉座へ道が開く。');
      else { s.cleared = true; s.phase = 'ending'; emit('ending', '王は滅びの夜を一人で抱えていた。三つの王印が輝き、失われた人々の記憶が古都に戻る。あなたは最後の灯火を、地上へ持ち帰った。'); }
    }
  };
  const enemyTurn = (guarding = false) => {
    if (!s.battle) return;
    const b = s.battle, e = ENEMIES[b.enemyId];
    if (b.intent === 'guard') emit('damage', `${e.name}は守りを固めている。`);
    else {
      const base = Math.max(2, e.attack - getStats(s).defense * 0.65), heavy = b.intent === 'heavy';
      const amount = Math.max(1, Math.round(base * (heavy ? 2.0 : 1) * (guarding ? (heavy ? 0.18 : 0.35) : 1)));
      p.hp = Math.max(0, p.hp - amount); emit('damage', `${e.name}の${heavy ? '大技' : '攻撃'}。${amount}の傷。`, amount);
    }
    if (p.hp === 0) { s.phase = 'defeated'; emit('defeat', '力尽きた。探索隊があなたの灯火を探している。'); return; }
    b.turn++; b.intent = e.pattern[b.turn % e.pattern.length];
  };
  const strike = (skillId?: SkillId) => {
    const b = s.battle!, e = ENEMIES[b.enemyId], skill = skillId ? SKILLS[skillId] : null;
    const base = skill ? (skill.power + p.level * 2 + p.weapon) * getAffinityMultiplier(skillId!, e.affinity) : getStats(s).attack - e.defense * 0.55;
    const amount = Math.max(1, Math.round(base * (b.intent === 'guard' ? 0.5 : 1)));
    const actual = Math.min(b.hp, amount); b.hp -= actual;
    emit('damage', `${skill?.name ?? '攻撃'}。${e.name}に${actual}の傷。`, actual);
    if (skill?.kind === 'drain') heal('hp', Math.max(1, Math.floor(actual / 2)));
    if (b.hp <= 0) victory(); else enemyTurn();
  };
  switch (action.type) {
    case 'enter': s.phase = 'explore'; s.floor = 0; s.position = 0; s.direction = arrivalDirection(s.floors[0], 0, 2); s.floors[0].cells[0].explored = true; emit('floor', 'B1 忘却の回廊へ降りた。'); break;
    case 'turn': s.direction = ((s.direction + action.delta + 4) % 4) as Direction; emit('turn', '向きを変えた。'); break;
    case 'move': {
      const f = s.floors[s.floor], d = ((s.direction + (action.backward ? 2 : 0)) % 4) as Direction;
      if (f.cells[s.position].walls & (1 << d)) return { state: input, ok: false, message: '壁が行く手を遮っている。', events: [{ type: 'blocked', text: '壁が行く手を遮っている。' }] };
      s.position = neighbor(s.position, d, f.size); const fresh = !f.cells[s.position].explored; f.cells[s.position].explored = true; s.stats.steps++;
      emit('move', `B${s.floor + 1}の回廊を進んだ。`);
      if (s.encounterGrace > 0) s.encounterGrace--;
      else s.encounterSteps += fresh ? 2 : 1;
      if (!f.bossDefeated && !getInteractions(s).some(i => i.enabled) && s.encounterGrace === 0 && s.encounterSteps >= 12 && random(s) < 0.42) { s.encounterSteps = 0; startBattle(false); }
      break;
    }
    case 'interact': {
      const f = s.floors[s.floor], interaction = getInteractions(s).find(i => i.enabled)!;
      if (interaction.kind === 'camp') camp();
      else if (interaction.kind === 'boss') startBattle(true);
      else if (interaction.kind === 'fountain') { f.fountainUsed = true; restore(); emit('heal', '記憶の泉。HPとMPが全回復した。'); }
      else if (interaction.kind === 'chest') { f.chestOpened = true; s.stats.treasures++; p.gold += 25 + s.floor * 12; p.inventory.potion = Math.min(99, p.inventory.potion + 2); p.inventory.ether = Math.min(99, p.inventory.ether + 1); emit('treasure', '宝箱から記憶の欠片、薬、金貨を手に入れた。'); gainXp(24 + s.floor * 12); }
      else {
        const down = interaction.kind === 'down'; s.floor += down ? 1 : -1;
        s.position = down ? s.floors[s.floor].entrance : s.floors[s.floor].exit; s.direction = arrivalDirection(s.floors[s.floor], s.position, down ? 2 : 0); s.floors[s.floor].cells[s.position].explored = true; s.encounterGrace = 8; s.encounterSteps = 0;
        emit('floor', `B${s.floor + 1} ${FLOORS[s.floor].name}へ${down ? '降りた' : '戻った'}。`);
      }
      break;
    }
    case 'attack': strike(); break;
    case 'defend': emit('damage', '守りを固めた。次の攻撃を軽減する。'); enemyTurn(true); break;
    case 'skill': { const skill = SKILLS[action.skill]; p.mp -= skill.mp; if (skill.kind === 'heal') { heal('hp', skill.power + p.level * 3); if (s.battle) enemyTurn(); } else strike(action.skill); break; }
    case 'flee': s.stats.escapes++; s.phase = 'explore'; s.battle = null; s.encounterGrace = 10; s.encounterSteps = 0; emit('escape', '隙を見て逃れた。しばらく敵に遭遇しない。'); break;
    case 'item': if (action.item === 'thread') { p.inventory.thread--; camp(); } else { p.inventory[action.item]--; heal(action.item === 'potion' ? 'hp' : 'mp', action.item === 'potion' ? 35 : 14); if (s.battle) enemyTurn(); } break;
    case 'rest': restore(); p.inventory.thread = Math.max(1, p.inventory.thread); emit('heal', '拠点で休息。HPとMPを全回復し、帰還糸を補給した。'); break;
    case 'buy': p.gold -= ITEMS[action.item].price; p.inventory[action.item]++; emit('treasure', `${ITEMS[action.item].name}を購入した。`); break;
    case 'upgrade': p.gold -= getStats(s).upgradePrice; p.weapon++; emit('treasure', `武器を強化した（+${p.weapon}）。`); break;
    case 'memorize': p.skills.push(action.skill); emit('memory', `${SKILLS[action.skill].name}を記憶した。`); break;
    case 'forget': p.skills = p.skills.filter(id => id !== action.skill); emit('memory', `${SKILLS[action.skill].name}を忘却した。いつでも記憶し直せる。`); break;
    case 'rescue': { const lost = Math.floor(p.gold * 0.25); p.gold -= lost; s.stats.rescues++; camp(); emit('camp', `探索隊に救出された。金貨${lost}を失ったが、記憶と王印は残った。`); break; }
    case 'continue': s.phase = 'explore'; emit('floor', '記憶を取り戻した古都の探索を続ける。'); break;
  }
  return { state: s, ok: true, message: events.at(-1)?.text ?? '', events };
}
