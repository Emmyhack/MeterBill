import '@testing-library/jest-dom/vitest'

if (!globalThis.localStorage) {
  const values = new Map<string, string>()
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
    clear: () => values.clear(),
    key: index => [...values.keys()][index] ?? null,
    get length() { return values.size },
  }
}
