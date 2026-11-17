import { toBlob } from 'html-to-image'

export function exportFilename(period?: string) {
  const suffix = (period || new Date().toISOString().slice(0, 7)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `light-bill-${suffix || 'bill'}.png`
}

export async function downloadPng(element: HTMLElement, filename: string) {
  await document.fonts?.ready
  const width = Math.max(900, element.scrollWidth)
  const height = element.scrollHeight
  const maxPixels = 28_000_000
  const ratio = Math.max(1, Math.min(3, Math.sqrt(maxPixels / (width * height))))
  const blob = await toBlob(element, { backgroundColor: '#fff', pixelRatio: ratio, cacheBust: true, width, height,
    style: { width: `${width}px`, height: `${height}px` } })
  if (!blob) throw new Error('The browser could not create the image.')
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename
  document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

