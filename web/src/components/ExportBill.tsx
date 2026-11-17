import type { BillDocument, BillResult } from '../types'
import { formatMinor } from '../lib/decimal'

const modeLabel = { per_unit: 'each included unit', shared_equal: 'shared equally', single_unit: 'one unit', shared_consumption: 'by consumption' }
export function ExportBill({ document, result, exportRef }: { document: BillDocument; result: BillResult; exportRef: React.RefObject<HTMLDivElement | null> }) {
  return <div className="export-shell" aria-hidden="true"><article ref={exportRef} className="export-bill">
    <header><div><p className="eyebrow">LIGHT BILL</p><h1>{document.title || 'Electricity Bill'}</h1><p>{document.billingPeriod || 'Billing period not specified'}</p></div><div className="export-meta"><strong>Tariff {document.currencySymbol}{document.ratePerKwh}/kWh</strong><span>Prepared {new Date().toLocaleDateString('en-NG')}</span></div></header>
    <table><thead><tr><th>Unit</th><th>New</th><th>Old</th><th>Used</th><th>Energy</th><th>Extras</th><th>Total</th></tr></thead><tbody>
      {document.rows.map((row, index) => { const value = result.rows[index]!; return <tr key={row.id}><td>{row.label}</td><td>{row.newReading || '—'}</td><td>{row.oldReading || '—'}</td><td>{value.consumption}</td><td>{formatMinor(value.energyMinor)}</td><td>{formatMinor(value.extraMinor)}</td><td><strong>{formatMinor(value.totalMinor)}</strong></td></tr> })}
    </tbody><tfoot><tr><th colSpan={3}>Totals</th><th>{result.totalConsumption}</th><th>{formatMinor(result.energySubtotalMinor)}</th><th>{formatMinor(result.chargesSubtotalMinor)}</th><th>{formatMinor(result.grandTotalMinor)}</th></tr></tfoot></table>
    {document.roundingPolicy === 'nearest_100' && <p className="export-note">Nearest ₦100 collection policy · Pre-rounding {formatMinor(result.preRoundGrandTotalMinor)} · Adjustment {formatMinor(result.roundingAdjustmentMinor)}</p>}
    {document.charges.length > 0 && <section className="export-note"><strong>Added charges:</strong> {document.charges.map(c => `${c.description} (${modeLabel[c.applicationMode]})`).join(' · ')}</section>}
    {document.notes && <p className="export-note"><strong>Note:</strong> {document.notes}</p>}
    <footer>Calculated from meter readings · Amount paid does not change the billed total.</footer>
  </article></div>
}

