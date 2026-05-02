process.env.TZ = 'America/Argentina/Buenos_Aires'
import '@testing-library/jest-dom'

// Mock localStorage for jsdom environment
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (i: number) => Object.keys(store)[i] ?? null,
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })

// Mock ResizeObserver so Recharts ResponsiveContainer doesn't crash in jsdom.
// Required by recharts@3.8.1's <ResponsiveContainer> internal layout effect.
// See .planning/phases/12-ranking-line-chart-leaderboard/12-CONTEXT.md D-01.
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
