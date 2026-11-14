import { ENEMIES, FLOORS, ORIGINS, SKILLS } from '../data/game';
import { getMemoryUsed, getStats } from './engine';
import { generateFloor } from './maze';
import type { GameState } from './types';

export const SAVE_KEY = 'ancient-kingdom.save.v1';
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export type LoadResult = { status: 'empty' } | { status: 'ok'; state: GameState } | { status: 'error'; message: string };
function checksum(text: string): string { let hash = 2166136261; for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619); return (hash >>> 0).toString(16); }
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function integer(value: unknown, min: number, max = 1_000_000_000): value is number { return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max; }
function object(value: unknown): value is Record<string, any> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
/** Validate both schema and gameplay invariants; never trusts a saved map or position. */
export function validateState(value: unknown): asserts value is GameState {
  assert(object(value) && value.version === 1, 'この保存形式には対応していません。');
  const s = value;
  assert(integer(s.seed, 1, 0xffffffff) && integer(s.rng, 1, 0xffffffff), '乱数状態が壊れています。');
  assert(['camp', 'explore', 'battle', 'defeated', 'ending'].includes(s.phase), 'ゲーム状態が壊れています。');
  assert(integer(s.floor, 0, 4) && integer(s.direction, 0, 3) && Array.isArray(s.floors) && s.floors.length === 5, '階層状態が壊れています。');
  let previousCleared = true;
  for (let i = 0; i < 5; i++) {
    const f = s.floors[i], generated = generateFloor(s.seed, i);
    assert(object(f) && f.index === i && f.size === generated.size && Array.isArray(f.cells) && f.cells.length === generated.cells.length, '迷路の大きさが壊れています。');
    for (const key of ['entrance', 'exit', 'fountain', 'chest'] as const) assert(f[key] === generated[key], '迷路のイベント配置が壊れています。');
    for (let n = 0; n < f.cells.length; n++) assert(object(f.cells[n]) && f.cells[n].walls === generated.cells[n].walls && typeof f.cells[n].explored === 'boolean', '迷路の壁・探索状態が壊れています。');
    assert(f.cells[0].explored && ['bossDefeated', 'chestOpened', 'fountainUsed'].every(key => typeof f[key] === 'boolean'), '階層イベントが壊れています。');
    assert(!f.bossDefeated || previousCleared, '守護者の進行順が壊れています。'); previousCleared = f.bossDefeated;
  }
  assert(integer(s.position, 0, s.floors[s.floor].cells.length - 1) && s.floors[s.floor].cells[s.position].explored, '現在位置が壊れています。');
  assert(s.floor === 0 || s.floors[s.floor - 1].bossDefeated, '未開放の階層です。');
  assert(s.phase !== 'camp' || (s.floor === 0 && s.position === 0), '拠点の状態が壊れています。');
  assert(s.seals === s.floors.slice(0, 3).filter((f: any) => f.bossDefeated).length && typeof s.cleared === 'boolean' && s.cleared === s.floors[4].bossDefeated, '王印の状態が壊れています。');
  assert(s.phase !== 'ending' || (s.cleared && s.floor === 4), '結末の状態が壊れています。');
  const p = s.player;
  assert(object(p) && Object.hasOwn(ORIGINS, p.origin) && integer(p.level, 1, 999) && integer(p.xp, 0) && integer(p.gold, 0) && integer(p.weapon, 0, 10), '冒険者の情報が壊れています。');
  assert(Array.isArray(p.skills) && new Set(p.skills).size === p.skills.length && p.skills.every((id: unknown) => typeof id === 'string' && Object.hasOwn(SKILLS, id)), '記憶したスキルが壊れています。');
  const typed = s as GameState, stats = getStats(typed);
  assert(integer(p.hp, 0, stats.maxHp) && integer(p.mp, 0, stats.maxMp) && p.xp < stats.nextXp && getMemoryUsed(typed) <= stats.memory, '能力値またはメモリーが壊れています。');
  assert((s.phase === 'defeated') === (p.hp === 0), '戦闘不能の状態が壊れています。');
  assert(object(p.inventory) && ['potion', 'ether', 'thread'].every(key => integer(p.inventory[key], 0, 99)), '持物が壊れています。');
  assert(integer(s.encounterSteps, 0) && integer(s.encounterGrace, 0, 10), '遭遇状態が壊れています。');
  assert(object(s.stats) && ['steps', 'battles', 'victories', 'escapes', 'rescues', 'treasures'].every(key => integer(s.stats[key], 0)) && s.stats.treasures <= 5 && s.stats.victories + s.stats.escapes <= s.stats.battles, '探索記録が壊れています。');
  assert(Array.isArray(s.log) && s.log.length <= 8 && s.log.every((line: unknown) => typeof line === 'string' && line.length <= 1000), '探索ログが壊れています。');
  if (s.phase === 'battle' || s.phase === 'defeated') {
    const b = s.battle;
    assert(object(b) && Object.hasOwn(ENEMIES, b.enemyId) && typeof b.boss === 'boolean' && integer(b.turn, 0), '戦闘状態が壊れています。');
    const e = ENEMIES[b.enemyId as keyof typeof ENEMIES];
    assert(integer(b.hp, 1, e.hp) && b.intent === e.pattern[b.turn % e.pattern.length], '敵の状態が壊れています。');
    assert(b.boss ? b.enemyId === FLOORS[s.floor].boss && s.position === s.floors[s.floor].exit && !s.floors[s.floor].bossDefeated : (FLOORS[s.floor].enemies as readonly string[]).includes(b.enemyId), '敵の配置が壊れています。');
  } else assert(s.battle === null, '戦闘終了状態が壊れています。');
}
export function serializeGame(state: GameState): string {
  validateState(state);
  const payload = JSON.stringify(state);
  return JSON.stringify({ format: 'ancient-kingdom', version: 1, checksum: checksum(payload), payload });
}
export function parseGame(raw: string): GameState {
  assert(raw.length <= 1_000_000, '保存データが大きすぎます。');
  let envelope: unknown;
  try { envelope = JSON.parse(raw); } catch { throw new Error('保存データを読み取れません。'); }
  assert(object(envelope) && envelope.format === 'ancient-kingdom' && envelope.version === 1 && typeof envelope.payload === 'string', 'この保存形式には対応していません。');
  assert(checksum(envelope.payload) === envelope.checksum, '保存データの整合性を確認できません。');
  let state: unknown;
  try { state = JSON.parse(envelope.payload); } catch { throw new Error('保存データの内容が壊れています。'); }
  validateState(state);
  return state;
}
export function loadGame(storage: StorageLike): LoadResult {
  try { const raw = storage.getItem(SAVE_KEY); return raw === null ? { status: 'empty' } : { status: 'ok', state: parseGame(raw) }; }
  catch (e) { return { status: 'error', message: e instanceof Error ? e.message : '保存データを読み取れません。' }; }
}
export function saveGame(state: GameState, storage: StorageLike): { ok: boolean; message: string } {
  try { storage.setItem(SAVE_KEY, serializeGame(state)); return { ok: true, message: '保存しました。' }; }
  catch (e) { return { ok: false, message: e instanceof Error ? e.message : '保存できません。' }; }
}
/** UI must obtain new-adventure confirmation before calling this. */
export function deleteSave(storage: StorageLike): { ok: boolean; message: string } {
  try { storage.removeItem(SAVE_KEY); return { ok: true, message: '保存を削除しました。' }; }
  catch { return { ok: false, message: '保存を削除できません。' }; }
}
