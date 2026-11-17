import type { BillDocument } from '../types'
const KEY = 'light-bill:draft:v1'
export function saveDraft(document: BillDocument) { localStorage.setItem(KEY, JSON.stringify({ ...document, updatedAt: new Date().toISOString() })) }
export function loadDraft(): BillDocument | null {
  try { const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null'); if (!value || typeof value !== 'object' || (value as BillDocument).version !== 1 || !Array.isArray((value as BillDocument).rows)) return null; return value as BillDocument } catch { return null }
}
export function clearDraft() { localStorage.removeItem(KEY) }

