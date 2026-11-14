import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES, ORIGINS, SKILLS, type OriginId, type SkillId } from '../src/data/game';
import { accessibleNeighbors, createGame, dispatch, generateFloor, getActionAvailability, getAffinityMultiplier, getMemoryUsed, getSkillCost, getStats, loadGame, neighbor, parseGame, SAVE_KEY, saveGame, serializeGame, validateState, type Action, type Direction, type GameState } from '../src/simulation';

function apply(s: GameState, action: Action): GameState {
  const r = dispatch(s, action); assert.equal(r.ok, true, `${action.type}: ${r.message}`); validateState(r.state); return r.state;
}
function path(s: GameState, target: number): number[] {
  const f = s.floors[s.floor], parents = new Map<number, number>([[s.position, -1]]), queue = [s.position];
  for (let i = 0; i < queue.length && !parents.has(target); i++) for (const n of accessibleNeighbors(f, queue[i])) if (!parents.has(n)) { parents.set(n, queue[i]); queue.push(n); }
  assert.ok(parents.has(target)); const result = []; let cursor = target;
  while (cursor !== s.position) { result.unshift(cursor); cursor = parents.get(cursor)!; }
  return result;
}
function fight(input: GameState): GameState {
  let s = input;
  for (let turn = 0; s.phase === 'battle' && turn < 200; turn++) {
    const b = s.battle!, stats = getStats(s);
    if (b.intent === 'heavy') s = apply(s, { type: 'defend' });
    else if (s.player.hp < stats.maxHp * 0.55 && getActionAvailability(s, { type: 'skill', skill: 'holy' }).enabled) s = apply(s, { type: 'skill', skill: 'holy' });
    else if (s.player.hp < stats.maxHp * 0.5 && s.player.inventory.potion > 0) s = apply(s, { type: 'item', item: 'potion' });
    else {
      const magic = s.player.skills.filter(id => SKILLS[id].kind !== 'heal' && s.player.mp >= SKILLS[id].mp).sort((a, b) => getAffinityMultiplier(b, ENEMIES[s.battle!.enemyId].affinity) - getAffinityMultiplier(a, ENEMIES[s.battle!.enemyId].affinity))[0];
      s = apply(s, magic ? { type: 'skill', skill: magic } : { type: 'attack' });
    }
  }
  assert.notEqual(s.phase, 'battle', 'battle must terminate');
  assert.notEqual(s.phase, 'defeated', `autoplay defeated on B${s.floor + 1}: ${JSON.stringify(s.player)}`);
  return s;
}
function walk(input: GameState, target: number, resolveBattles = true): GameState {
  let s = input;
  for (const next of path(s, target)) {
    const dir = ([0, 1, 2, 3] as Direction[]).find(d => neighbor(s.position, d, s.floors[s.floor].size) === next)!;
    while (s.direction !== dir) s = apply(s, { type: 'turn', delta: 1 });
    s = apply(s, { type: 'move' });
    if (s.phase === 'battle') s = resolveBattles ? fight(s) : apply(s, { type: 'flee' });
  }
  return s;
}

test('DFS maps: 40 seeds × 5 floors are connected, symmetric and bounded; events are distinct/reachable', () => {
  for (let seed = 1; seed <= 40; seed++) for (let index = 0; index < 5; index++) {
    const f = generateFloor(seed, index), visited = new Set([0]), queue = [0];
    for (let i = 0; i < queue.length; i++) for (const n of accessibleNeighbors(f, queue[i])) if (!visited.has(n)) { visited.add(n); queue.push(n); }
    assert.equal(visited.size, f.size * f.size);
    assert.equal(new Set([f.entrance, f.exit, f.chest, f.fountain]).size, 4);
    for (let cell = 0; cell < f.cells.length; cell++) for (const d of [0, 1, 2, 3] as Direction[]) {
      const n = neighbor(cell, d, f.size), wall = !!(f.cells[cell].walls & (1 << d));
      if (n < 0) assert.equal(wall, true); else assert.equal(wall, !!(f.cells[n].walls & (1 << ((d + 2) % 4))));
    }
    assert.deepEqual(generateFloor(seed, index), f);
  }
});

test('memory affinity, deterministic learning and upper limit for every origin', () => {
  for (const origin of Object.keys(ORIGINS) as OriginId[]) {
    let s = createGame(1, origin); assert.ok(getMemoryUsed(s) <= 6);
    for (const skill of Object.keys(SKILLS) as SkillId[]) {
      assert.ok(getSkillCost(s, skill) >= 1 && getSkillCost(s, skill) <= 3);
      const r = dispatch(s, { type: 'memorize', skill });
      if (r.ok) s = r.state; else assert.equal(r.state, s);
      assert.ok(getMemoryUsed(s) <= getStats(s).memory);
    }
    for (const skill of [...s.player.skills]) s = apply(s, { type: 'forget', skill });
    s = apply(s, { type: 'memorize', skill: 'holy' });
    s = apply(s, { type: 'memorize', skill: 'fire' });
    assert.deepEqual(s.player.skills, ['holy', 'fire']);
  }
  assert.equal(getAffinityMultiplier('water', [1, 0, 0]), 1.5);
  assert.equal(getAffinityMultiplier('fire', [1, 0, 0]), 0.7);
});

