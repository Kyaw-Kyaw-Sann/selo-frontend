import { useState } from 'react'
import { isAxiosError } from 'axios'
import { ArrowLeft } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '../../../components/shared/page-header'
import LoadingState from '../../../components/shared/loading-state'
import ErrorState from '../../../components/shared/error-state'
import EmptyState from '../../../components/shared/empty-state'
import Pagination from '../../../components/shared/pagination'
import Input from '../../../components/ui/input'
import Select from '../../../components/ui/select'
import { useProductQuery } from '../../products/products.queries'
import { useInventoryMovementsQuery } from '../inventory.queries'
import { movementDateRangeSchema } from '../inventory.schema'
import { formatMovementDate, formatQuantityChange, movementTypeLabels } from '../inventory.format'
import MovementDetailDialog from '../components/movement-detail-dialog'
import type { InventoryMovementsListParams } from '../inventory.types'

function MovementHistory({ productId }: { productId?: string }) {
  const [page, setPage] = useState(1)
  const [movementType, setMovementType] = useState<InventoryMovementsListParams['movementType']>('ALL')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [movementId, setMovementId] = useState<string | null>(null)
  const productQuery = useProductQuery(productId ?? '')
  const dates = movementDateRangeSchema.safeParse({ from, to })
  const dateErrors = dates.success ? [] : dates.error.issues
  const fromError = dateErrors.find((issue) => issue.path[0] === 'from')?.message
  const toError = dateErrors.find((issue) => issue.path[0] === 'to')?.message

  // Date range မမှန်သေးချိန် request မပို့ပါ။ Empty filters ကို omission အဖြစ် ပို့သည်။
  const movementsQuery = useInventoryMovementsQuery({
    productId, movementType, from: from || undefined, to: to || undefined, page, limit: 10,
  }, dates.success)
  const hasFilters = Boolean(productId || movementType !== 'ALL' || from || to)

  let content
  if (!dates.success) {
    content = null
  } else if (movementsQuery.isPending) {
    content = <LoadingState message="Loading stock movements…" />
  } else if (movementsQuery.isError) {
    const denied = isAxiosError(movementsQuery.error) && movementsQuery.error.response?.status === 403
    content = denied ? <ErrorState title="Permission denied" message="You do not have permission to view stock movements" /> : (
      <ErrorState title="Unable to load stock movements" onRetry={() => void movementsQuery.refetch()} isRetrying={movementsQuery.isFetching} />
    )
  } else {
    const { data: movements, pagination } = movementsQuery.data
    content = (
      <>
        {movements.length === 0 ? (
          <EmptyState title={hasFilters ? 'No matching movements' : 'No stock movements found'} description={hasFilters ? 'Change the filters or view movements for all products' : 'There are no stock movements to display on this page'} />
        ) : (
          <div role="region" aria-label="Stock movements table" tabIndex={0} className="overflow-x-auto rounded-panel border border-border bg-surface">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-xs whitespace-nowrap text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Movement</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Recorded at (UTC)</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Product / base unit</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Type</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Change</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Before</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">After</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Performed by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-surface-muted/40">
                    <th scope="row" className="px-4 py-3 font-medium"><button type="button" aria-label={`View movement ${movement.id}`} onClick={() => setMovementId(movement.id)} className="rounded-control text-primary underline-offset-4 hover:underline">#{movement.id}</button></th>
                    <td className="px-4 py-3 whitespace-nowrap text-xs"><time dateTime={movement.createdAt}>{formatMovementDate(movement.createdAt)}</time></td>
                    <td className="min-w-48 px-4 py-3"><Link to={`/products/${movement.productId}`} className="rounded-control font-medium text-heading underline-offset-4 hover:text-primary hover:underline">{movement.productName}</Link><p className="mt-1 text-xs text-muted">{movement.sku} · {movement.baseUnitName}</p></td>
                    <td className="px-4 py-3">{movementTypeLabels[movement.movementType]}</td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${movement.quantityChange < 0 ? 'text-danger' : movement.quantityChange > 0 ? 'text-success' : 'text-body'}`}>{formatQuantityChange(movement.quantityChange)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{movement.quantityBefore.toLocaleString('en-US')}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{movement.quantityAfter.toLocaleString('en-US')}</td>
                    <td className="px-4 py-3">{movement.performedByName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPageChange={setPage} itemLabel="movements" />
      </>
    )
  }

  return (
    <>
      <Link to="/inventory" className="mb-4 inline-flex items-center gap-1.5 rounded-control text-sm font-medium text-muted hover:text-heading"><ArrowLeft size={16} aria-hidden="true" />Back to inventory</Link>
      <PageHeader title="Stock movements" description="View stock changes in base units. Dates and times are shown in UTC." />
      {productId && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-control border border-border bg-surface p-3">
          <p className="text-sm">Product: <span className="font-medium text-heading">{productQuery.isSuccess ? productQuery.data.name : 'Selected product'}</span></p>
          <Link to="/inventory/movements" className="rounded-control text-sm font-medium text-primary underline">View all products</Link>
        </div>
      )}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="movement-type" className="mb-1.5 block font-medium text-heading">Movement type</label>
          <Select id="movement-type" value={movementType} onChange={(event) => { setMovementType(event.target.value as InventoryMovementsListParams['movementType']); setPage(1) }}>
            <option value="ALL">All movement types</option>
            {Object.entries(movementTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </div>
        <div>
          <label htmlFor="movements-from" className="mb-1.5 block font-medium text-heading">From (UTC date)</label>
          <Input id="movements-from" type="date" min="0001-01-01" max="9999-12-31" value={from} aria-invalid={Boolean(fromError)} aria-describedby={fromError ? 'movements-from-error' : undefined} onChange={(event) => { setFrom(event.target.value); setPage(1) }} />
          {fromError && <p id="movements-from-error" role="alert" className="mt-1 text-xs text-danger">{fromError}</p>}
        </div>
        <div>
          <label htmlFor="movements-to" className="mb-1.5 block font-medium text-heading">To (UTC date)</label>
          <Input id="movements-to" type="date" min="0001-01-01" max="9999-12-31" value={to} aria-invalid={Boolean(toError)} aria-describedby={toError ? 'movements-to-error' : undefined} onChange={(event) => { setTo(event.target.value); setPage(1) }} />
          {toError && <p id="movements-to-error" role="alert" className="mt-1 text-xs text-danger">{toError}</p>}
        </div>
      </div>
      {content}
      {movementId && <MovementDetailDialog key={movementId} movementId={movementId} onClose={() => setMovementId(null)} />}
    </>
  )
}

export default function StockMovementsPage() {
  const [searchParams] = useSearchParams()
  const productId = searchParams.get('productId') || undefined
  const validProductId = !productId || (/^[1-9]\d*$/.test(productId) && (productId.length < 19 || (productId.length === 19 && productId <= '9223372036854775807')))

  if (!validProductId) {
    return <><PageHeader title="Stock movements" /><ErrorState title="Invalid product ID" message="Open product movements from the inventory list" /><Link to="/inventory" className="mt-4 inline-block rounded-control font-medium text-primary underline">Back to inventory</Link></>
  }

  // Product context ပြောင်းလျှင် page နဲ့ local filters ကို ပြန်စသည်။
  return <MovementHistory key={productId ?? 'all'} productId={productId} />
}
