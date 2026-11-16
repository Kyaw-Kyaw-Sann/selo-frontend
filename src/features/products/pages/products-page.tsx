import { Fragment, useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import PageHeader from '../../../components/shared/page-header'
import LoadingState from '../../../components/shared/loading-state'
import ErrorState from '../../../components/shared/error-state'
import EmptyState from '../../../components/shared/empty-state'
import Pagination from '../../../components/shared/pagination'
import Input from '../../../components/ui/input'
import Select from '../../../components/ui/select'
import { useRootCategoriesQuery } from '../../categories/categories.queries'
import { useUnitOptionsQuery } from '../../units/units.queries'
import ProductsTable from '../components/products-table'
import { useProductsQuery } from '../products.queries'
import type { Product, ProductStatus } from '../products.types'
import ProductStatusDialog from '../components/product-status-dialog'
import { useSessionQuery } from '../../auth/auth.queries'

export default function ProductsPage() {
  const [page, setPage] = useState(1)
  const [statusProduct, setStatusProduct] = useState<Product | null>(null)
  const { data: user } = useSessionQuery()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<ProductStatus>('ALL')
  const categoriesQuery = useRootCategoriesQuery()
  const unitsQuery = useUnitOptionsQuery()

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Empty category option ကို API ဆီ မပို့ပါ။ IDs ကို string အဖြစ် ဆက်ထိန်းသည်။
  const productsQuery = useProductsQuery({ search, categoryId: categoryId || undefined, status, page, limit: 10 })
  const hasFilters = Boolean(search || categoryId || status !== 'ALL')
  const referenceError = categoriesQuery.isError || unitsQuery.isError
  let content

  if (productsQuery.isPending) {
    content = <LoadingState message="Loading products…" />
  } else if (productsQuery.isError) {
    const denied = isAxiosError(productsQuery.error) && productsQuery.error.response?.status === 403
    content = denied ? (
      <ErrorState title="Permission denied" message="You do not have permission to view products" />
    ) : (
      <ErrorState title="Unable to load products" onRetry={() => void productsQuery.refetch()} isRetrying={productsQuery.isFetching} />
    )
  } else {
    const { data: products, pagination } = productsQuery.data
    content = (
      <>
        {products.length === 0 ? (
          <EmptyState title={hasFilters ? 'No matching products' : 'No products found'} description={hasFilters ? 'Try another search or change your filters' : 'There are no products to display on this page'} />
        ) : (
          <ProductsTable products={products} categories={categoriesQuery.data ?? []} units={unitsQuery.data ?? []} canEdit={user?.role === 'OWNER'} onStatusChange={setStatusProduct} />
        )}
        <Pagination pagination={pagination} onPageChange={setPage} itemLabel="products" />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Products" description="Manage your product catalog" />
        {user?.role === 'OWNER' && <Link to="/products/new" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-primary px-4 py-2 text-sm leading-5 font-semibold text-on-primary hover:bg-primary-hover"><Plus size={16} aria-hidden="true" />Add product</Link>}
      </div>
      <div className="mb-6 grid gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="sm:col-span-2 xl:col-span-1">
          <label htmlFor="products-search" className="mb-1.5 block font-medium text-heading">Search products</label>
          <div className="relative">
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
            <Input id="products-search" type="search" maxLength={200} className="pl-9" placeholder="Name, SKU or exact barcode" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
          </div>
        </div>
        <div>
          <label htmlFor="products-category" className="mb-1.5 block font-medium text-heading">Category</label>
          <Select
            id="products-category"
            value={categoryId}
            disabled={categoriesQuery.isPending || categoriesQuery.isError}
            aria-describedby="products-category-hint"
            onChange={(event) => { setCategoryId(event.target.value); setPage(1) }}
          >
            <option value="">All categories</option>
            {categoriesQuery.data?.map((root) => (
              <Fragment key={root.id}>
                <option value={root.id}>{root.name}{root.isActive ? '' : ' (Inactive)'}</option>
                {root.children.map((child) => <option key={child.id} value={child.id}>{root.name} / {child.name}{child.isActive ? '' : ' (Inactive)'}</option>)}
              </Fragment>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="products-status" className="mb-1.5 block font-medium text-heading">Status</label>
          <Select id="products-status" value={status} onChange={(event) => { setStatus(event.target.value as ProductStatus); setPage(1) }}>
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
        <p id="products-category-hint" className="text-xs text-muted sm:col-span-2 xl:col-span-3">Category filters match the selected category only; child categories are excluded.</p>
      </div>

      {referenceError && productsQuery.isSuccess && (
        <div role="alert" className="mb-4 rounded-control border border-border bg-surface p-3">
          <p className="text-sm text-danger">Unable to load some category or unit names. References are shown by ID where needed.</p>
          <button
            type="button"
            disabled={categoriesQuery.isFetching || unitsQuery.isFetching}
            onClick={() => { void categoriesQuery.refetch(); void unitsQuery.refetch() }}
            className="mt-2 rounded-control px-2 py-1 text-sm font-medium text-primary underline disabled:opacity-50"
          >
            Retry reference data
          </button>
        </div>
      )}
      {content}
      {statusProduct && user?.role === 'OWNER' && (
        <ProductStatusDialog
          key={statusProduct.id}
          product={statusProduct}
          onSaved={() => {
            // Status filter က row ကို ဖယ်လိုက်လျှင် invalid page မကျန်စေရန်။
            if (status !== 'ALL') setPage(1)
          }}
          onClose={() => setStatusProduct(null)}
        />
      )}
    </>
  )
}
