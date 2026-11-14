export type Axis = readonly [number, number, number];
export type OriginId = 'flame' | 'gale' | 'spring';
export type SkillId = 'fire' | 'water' | 'wind' | 'earth' | 'holy' | 'dark';
export const ORIGINS: Record<OriginId, { name: string; description: string; affinity: Axis }> = {
  flame: { name: '灯火', description: '火と土に親しい、消えない灯火の記憶。', affinity: [1, -0.5, 0] },
  gale: { name: '疾風', description: '風と闇に親しい、自由を求める記憶。', affinity: [0, 1, -0.5] },
  spring: { name: '聖泉', description: '水と聖に親しい、癒やしの記憶。', affinity: [-1, 0, 1] },
};
export interface Skill { id: SkillId; name: string; element: string; affinity: Axis; mp: number; power: number; kind: 'damage' | 'heal' | 'drain'; description: string }
export const SKILLS: Record<SkillId, Skill> = {
  fire: { id: 'fire', name: '灯火の矢', element: '火', affinity: [1, 0, 0], mp: 3, power: 15, kind: 'damage', description: '火の矢を放つ。水の敵に強い。' },
  water: { id: 'water', name: '氷泉の槍', element: '水', affinity: [-1, 0, 0], mp: 3, power: 15, kind: 'damage', description: '冷たい槍を放つ。火の敵に強い。' },
  wind: { id: 'wind', name: '風葬の刃', element: '風', affinity: [0, 1, 0], mp: 3, power: 15, kind: 'damage', description: '風の刃を放つ。土の敵に強い。' },
  earth: { id: 'earth', name: '岩盤の拳', element: '土', affinity: [0, -1, 0], mp: 3, power: 15, kind: 'damage', description: '岩を打ち込む。風の敵に強い。' },
  holy: { id: 'holy', name: '聖泉の祈り', element: '聖', affinity: [0, 0, 1], mp: 4, power: 24, kind: 'heal', description: 'HPを回復する。戦闘外でも使える。' },
  dark: { id: 'dark', name: '夜陰の吸命', element: '闇', affinity: [0, 0, -1], mp: 4, power: 14, kind: 'drain', description: '闇で傷つけ、与えた傷の半分を吸収。聖の敵に強い。' },
};
export type EnemyId = 'rat' | 'ember' | 'wisp' | 'sentinel' | 'shade' | 'gargoyle' | 'warden1' | 'warden2' | 'warden3' | 'whiteKnight' | 'king';
export interface Enemy { id: EnemyId; name: string; hp: number; attack: number; defense: number; xp: number; gold: number; affinity: Axis; element: string; weakness: string; pattern: readonly ('attack' | 'heavy' | 'guard')[]; art: string; description: string }
const enemy = (id: EnemyId, name: string, hp: number, attack: number, defense: number, xp: number, gold: number, affinity: Axis, element: string, weakness: string, pattern: Enemy['pattern'], art: string, description: string): Enemy => ({ id, name, hp, attack, defense, xp, gold, affinity, element, weakness, pattern, art, description });
export const ENEMIES: Record<EnemyId, Enemy> = {
  rat: enemy('rat', '廃都の鼠', 15, 6, 1, 12, 9, [0, 0, -1], '闇', '聖（攻撃魔法は等倍）', ['attack', 'attack', 'heavy'], 'rat', '瓦礫を這う、都の小さな影。'),
  ember: enemy('ember', '灰の灯霊', 22, 8, 1, 16, 12, [1, 0, 0], '火', '水', ['attack', 'heavy', 'guard'], 'ember', '消えた灯火に宿った残響。'),
  wisp: enemy('wisp', '風葬の書霊', 27, 10, 2, 20, 15, [0, 1, 0], '風', '土', ['guard', 'attack', 'heavy'], 'wisp', '書庫の頁を巻き上げる亡霊。'),
  sentinel: enemy('sentinel', '土塊の衛士', 35, 12, 4, 25, 18, [0, -1, 0], '土', '風', ['attack', 'guard', 'heavy'], 'sentinel', '命令だけを覚えている歩哨。'),
  shade: enemy('shade', '聖堂の影', 39, 15, 3, 30, 21, [0, 0, -1], '闇', '聖（攻撃魔法は等倍）', ['heavy', 'attack', 'guard'], 'shade', '祈りをなくした聖堂の影。'),
  gargoyle: enemy('gargoyle', '氷翼の石像', 46, 17, 5, 35, 25, [-1, 0, 0], '水', '火', ['guard', 'heavy', 'attack'], 'gargoyle', '冷たい翼を広げる玉座の番。'),
  warden1: enemy('warden1', '灯火の守護者', 48, 9, 2, 45, 35, [1, 0, 0], '火', '水', ['attack', 'heavy', 'guard'], 'warden1', '第一王印を守る灯火。'),
  warden2: enemy('warden2', '書庫の守護者', 70, 13, 3, 65, 45, [0, 1, 0], '風', '土', ['attack', 'guard', 'heavy'], 'warden2', '第二王印を守る風。'),
  warden3: enemy('warden3', '灰燼の司祭', 96, 17, 4, 90, 60, [0, 0, -1], '闇', '聖（攻撃魔法は等倍）', ['attack', 'heavy', 'attack', 'guard'], 'warden3', '第三王印を抱く、最後の祈り。'),
  whiteKnight: enemy('whiteKnight', '白い斧騎士', 125, 21, 6, 120, 85, [0, -1, 0], '土', '風', ['guard', 'heavy', 'attack', 'heavy'], 'whiteKnight', '王を守り続けた、白い衛士。'),
  king: enemy('king', '忘却の王', 165, 25, 7, 180, 150, [0, 0, 1], '聖', '闇', ['attack', 'heavy', 'guard', 'heavy'], 'king', '滅びの夜を封じた王。記憶を解き放て。'),
};
export const FLOORS = [
  { name: '忘却の回廊', size: 6, boss: 'warden1', enemies: ['rat', 'ember'] },
  { name: '風葬の書庫', size: 7, boss: 'warden2', enemies: ['ember', 'wisp'] },
  { name: '灰燼の礼拝堂', size: 8, boss: 'warden3', enemies: ['wisp', 'sentinel', 'shade'] },
  { name: '白衛士の墓所', size: 8, boss: 'whiteKnight', enemies: ['sentinel', 'shade'] },
  { name: '王の眠る玉座', size: 9, boss: 'king', enemies: ['shade', 'gargoyle'] },
] as const;
export const ITEMS = {
  potion: { name: '回復薬', price: 12, description: 'HPを35回復。戦闘中は1ターンを使う。' },
  ether: { name: '魔力薬', price: 16, description: 'MPを14回復。戦闘中は1ターンを使う。' },
  thread: { name: '帰還糸', price: 10, description: '探索中に拠点へ戻る。拠点で最低1個を無料補給。' },
} as const;
export type ItemId = keyof typeof ITEMS;