test('new adventures, entry and return consistently face an open passage without changing the maze', () => {
  for (let seed = 1; seed <= 40; seed++) {
    let s = createGame(seed);
    const floors = structuredClone(s.floors), rng = s.rng;
    const open = () => assert.equal(s.floors[s.floor].cells[s.position].walls & (1 << s.direction), 0, `seed=${seed} ${s.phase} arrival faces a wall`);
    open(); assert.equal(s.direction, createGame(seed).direction);
    s = apply(s, { type: 'enter' }); open();
    s = apply(s, { type: 'item', item: 'thread' }); open();
    s = apply(s, { type: 'enter' }); open();
    s = apply(s, { type: 'interact' }); open();
    assert.deepEqual(s.floors, floors); assert.equal(s.rng, rng);
  }
});

test('invalid actions never consume resources, RNG or turns; walls block movement', () => {
  const s = createGame(2), before = serializeGame(s);
  for (const action of [{ type: 'attack' }, { type: 'item', item: 'potion' }, { type: 'skill', skill: 'holy' }, { type: 'memorize', skill: 'holy' }] as Action[]) {
    assert.equal(dispatch(s, action).ok, false); assert.equal(serializeGame(s), before);
  }
  let e = apply(s, { type: 'enter' });
  while (e.direction !== 0) e = apply(e, { type: 'turn', delta: 1 });
  const blocked = dispatch(e, { type: 'move' }); assert.equal(blocked.ok, false); assert.equal(blocked.state, e);
  assert.equal(e.position, 0); assert.equal(e.floor, 0);
});

test('boss intent, heavy defense, consumables, forbidden flee and rescue preserve progression', () => {
  let s = apply(createGame(7), { type: 'enter' });
  s = walk(s, s.floors[0].exit, false); s = apply(s, { type: 'interact' });
  assert.equal(s.battle?.boss, true);
  assert.equal(dispatch(s, { type: 'flee' }).ok, false);
  assert.equal(dispatch(s, { type: 'memorize', skill: 'water' }).ok, false);
  s = apply(s, { type: 'defend' }); assert.equal(s.battle?.intent, 'heavy');
  const defended = apply(s, { type: 'defend' }), attacked = apply(s, { type: 'attack' });
  assert.ok(defended.player.hp > attacked.player.hp);
  const missing = structuredClone(s); missing.player.inventory.potion = 0;
  assert.equal(dispatch(missing, { type: 'item', item: 'potion' }).ok, false);
  const fragile = structuredClone(s); fragile.player.hp = 1;
  const defeated = apply(fragile, { type: 'attack' }); assert.equal(defeated.phase, 'defeated');
  const rescued = apply(defeated, { type: 'rescue' });
  assert.equal(rescued.phase, 'camp'); assert.equal(rescued.player.level, defeated.player.level); assert.equal(rescued.seals, defeated.seals);
  assert.equal(rescued.player.gold, defeated.player.gold - Math.floor(defeated.player.gold * 0.25));
  assert.equal(rescued.player.inventory.thread >= 1, true);
  const entered = apply(rescued, { type: 'enter' }); assert.equal(entered.floor, 0); assert.equal(entered.position, 0); assert.equal(entered.phase, 'explore');
});

test('save/load keeps battle HP, intent and RNG; malformed and semantically broken saves fail safely', () => {
  let s = apply(createGame(33), { type: 'enter' }); s = walk(s, s.floors[0].exit, false); s = apply(s, { type: 'interact' }); s = apply(s, { type: 'attack' });
  const loaded = parseGame(serializeGame(s)); assert.deepEqual(loaded, s);
  assert.deepEqual(dispatch(loaded, { type: 'defend' }), dispatch(s, { type: 'defend' }));
  const values = new Map<string, string>(), storage = { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { values.set(k, v); }, removeItem: (k: string) => { values.delete(k); } };
  assert.equal(loadGame(storage).status, 'empty'); assert.equal(saveGame(s, storage).ok, true); assert.equal(loadGame(storage).status, 'ok');
  for (const raw of ['{', '{}', serializeGame(s).replace('ancient-kingdom', 'other'), serializeGame(s).replace('checksum', 'bad')]) { values.set(SAVE_KEY, raw); assert.equal(loadGame(storage).status, 'error'); assert.equal(values.get(SAVE_KEY), raw); }
  for (const mutate of [(c: GameState) => { c.position = 999; }, (c: GameState) => { c.player.hp = -1; }, (c: GameState) => { c.floors[0].cells[0].walls ^= 1; }, (c: GameState) => { c.seals = 3; }, (c: GameState) => { c.player.skills.push('holy'); }]) { const c = structuredClone(s); mutate(c); assert.throws(() => serializeGame(c)); }
  const unavailable = { ...storage, setItem: () => { throw new Error('quota'); } }; assert.equal(saveGame(s, unavailable).ok, false);
});

