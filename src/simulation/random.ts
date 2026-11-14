export function normalizeSeed(seed: number): number { return (seed >>> 0) || 0x6d2b79f5; }
export function random(source: { rng: number }): number {
  let x = source.rng;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  source.rng = x >>> 0;
  return source.rng / 0x100000000;
}
