import Decimal from 'decimal.js'

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP, toExpNeg: -30, toExpPos: 40 })
export { Decimal }

export const DECIMAL_PATTERN = /^\d{1,12}(?:\.\d{1,6})?$/

export function parseDecimal(value: string, field: string, allowZero = true): Decimal {
  const text = value.trim()
  if (!DECIMAL_PATTERN.test(text)) throw new Error(`${field} must be a non-negative number with up to 6 decimal places`)
  const valueDecimal = new Decimal(text)
  if (valueDecimal.isNegative() || (!allowZero && valueDecimal.isZero())) throw new Error(`${field} must be ${allowZero ? 'zero or greater' : 'greater than zero'}`)
  return valueDecimal
}

export function toMinor(value: Decimal): bigint {
  return BigInt(value.mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0))
}

export function minorToString(value: bigint): string {
  const negative = value < 0n
  const abs = negative ? -value : value
  return `${negative ? '-' : ''}${abs / 100n}.${(abs % 100n).toString().padStart(2, '0')}`
}

export function formatMinor(value: bigint): string {
  const decimal = minorToString(value)
  const [whole, fraction] = decimal.split('.') as [string, string]
  const sign = whole.startsWith('-') ? '-' : ''
  const digits = sign ? whole.slice(1) : whole
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `₦${sign}${grouped}.${fraction}`
}
