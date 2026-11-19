import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { History, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../../components/shared/page-header'
import LoadingState from '../../../components/shared/loading-state'
import ErrorState from '../../../components/shared/error-state'
import EmptyState from '../../../components/shared/empty-state'
import Pagination from '../../../components/shared/pagination'
import Input from '../../../components/ui/input'
import Select from '../../../components/ui/select'
import Badge from '../../../components/ui/badge'
import { useSessionQuery } from '../../auth/auth.queries'
import { useInventoryQuery } from '../inventory.queries'
import StockAdjustmentDialog from '../components/stock-adjustment-dialog'
import type { InventoryItem, InventoryStatus } from '../inventory.types'

const stockStates = {
  IN_STOCK: { label: 'In stock', tone: 'success' },
  LOW_STOCK: { label: 'Low stock', tone: 'warning' },
  OUT_OF_STOCK: { label: 'Out of stock', tone: 'danger' },
} as const

export default function InventoryPage() {
  const { data: user } = useSessionQuery()
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<InventoryStatus>('ALL')
  const [adjustmentProduct, setAdjustmentProduct] = useState<InventoryItem | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const inventoryQuery = useInventoryQuery({ search, status, page, limit: 10 })
  const hasFilters = Boolean(search || status !== 'ALL')

  let content
  if (inventoryQuery.isPending) {
    content = <LoadingState message="Loading inventory…" />
  } else if (inventoryQuery.isError) {
    const denied = isAxiosError(inventoryQuery.error) && inventoryQuery.error.response?.status === 403
    content = denied ? (
      <ErrorState title="Permission denied" message="You do not have permission to view inventory" />
    ) : (
      <ErrorState title="Unable to load inventory" onRetry={() => void inventoryQuery.refetch()} isRetrying={inventoryQuery.isFetching} />
    )
  } else {
    const { data: inventory, pagination } = inventoryQuery.data
    content = (
      <>
        {inventory.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'No matching inventory' : 'No products found'}
            description={hasFilters ? 'Try another search or change your stock status filter' : 'There are no products to display on this page'}
          />
        ) : (
          <div role="region" aria-label="Inventory table" tabIndex={0} className="overflow-x-auto rounded-panel border border-border bg-surface">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-xs whitespace-nowrap text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Product</th>
                  <th scope="col" className="px-4 py-3 font-semibold">SKU</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Current stock</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Base unit</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Minimum stock</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Stock status</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Product status</th>
                  {user?.role === 'OWNER' && <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inventory.map((item) => {
                  // Stock availability ကို server ပေးတဲ့ status နဲ့ပြပြီး product active flag နဲ့ မရောပါ။
                  const stock = stockStates[item.stockStatus]
                  return (
                    <tr key={item.productId} className="hover:bg-surface-muted/40">
                      <th scope="row" className="min-w-44 max-w-xs px-4 py-3 font-semibold wrap-break-word text-heading"><Link to={`/products/${item.productId}`} className="rounded-control underline-offset-4 hover:text-primary hover:underline">{item.productName}</Link></th>
                      <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-heading">{item.stockQuantity.toLocaleString('en-US')}</td>
                      <td className="px-4 py-3">{item.baseUnitName}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{item.minStockLevel.toLocaleString('en-US')}</td>
                      <td className="px-4 py-3"><Badge tone={stock.tone}>{stock.label}</Badge></td>
                      <td className="px-4 py-3"><Badge tone={item.isActive ? 'success' : 'neutral'}>{item.isActive ? 'Active' : 'Inactive'}</Badge></td>
                      {user?.role === 'OWNER' && (
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex justify-end gap-2 whitespace-nowrap">
                            <button type="button" aria-label={`Adjust stock for ${item.productName}`} onClick={() => setAdjustmentProduct(item)} className="min-h-8 rounded-control border border-border px-2.5 py-1.5 text-xs font-medium text-body hover:bg-surface-muted">Adjust</button>
                            <Link to={`/inventory/movements?productId=${item.productId}`} aria-label={`View stock movements for ${item.productName}`} className="inline-flex min-h-8 items-center rounded-control border border-border px-2.5 py-1.5 text-xs font-medium text-body hover:bg-surface-muted">Movements</Link>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPageChange={setPage} itemLabel="products" />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Inventory" description="View current stock and minimum stock levels. All quantities are in base units." />
        {user?.role === 'OWNER' && <Link to="/inventory/movements" className="inline-flex min-h-10 items-center gap-2 rounded-control border border-input-border bg-surface px-3 py-2 text-sm font-medium hover:bg-surface-muted"><History size={16} aria-hidden="true" />Stock movements</Link>}
      </div>
      <div className="mb-6 grid gap-4 sm:max-w-2xl sm:grid-cols-[minmax(0,1fr)_180px]">
        <div>
          <label htmlFor="inventory-search" className="mb-1.5 block font-medium text-heading">Search inventory</label>
          <div className="relative">
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
            <Input id="inventory-search" type="search" maxLength={200} className="pl-9" placeholder="Product name or SKU" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
          </div>
        </div>
        <div>
          <label htmlFor="inventory-status" className="mb-1.5 block font-medium text-heading">Stock status</label>
          <Select id="inventory-status" value={status} onChange={(event) => { setStatus(event.target.value as InventoryStatus); setPage(1) }}>
            <option value="ALL">All stock statuses</option>
            <option value="IN_STOCK">In stock</option>
            <option value="LOW_STOCK">Low stock</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
          </Select>
        </div>
      </div>
      {content}
      {adjustmentProduct && user?.role === 'OWNER' && (
        <StockAdjustmentDialog
          key={adjustmentProduct.productId}
          product={adjustmentProduct}
          onSaved={() => { if (status !== 'ALL') setPage(1) }}
          onClose={() => setAdjustmentProduct(null)}
        />
      )}
    </>
  )
}
