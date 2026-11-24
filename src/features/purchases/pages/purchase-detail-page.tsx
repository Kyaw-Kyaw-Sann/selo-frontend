import { isAxiosError } from 'axios'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../../../components/shared/page-header'
import LoadingState from '../../../components/shared/loading-state'
import ErrorState from '../../../components/shared/error-state'
import EmptyState from '../../../components/shared/empty-state'
import { usePurchaseQuery } from '../purchases.queries'
import { formatPurchaseAmount, formatPurchaseDate } from '../purchases.format'

export default function PurchaseDetailPage() {
  const { id = '' } = useParams()
  const validId = /^[1-9]\d{0,18}$/.test(id) && (id.length < 19 || id <= '9223372036854775807')
  const query = usePurchaseQuery(validId ? id : '')

  let content
  if (!validId) {
    content = <ErrorState title="Invalid purchase ID" message="Open a purchase from the history list" />
  } else if (query.isPending) {
    content = <LoadingState message="Loading purchase…" />
  } else if (query.isError) {
    const status = isAxiosError(query.error) ? query.error.response?.status : undefined
    if (status === 404) {
      content = <ErrorState title="Purchase not found" message="This purchase is no longer available" />
    } else if (status === 403) {
      content = <ErrorState title="Permission denied" message="You do not have permission to view this purchase" />
    } else {
      content = <ErrorState title="Unable to load purchase" onRetry={() => void query.refetch()} isRetrying={query.isFetching} />
    }
  } else {
    const purchase = query.data
    content = (
      <div className="space-y-6">
        <section aria-labelledby="purchase-number" className="rounded-panel border border-border bg-surface p-4 sm:p-6">
          <h2 id="purchase-number" className="text-lg font-semibold wrap-anywhere text-heading">{purchase.purchaseNo}</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div><dt className="text-sm text-muted">Supplier</dt><dd className="mt-1 font-medium wrap-anywhere">{purchase.supplierName ?? 'No supplier'}</dd></div>
            <div><dt className="text-sm text-muted">Received by</dt><dd className="mt-1 font-medium wrap-anywhere">{purchase.receivedByName}</dd></div>
            <div><dt className="text-sm text-muted">Received at (UTC)</dt><dd className="mt-1 font-medium"><time dateTime={purchase.receivedAt}>{formatPurchaseDate(purchase.receivedAt)}</time></dd></div>
            <div><dt className="text-sm text-muted">Total</dt><dd className="mt-1 font-semibold tabular-nums text-heading">{formatPurchaseAmount(purchase.totalAmount)}</dd></div>
            {purchase.notes && <div className="sm:col-span-2 xl:col-span-4"><dt className="text-sm text-muted">Notes</dt><dd className="mt-1 whitespace-pre-wrap wrap-anywhere">{purchase.notes}</dd></div>}
          </dl>
        </section>

        <section aria-labelledby="purchase-items">
          <h2 id="purchase-items" className="mb-3 text-base font-semibold text-heading">Received items</h2>
          {purchase.items.length === 0 ? <EmptyState title="No items recorded" /> : (
            <div role="region" aria-label="Received items table" tabIndex={0} className="overflow-x-auto rounded-panel border border-border bg-surface">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-border bg-surface-muted text-xs whitespace-nowrap text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Product</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Purchase unit</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Quantity</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Base units per unit</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Base quantity</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Unit cost</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Line total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {/* လက်ခံချိန်က snapshot names၊ conversion နဲ့ costs ကို detail response ကနေ ပြသည်။ */}
                  {purchase.items.map((item) => (
                    <tr key={item.id}>
                      <th scope="row" className="px-4 py-3 font-medium wrap-anywhere text-heading">{item.productName}</th>
                      <td className="px-4 py-3">{item.unitName}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{item.quantity.toLocaleString('en-US')}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{item.conversionFactor.toLocaleString('en-US')}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{item.baseQuantity.toLocaleString('en-US')}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{formatPurchaseAmount(item.unitCost)}</td>
                      <td className="px-4 py-3 text-right font-medium whitespace-nowrap tabular-nums">{formatPurchaseAmount(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    )
  }

  return (
    <>
      <Link to="/purchases" className="mb-4 inline-flex items-center gap-1.5 rounded-control text-sm font-medium text-muted hover:text-heading"><ArrowLeft size={16} aria-hidden="true" />Back to purchase history</Link>
      <PageHeader title="Purchase details" />
      {content}
    </>
  )
}