test('camp purchase/upgrade prices, free recovery and minimum return thread prevent resource dead ends', () => {
  let s = apply(createGame(77), { type: 'enter' });
  s = walk(s, s.floors[0].chest, false); s = apply(s, { type: 'interact' });
  const progress = structuredClone(s.floors);
  s = apply(s, { type: 'item', item: 'thread' });
  assert.equal(s.phase, 'camp'); assert.equal(s.player.inventory.thread, 1); assert.deepEqual(s.floors, progress);
  const gold = s.player.gold, price = getStats(s).upgradePrice, attack = getStats(s).attack;
  s = apply(s, { type: 'upgrade' }); assert.equal(s.player.gold, gold - price); assert.equal(getStats(s).attack, attack + 2);
  const potions = s.player.inventory.potion, before = s.player.gold;
  s = apply(s, { type: 'buy', item: 'potion' }); assert.equal(s.player.inventory.potion, potions + 1); assert.equal(s.player.gold, before - 12);
  assert.equal(dispatch(s, { type: 'upgrade' }).ok, false);
  s = apply(s, { type: 'rest' }); assert.equal(s.player.hp, getStats(s).maxHp); assert.equal(s.player.mp, getStats(s).maxMp);
  s = apply(s, { type: 'enter' }); assert.equal(s.position, 0); assert.equal(s.phase, 'explore');
  s = apply(s, { type: 'interact' }); assert.equal(s.phase, 'camp', 'B1 entry returns to camp only on explicit interact');
});

test('all three origins can finish five floors by ordinary commands on three seeds, with stable round trips and no repeated boss reward', () => {
  for (const seed of [1, 2007, 2026]) for (const origin of Object.keys(ORIGINS) as OriginId[]) {
    let s = apply(createGame(seed, origin), { type: 'enter' });
    for (let floor = 0; floor < 5; floor++) {
      const f = s.floors[floor];
      s = walk(s, f.chest); s = apply(s, { type: 'interact' });
      s = walk(s, f.fountain); s = apply(s, { type: 'interact' });
      assert.equal(dispatch(s, { type: 'interact' }).ok, false, 'fountains are one use');
      s = walk(s, f.exit);
      // Preparation uses only normal memory and consumable commands.
      const weakness: SkillId = (['water', 'earth', 'fire', 'wind', 'dark'] as SkillId[])[floor];
      if (!s.player.skills.includes(weakness)) {
        for (const id of [...s.player.skills]) if (id !== 'holy') s = apply(s, { type: 'forget', skill: id });
        s = apply(s, { type: 'memorize', skill: weakness });
      }
      if (s.player.mp < 7 && s.player.inventory.ether) s = apply(s, { type: 'item', item: 'ether' });
      s = apply(s, { type: 'interact' }); s = fight(s);
      assert.equal(s.floors[floor].bossDefeated, true);
      assert.equal(s.seals, Math.min(3, floor + 1));
      if (floor < 4) {
        const xp = s.player.xp, gold = s.player.gold;
        s = apply(s, { type: 'interact' }); assert.equal(s.floor, floor + 1); assert.equal(s.position, 0);
        assert.equal(s.floors[s.floor].cells[s.position].walls & (1 << s.direction), 0, 'descent faces a passage');
        assert.equal(s.phase, 'explore', 'stairs never auto-trigger at entrance');
        s = apply(s, { type: 'interact' }); assert.equal(s.floor, floor); assert.equal(s.position, s.floors[floor].exit);
        assert.equal(s.floors[s.floor].cells[s.position].walls & (1 << s.direction), 0, 'ascent faces a passage');
        assert.equal(s.player.xp, xp); assert.equal(s.player.gold, gold); assert.equal(s.battle, null);
        s = apply(s, { type: 'interact' });
      }
      s = parseGame(serializeGame(s));
    }
    assert.equal(s.phase, 'ending'); assert.equal(s.cleared, true); assert.equal(s.stats.rescues, 0); assert.equal(s.stats.treasures, 5);
    const reward = s.player.gold;
    s = apply(s, { type: 'continue' }); assert.equal(dispatch(s, { type: 'interact' }).ok, false); assert.equal(s.player.gold, reward);
    s = apply(s, { type: 'item', item: 'thread' }); assert.equal(s.phase, 'camp'); assert.equal(s.player.inventory.thread, 1);
    s = apply(s, { type: 'enter' }); assert.equal(s.phase, 'explore'); assert.equal(s.floor, 0); assert.equal(s.position, 0);
    console.log(`clear seed=${seed} origin=${origin} LV=${s.player.level} steps=${s.stats.steps} battles=${s.stats.battles}`);
  }
});
