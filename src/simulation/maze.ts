import { FLOORS } from '../data/game';
import type { Direction, FloorState } from './types';
import { normalizeSeed, random } from './random';
export const DX = [0, 1, 0, -1] as const;
export const DY = [-1, 0, 1, 0] as const;
export function neighbor(cell: number, direction: Direction, size: number): number {
  const x = cell % size + DX[direction], y = Math.floor(cell / size) + DY[direction];
  return x < 0 || y < 0 || x >= size || y >= size ? -1 : y * size + x;
}
export function accessibleNeighbors(floor: FloorState, cell: number): number[] {
  return ([0, 1, 2, 3] as Direction[]).filter(d => !(floor.cells[cell].walls & (1 << d))).map(d => neighbor(cell, d, floor.size));
}
export function distances(floor: FloorState, start: number): number[] {
  const result = Array(floor.cells.length).fill(-1); result[start] = 0;
  const queue = [start];
  for (let head = 0; head < queue.length; head++) for (const next of accessibleNeighbors(floor, queue[head])) if (result[next] < 0) { result[next] = result[queue[head]] + 1; queue.push(next); }
  return result;
}
export function generateFloor(seed: number, index: number): FloorState {
  const size = FLOORS[index].size;
  const floor: FloorState = { index, size, cells: Array.from({ length: size * size }, () => ({ walls: 15, explored: false })), entrance: 0, exit: 0, fountain: 0, chest: 0, fountainUsed: false, chestOpened: false, bossDefeated: false };
  const source = { rng: normalizeSeed(seed ^ Math.imul(index + 1, 0x9e3779b9)) };
  const visited = new Set([0]), stack = [0];
  const open = (a: number, b: number, d: Direction) => { floor.cells[a].walls &= ~(1 << d); floor.cells[b].walls &= ~(1 << ((d + 2) % 4)); };
  while (stack.length) {
    const current = stack[stack.length - 1];
    const options = ([0, 1, 2, 3] as Direction[]).filter(d => { const n = neighbor(current, d, size); return n >= 0 && !visited.has(n); });
    if (!options.length) { stack.pop(); continue; }
    const d = options[Math.floor(random(source) * options.length)], next = neighbor(current, d, size);
    open(current, next, d); visited.add(next); stack.push(next);
  }
  // A few loops shorten retracing without weakening grid collision guarantees.
  for (let i = 0; i < size; i++) {
    const a = Math.floor(random(source) * size * size), d = Math.floor(random(source) * 4) as Direction, b = neighbor(a, d, size);
    if (b >= 0) open(a, b, d);
  }
  const depth = distances(floor, 0), ordered = depth.map((distance, cell) => ({ distance, cell })).sort((a, b) => b.distance - a.distance || a.cell - b.cell);
  floor.exit = ordered[0].cell;
  floor.chest = ordered[Math.floor(ordered.length * 0.3)].cell;
  floor.fountain = ordered[Math.floor(ordered.length * 0.55)].cell;
  floor.cells[0].explored = true;
  return floor;
}
