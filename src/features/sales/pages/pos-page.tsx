import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, Receipt, ScanBarcode } from 'lucide-react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../../../components/shared/confirm-dialog'
import EmptyState from '../../../components/shared/empty-state'
import ErrorState from '../../../components/shared/error-state'
import LoadingState from '../../../components/shared/loading-state'
import Pagination from '../../../components/shared/pagination'
import Input from '../../../components/ui/input'
import Select from '../../../components/ui/select'
import { useSessionQuery } from '../../auth/auth.queries'
import { useRootCategoriesQuery } from '../../categories/categories.queries'
import ProductImage from '../../products/components/product-image'
import { useProductsQuery } from '../../products/products.queries'
import PosCartPanel from '../components/pos-cart-panel'
import PosCheckout from '../components/pos-checkout'
import PosUnitDialog from '../components/pos-unit-dialog'
import { addCartItem, decreaseCartLine, type PosCartLine } from '../pos-cart'

export default function PosPage() {
  const { data: user } = useSessionQuery()
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lines, setLines] = useState<PosCartLine[]>([])
  const [clearOpen, setClearOpen] = useState(false)
  const categories = useRootCategoriesQuery()
  const products = useProductsQuery({ search, categoryId: categoryId || undefined, status: 'ACTIVE', page, limit: 12 })

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(draft.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [draft])

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="flex items-center gap-2 text-xl font-bold text-primary"><img src="/selo.svg" alt="" className="size-7" />selo</span>
            <h1 className="border-l border-border pl-3 text-lg font-semibold text-heading sm:pl-4 sm:text-xl">POS — New sale</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user && <p className="mr-2 text-sm text-muted"><span className="font-medium text-heading">{user.name}</span> · {user.role === 'OWNER' ? 'Owner' : 'Cashier'}</p>}
            <Link to="/sales" className="inline-flex min-h-9 items-center gap-2 rounded-control border border-input-border px-3 text-sm font-medium hover:bg-surface-muted"><Receipt size={16} aria-hidden="true" />Sales history</Link>
            <Link to="/products" className="inline-flex min-h-9 items-center gap-2 rounded-control border border-input-border px-3 text-sm font-medium hover:bg-surface-muted"><ArrowLeft size={16} aria-hidden="true" />Management</Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="grid items-start gap-4 p-4 lg:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)]">
        <section aria-labelledby="pos-products-title" className="min-w-0 rounded-panel border border-border bg-surface p-4 sm:p-5">
          <form role="search" onSubmit={(event) => {
            event.preventDefault()
            setSearch(draft.trim())
            setPage(1)
          }}>
            <label htmlFor="pos-search" className="sr-only">Product name, SKU or barcode</label>
            <div className="relative">
              <ScanBarcode size={22} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-primary" />
              <Input id="pos-search" autoFocus autoComplete="off" type="search" maxLength={200} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search product name, SKU or scan barcode…" className="min-h-12 border-primary pl-11" />
            </div>
          </form>
          <div className="my-5 flex flex-wrap items-center justify-between gap-3">
            <h2 id="pos-products-title" className="text-lg font-semibold text-heading">Products</h2>
            <div className="w-full sm:w-52">
              <Select aria-label="Product category" value={categoryId} disabled={!categories.data} onChange={(event) => {
                setCategoryId(event.target.value)
                setPage(1)
              }}>
                <option value="">All categories</option>
                {categories.data?.flatMap((root) => [
                  <option key={root.id} value={root.id}>{root.name}</option>,
                  ...root.children.map((child) => <option key={child.id} value={child.id}>{root.name} / {child.name}</option>),
                ])}
              </Select>
              {categories.isError && <button type="button" onClick={() => void categories.refetch()} disabled={categories.isFetching} className="mt-1 text-xs font-medium text-primary underline">Retry categories</button>}
            </div>
          </div>
          {products.isPending ? <LoadingState message="Loading products…" /> : products.isError ? (
            <ErrorState title="Unable to load products" onRetry={() => void products.refetch()} isRetrying={products.isFetching} />
          ) : (
            <>
              {products.data.data.length === 0 ? (
                <EmptyState title={search || categoryId ? 'No matching products' : 'No active products'} />
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
                  {products.data.data.map((product) => (
                    <li key={product.id} className="min-w-0">
                      <button
                        type="button"
                        disabled={product.stockQuantity === 0}
                        aria-label={product.stockQuantity === 0 ? `${product.name}, out of stock` : `Choose selling unit for ${product.name}`}
                        onClick={() => setSelectedId(product.id)}
                        className="flex h-full w-full flex-col gap-3 rounded-panel border border-border bg-surface p-3 text-left enabled:hover:border-primary disabled:opacity-65"
                      >
                        <ProductImage imagePath={product.imagePath} name={product.name} className="h-24 w-full sm:h-28" />
                        <span className="font-semibold wrap-anywhere text-heading">{product.name}</span>
                        <span className="mt-auto flex w-full items-end justify-between gap-1">
                          <span className="min-w-0 text-xs wrap-anywhere text-muted">{product.stockQuantity === 0 ? 'Out of stock' : product.sku}</span>
                          {product.stockQuantity > 0 && <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary"><Plus size={16} aria-hidden="true" /></span>}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <Pagination pagination={products.data.pagination} onPageChange={setPage} itemLabel="products" />
            </>
          )}
        </section>
        <PosCartPanel
          lines={lines}
          onIncrease={(line) => setLines((current) => addCartItem(current, line))}
          onDecrease={(id) => setLines((current) => decreaseCartLine(current, id))}
          onRemove={(id) => setLines((current) => current.filter((line) => line.productUnitId !== id))}
          onClear={() => setClearOpen(true)}
        >
          {user && <PosCheckout key={user.id} staffId={user.id} lines={lines} />}
        </PosCartPanel>
      </main>

      {selectedId && (
        <PosUnitDialog
          productId={selectedId}
          search={search}
          lines={lines}
          onAdd={(item) => {
            setLines((current) => addCartItem(current, item))
            setSelectedId(null)
          }}
          onClose={() => setSelectedId(null)}
        />
      )}
      {clearOpen && <ConfirmDialog title="Clear sale cart?" description="Remove all items from the current cart." confirmLabel="Clear cart" destructive onClose={() => setClearOpen(false)} onConfirm={() => {
        setLines([])
        setClearOpen(false)
      }} />}
    </div>
  )
}
