import { Minus, Plus, ShoppingBasket, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import ProductImage from '../../products/components/product-image'
import { formatMmk } from '../../../utils/format'
import { formatPosTotal, getCartAddError, getPosTotal, toPosMinorUnits, type PosCartLine } from '../pos-cart'

type Props = {
  lines: PosCartLine[]
  onIncrease: (line: PosCartLine) => void
  onDecrease: (id: string) => void
  onRemove: (id: string) => void
  onClear: () => void
  children?: ReactNode
}

export default function PosCartPanel({ lines, onIncrease, onDecrease, onRemove, onClear, children }: Props) {
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0)

  return (
    <section aria-labelledby="pos-cart-title" className="min-w-0 rounded-panel border border-border bg-surface lg:sticky lg:top-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4 sm:px-5">
        <div className="flex items-center gap-2">
          <h2 id="pos-cart-title" className="text-lg font-semibold text-heading">Sale cart</h2>
          <span className="text-sm text-muted">({itemCount.toLocaleString('en-US')} {itemCount === 1 ? 'item' : 'items'})</span>
        </div>
        {lines.length > 0 && (
          <button type="button" onClick={onClear} className="min-h-9 rounded-control border border-input-border px-3 text-sm font-medium hover:bg-surface-muted">Clear cart</button>
        )}
      </div>
      {lines.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center px-4 py-8 text-center">
          <ShoppingBasket size={28} strokeWidth={1.5} aria-hidden="true" className="mb-3 text-muted" />
          <p className="font-semibold text-heading">Cart is empty</p>
          <p className="mt-1 text-sm text-muted">Choose a product and selling unit to add it.</p>
        </div>
      ) : (
        <ul aria-label="Cart items" className="max-h-[55dvh] divide-y divide-border overflow-y-auto px-4 sm:px-5">
          {lines.map((line) => {
            const label = `${line.productName}, ${line.unitName}`
            const limit = getCartAddError(lines, line)
            return (
              <li key={line.productUnitId} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 py-4">
                <ProductImage imagePath={line.imagePath} name={line.productName} className="size-10" />
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-semibold wrap-anywhere text-heading">{line.productName}</p>
                    <button type="button" onClick={() => onRemove(line.productUnitId)} aria-label={`Remove ${label}`} className="shrink-0 rounded-control p-1.5 text-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={15} aria-hidden="true" /></button>
                  </div>
                  <p className="text-xs wrap-anywhere text-muted">{line.unitName} · {formatMmk(line.unitPrice)} each</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center rounded-control border border-input-border">
                      <button type="button" onClick={() => onDecrease(line.productUnitId)} aria-label={`Decrease ${label}`} className="flex size-8 items-center justify-center rounded-control hover:bg-surface-muted"><Minus size={14} aria-hidden="true" /></button>
                      <span className="min-w-8 px-1 text-center font-medium tabular-nums">{line.quantity.toLocaleString('en-US')}</span>
                      <button type="button" disabled={Boolean(limit)} onClick={() => onIncrease(line)} aria-label={`Increase ${label}`} className="flex size-8 items-center justify-center rounded-control text-primary hover:bg-primary-soft disabled:opacity-40"><Plus size={14} aria-hidden="true" /></button>
                    </div>
                    <span className="font-semibold tabular-nums text-heading">{formatPosTotal(toPosMinorUnits(line.unitPrice) * BigInt(line.quantity))}</span>
                  </div>
                  {limit && <p className="mt-1 text-xs text-muted">{limit}</p>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <div aria-live="polite" className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-primary-soft px-4 py-4 sm:px-5">
        <span className="font-semibold text-heading">Estimated total</span>
        <strong className="text-xl font-semibold tabular-nums text-primary">{formatPosTotal(getPosTotal(lines))}</strong>
      </div>
      {children}
    </section>
  )
}
