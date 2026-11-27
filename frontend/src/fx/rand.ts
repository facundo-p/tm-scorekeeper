/** PRNG determinístico (mulberry32), igual al del mockup: el cielo sale idéntico en cada carga. */
export function rng(seed = 1): () => number {
  let a = seed >>> 0
  return function mulberry32() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
