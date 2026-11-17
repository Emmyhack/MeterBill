import type { BillDocument, BillRow } from '../types'

export const DEFAULT_RATE = '227.27'
export const makeId = () => crypto.randomUUID()
export const unitNames = ['Shop 1', 'Shop 2', 'Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5', 'Room 6']
export const emptyRow = (label = 'New Unit'): BillRow => ({ id: makeId(), label, newReading: '', oldReading: '', rowSpecificCharges: [], paymentStatus: 'unpaid', amountPaid: '' })
export function newDocument(): BillDocument {
  const now = new Date().toISOString()
  return { version: 1, id: makeId(), title: `${new Date().toLocaleString('en', { month: 'long', year: 'numeric' })} Electricity Bill`,
    billingPeriod: '', currency: 'NGN', currencySymbol: '₦', ratePerKwh: DEFAULT_RATE,
    rows: unitNames.map(emptyRow), charges: [], roundingPolicy: 'minor_unit', createdAt: now, updatedAt: now, notes: '' }
}
export function sampleDocument(): BillDocument {
  const document = newDocument()
  const readings: [string, string][] = [['18.4','11.9'],['632.7','621.8'],['692.9','686.2'],['692.4','684.4'],['522.5','514.8'],['392.9','387.1'],['731.9','717.3'],['150.7','148.6']]
  document.rows = document.rows.map((row, index) => ({ ...row, newReading: readings[index]![0], oldReading: readings[index]![1] }))
  document.title = 'November 2026 Electricity Bill'; document.billingPeriod = 'November 2026'; document.ratePerKwh = DEFAULT_RATE
  return document
}
