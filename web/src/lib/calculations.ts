import { Decimal, parseDecimal, toMinor } from './decimal'
import { allocateLargestRemainder } from './allocations'
import type { BillDocument, BillResult, BillRow } from '../types'

const zeroAllocations = (ids: string[]) => Object.fromEntries(ids.map(id => [id, 0n])) as Record<string, bigint>

function rowConsumption(row: BillRow): Decimal {
  const current = parseDecimal(row.newReading, `${row.label} current reading`)
  const previous = parseDecimal(row.oldReading, `${row.label} previous reading`)
  if (current.lt(previous)) throw new Error(`${row.label}: current reading cannot be less than previous reading`)
  return current.minus(previous)
}

export function calculateBill(document: BillDocument): BillResult {
  const errors: string[] = []
  let rate = new Decimal(0)
  try { rate = parseDecimal(document.ratePerKwh, 'Cost per unit', false) } catch (error) { errors.push((error as Error).message) }
  const consumptions = document.rows.map(row => {
    try { return rowConsumption(row) } catch (error) { errors.push((error as Error).message); return new Decimal(0) }
  })
  const ids = document.rows.map(row => row.id)
  // Reconcile row energy cents to the bill-wide exact tariff calculation. This
  // assigns any sub-kobo residual using the same deterministic largest-remainder
  // rule as shared charges, while retaining the transparent row formula.
  const totalEnergyMinor = toMinor(consumptions.reduce((total, value) => total.plus(value.mul(rate)), new Decimal(0)))
  const reconciledEnergy = allocateLargestRemainder(totalEnergyMinor, ids, consumptions)
  const allocations: Record<string, Record<string, bigint>> = {}
  for (const charge of document.charges) {
    const allocation = zeroAllocations(ids)
    try {
      const amountMinor = toMinor(parseDecimal(charge.amount, `${charge.description || 'Charge'} amount`))
      const included = ids.filter(id => !charge.includedRowIds || charge.includedRowIds.includes(id))
      if (!charge.description.trim()) throw new Error('Every charge needs a description')
      if (!included.length) throw new Error(`${charge.description}: select at least one unit`)
      if (charge.applicationMode === 'per_unit') included.forEach(id => { allocation[id] = amountMinor })
      if (charge.applicationMode === 'single_unit') {
        if (!charge.targetRowId || !ids.includes(charge.targetRowId)) throw new Error(`${charge.description}: select a target unit`)
        allocation[charge.targetRowId] = amountMinor
      }
      if (charge.applicationMode === 'shared_equal') Object.assign(allocation, allocateLargestRemainder(amountMinor, included, included.map(() => new Decimal(1))))
      if (charge.applicationMode === 'shared_consumption') {
        const weights = included.map(id => consumptions[ids.indexOf(id)]!)
        Object.assign(allocation, allocateLargestRemainder(amountMinor, included, weights))
      }
    } catch (error) { errors.push((error as Error).message) }
    allocations[charge.id] = allocation
  }
  const rows = document.rows.map((row, index) => {
    const energyMinor = reconciledEnergy[row.id] ?? toMinor(consumptions[index]!.mul(rate))
    let extraMinor = document.charges.reduce((sum, charge) => sum + (allocations[charge.id]?.[row.id] ?? 0n), 0n)
    for (const charge of row.rowSpecificCharges ?? []) {
      try { extraMinor += toMinor(parseDecimal(charge.amount, `${row.label} ${charge.description || 'extra charge'}`)) } catch (error) { errors.push((error as Error).message) }
    }
    const preRoundMinor = energyMinor + extraMinor
    const totalMinor = document.roundingPolicy === 'nearest_100'
      ? ((preRoundMinor + 5000n) / 10000n) * 10000n : preRoundMinor
    let paidMinor = 0n
    if (row.amountPaid?.trim()) try { paidMinor = toMinor(parseDecimal(row.amountPaid, `${row.label} amount paid`)) } catch (error) { errors.push((error as Error).message) }
    return { id: row.id, consumption: consumptions[index]!.toFixed(), energyMinor, extraMinor, preRoundMinor,
      roundingAdjustmentMinor: totalMinor - preRoundMinor, totalMinor, paidMinor, balanceMinor: totalMinor - paidMinor }
  })
  const sum = (field: 'energyMinor'|'extraMinor'|'preRoundMinor'|'roundingAdjustmentMinor'|'totalMinor'|'paidMinor'|'balanceMinor') => rows.reduce((total, row) => total + row[field], 0n)
  return { rows, totalConsumption: consumptions.reduce((total, value) => total.plus(value), new Decimal(0)).toFixed(),
    energySubtotalMinor: sum('energyMinor'), chargesSubtotalMinor: sum('extraMinor'), preRoundGrandTotalMinor: sum('preRoundMinor'),
    roundingAdjustmentMinor: sum('roundingAdjustmentMinor'), grandTotalMinor: sum('totalMinor'), totalPaidMinor: sum('paidMinor'),
    balanceMinor: sum('balanceMinor'), allocations, errors }
}
