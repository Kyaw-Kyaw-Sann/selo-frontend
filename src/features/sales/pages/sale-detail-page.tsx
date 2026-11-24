import { isAxiosError } from 'axios'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../../../components/shared/empty-state'
import ErrorState from '../../../components/shared/error-state'
import LoadingState from '../../../components/shared/loading-state'
import PageHeader from '../../../components/shared/page-header'
import { formatMmk, formatUtcDateTime } from '../../../utils/format'
import { useSessionQuery } from '../../auth/auth.queries'
import { isSaleReferenceId } from '../sales.filters'
import { useSaleQuery } from '../sales.queries'

export default function SaleDetailPage() {
  const { id = '' } = useParams()
  const { data: user } = useSessionQuery()
  const validId = isSaleReferenceId(id)
  const query = useSaleQuery(validId ? id : '', user)

  let content
  if (!validId) {
    content = <ErrorState title="Invalid sale ID" message="Open a sale from the history list" />
  } else if (query.isPending) {
    content = <LoadingState message="Loading receipt…" />
  } else if (query.isError) {
    const status = isAxiosError(query.error) ? query.error.response?.status : undefined
    if (status === 404) {
      content = <ErrorState title="Sale not found" message="This sale is no longer available" />
    } else if (status === 403) {
      content = <ErrorState title="Permission denied" message="You do not have permission to view this receipt" />
    } else {
      content = <ErrorState title="Unable to load receipt" onRetry={() => void query.refetch()} isRetrying={query.isFetching} />
    }
  } else {
    const { saleNo, cashierName, completedAt, payment, items, subtotal, totalPayable } = query.data
    const showCosts = user?.role === 'OWNER' && items.some((item) => item.unitCostSnapshot !== undefined)
    content = (
      <div className="space-y-6">
        <section aria-labelledby="receipt-number" className="rounded-panel border border-border bg-surface p-4 sm:p-6">
          <h2 id="receipt-number" className="text-lg font-semibold wrap-anywhere text-heading">{saleNo}</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-sm text-muted">Cashier</dt><dd className="mt-1 font-medium wrap-anywhere">{cashierName}</dd></div>
            <div><dt className="text-sm text-muted">Completed at (UTC)</dt><dd className="mt-1 font-medium"><time dateTime={completedAt}>{formatUtcDateTime(completedAt)}</time></dd></div>
            <div><dt className="text-sm text-muted">Subtotal</dt><dd className="mt-1 tabular-nums">{formatMmk(subtotal)}</dd></div>
            <div><dt className="text-sm text-muted">Total payable</dt><dd className="mt-1 font-semibold tabular-nums text-heading">{formatMmk(totalPayable)}</dd></div>
          </dl>
        </section>

        <section aria-labelledby="receipt-items">
          <h2 id="receipt-items" className="mb-3 text-base font-semibold text-heading">Sold items</h2>
          {items.length === 0 ? <EmptyState title="No items recorded" /> : (
            <div role="region" aria-label="Sold items table" tabIndex={0} className="overflow-x-auto rounded-panel border border-border bg-surface">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-border bg-surface-muted text-xs whitespace-nowrap text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Product</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Selling unit</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Quantity</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Unit price</th>
                    {showCosts && <th scope="col" className="px-4 py-3 text-right font-semibold">Base-unit cost at sale</th>}
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Line total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {/* Receipt က sale item snapshots ကို သုံးလို့ catalog ပြောင်းပြီးလည်း မူလ values ကျန်သည်။ */}
                  {items.map((item) => (
                    <tr key={item.id}>
                      <th scope="row" className="px-4 py-3 font-medium wrap-anywhere text-heading">{item.productName}</th>
                      <td className="px-4 py-3">{item.unitName}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{item.quantity.toLocaleString('en-US')}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{formatMmk(item.unitPrice)}</td>
                      {showCosts && <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{item.unitCostSnapshot === undefined ? '—' : formatMmk(item.unitCostSnapshot)}</td>}
                      <td className="px-4 py-3 text-right font-medium whitespace-nowrap tabular-nums">{formatMmk(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="receipt-payment" className="rounded-panel border border-border bg-surface p-4 sm:p-6">
          <h2 id="receipt-payment" className="text-base font-semibold text-heading">Payment</h2>
          {payment ? (
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div><dt className="text-sm text-muted">Method</dt><dd className="mt-1 font-medium">{payment.method === 'CASH' ? 'Cash' : 'QR'}</dd></div>
              <div><dt className="text-sm text-muted">Amount paid</dt><dd className="mt-1 tabular-nums">{formatMmk(payment.amount)}</dd></div>
              {payment.method === 'CASH' ? (
                <>
                  <div><dt className="text-sm text-muted">Cash tendered</dt><dd className="mt-1 tabular-nums">{payment.tenderedAmount === null ? '—' : formatMmk(payment.tenderedAmount)}</dd></div>
                  <div><dt className="text-sm text-muted">Change</dt><dd className="mt-1 tabular-nums">{formatMmk(payment.changeAmount)}</dd></div>
                </>
              ) : (
                <div><dt className="text-sm text-muted">Reference number</dt><dd className="mt-1 wrap-anywhere">{payment.referenceNo ?? '—'}</dd></div>
              )}
            </dl>
          ) : (
            <p className="mt-2 text-sm text-muted">No payment recorded</p>
          )}
        </section>
      </div>
    )
  }

  return (
    <>
      <Link to="/sales" className="mb-4 inline-flex items-center gap-1.5 rounded-control text-sm font-medium text-muted hover:text-heading"><ArrowLeft size={16} aria-hidden="true" />Back to sales history</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Sale receipt" />
        <Link to="/pos" className="inline-flex min-h-10 items-center rounded-control bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover">New sale</Link>
      </div>
      {content}
    </>
  )
}
