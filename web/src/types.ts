export type RoundingPolicy = 'minor_unit' | 'nearest_100'
export type PaymentStatus = 'unpaid' | 'paid' | 'partial'
export type ChargeMode = 'per_unit' | 'shared_equal' | 'single_unit' | 'shared_consumption'

export interface BillRow {
  id: string
  label: string
  newReading: string
  oldReading: string
  rowSpecificCharges: RowCharge[]
  paymentStatus?: PaymentStatus
  amountPaid?: string
}
export interface RowCharge { id: string; description: string; amount: string }
export interface Charge {
  id: string
  description: string
  amount: string
  applicationMode: ChargeMode
  targetRowId?: string
  includedRowIds?: string[]
  allocationWeights?: Record<string, string>
}
export interface BillDocument {
  version: 1
  id: string
  title: string
  billingPeriod?: string
  currency: 'NGN'
  currencySymbol: '₦'
  ratePerKwh: string
  rows: BillRow[]
  charges: Charge[]
  roundingPolicy: RoundingPolicy
  createdAt: string
  updatedAt: string
  notes?: string
}
export interface RowResult {
  id: string; consumption: string; energyMinor: bigint; extraMinor: bigint; preRoundMinor: bigint
  roundingAdjustmentMinor: bigint; totalMinor: bigint; paidMinor: bigint; balanceMinor: bigint
}
export interface BillResult {
  rows: RowResult[]; totalConsumption: string; energySubtotalMinor: bigint; chargesSubtotalMinor: bigint
  preRoundGrandTotalMinor: bigint; roundingAdjustmentMinor: bigint; grandTotalMinor: bigint
  totalPaidMinor: bigint; balanceMinor: bigint; allocations: Record<string, Record<string, bigint>>; errors: string[]
}

