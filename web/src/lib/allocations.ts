import { Decimal, toMinor } from './decimal'

export function allocateLargestRemainder(totalMinor: bigint, ids: string[], weights: Decimal[]): Record<string, bigint> {
  const result: Record<string, bigint> = {}
  ids.forEach(id => { result[id] = 0n })
  if (!ids.length || totalMinor === 0n) return result
  const totalWeight = weights.reduce((sum, weight) => sum.plus(weight), new Decimal(0))
  if (totalWeight.isZero()) throw new Error('Cannot allocate by consumption when all usage is zero')
  const exact = weights.map(weight => new Decimal(totalMinor.toString()).mul(weight).div(totalWeight))
  const floors = exact.map(value => BigInt(value.floor().toFixed(0)))
  let remainder = totalMinor - floors.reduce((sum, value) => sum + value, 0n)
  const order = ids.map((id, index) => ({ id, index, fraction: exact[index]!.minus(floors[index]!.toString()) }))
    .sort((a, b) => b.fraction.comparedTo(a.fraction) || a.index - b.index || a.id.localeCompare(b.id))
  floors.forEach((value, index) => { result[ids[index]!] = value })
  for (let index = 0; remainder > 0n; index++, remainder--) result[order[index % order.length]!.id]! += 1n
  return result
}

export function amountToMinor(amount: string, field = 'Charge amount'): bigint {
  const { parseDecimal } = requireDecimal()
  return toMinor(parseDecimal(amount, field))
}

// Kept synchronous and tree-shakeable without introducing floating-point conversion.
function requireDecimal() { return { parseDecimal: (value: string, field: string) => {
  if (!/^\d{1,12}(?:\.\d{1,6})?$/.test(value.trim())) throw new Error(`${field} is invalid`)
  const decimal = new Decimal(value.trim())
  if (decimal.isNegative()) throw new Error(`${field} cannot be negative`)
  return decimal
} } }

