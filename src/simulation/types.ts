import type { EnemyId, ItemId, OriginId, SkillId } from '../data/game';
export type Direction = 0 | 1 | 2 | 3; // north, east, south, west
export interface Cell { walls: number; explored: boolean }
export interface FloorState { index: number; size: number; cells: Cell[]; entrance: number; exit: number; fountain: number; chest: number; fountainUsed: boolean; chestOpened: boolean; bossDefeated: boolean }
export interface Player { origin: OriginId; level: number; xp: number; hp: number; mp: number; gold: number; weapon: number; skills: SkillId[]; inventory: Record<ItemId, number> }
export interface Battle { enemyId: EnemyId; hp: number; turn: number; boss: boolean; intent: 'attack' | 'heavy' | 'guard' }
export interface GameState { version: 1; seed: number; rng: number; phase: 'camp' | 'explore' | 'battle' | 'defeated' | 'ending'; floor: number; position: number; direction: Direction; floors: FloorState[]; player: Player; battle: Battle | null; seals: number; cleared: boolean; encounterSteps: number; encounterGrace: number; stats: { steps: number; battles: number; victories: number; escapes: number; rescues: number; treasures: number }; log: string[] }
export type Action =
  | { type: 'enter' | 'interact' | 'attack' | 'defend' | 'flee' | 'rest' | 'upgrade' | 'rescue' | 'continue' }
  | { type: 'move'; backward?: boolean }
  | { type: 'turn'; delta: -1 | 1 }
  | { type: 'skill' | 'memorize' | 'forget'; skill: SkillId }
  | { type: 'item' | 'buy'; item: ItemId };
export interface GameEvent { type: 'move' | 'turn' | 'blocked' | 'battleStart' | 'damage' | 'heal' | 'victory' | 'levelUp' | 'defeat' | 'floor' | 'treasure' | 'ending' | 'camp' | 'escape' | 'memory'; text: string; amount?: number }
export interface ActionResult { state: GameState; ok: boolean; message: string; events: GameEvent[] }
