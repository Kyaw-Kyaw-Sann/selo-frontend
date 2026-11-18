import { isAxiosError } from 'axios'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../../../components/shared/page-header'
import LoadingState from '../../../components/shared/loading-state'
import ErrorState from '../../../components/shared/error-state'
import Badge from '../../../components/ui/badge'
import { useSessionQuery } from '../../auth/auth.queries'
import ProductImage from '../components/product-image'
import { useProductQuery } from '../products.queries'

export default function ProductDetailPage() {
  const { id = '' } = useParams()
  const validId = /^[1-9]\d*$/.test(id) && (id.length < 19 || (id.length === 19 && id <= '9223372036854775807'))
  // Edit page နဲ့ detail cache တူသုံးပြီး ID မမှန်လျှင် request မပို့ပါ။
  const productQuery = useProductQuery(validId ? id : '')
  const { data: user } = useSessionQuery()

  let content
  if (!validId) {
    content = <ErrorState title="Invalid product ID" message="Open a product from the products list" />
  } else if (productQuery.isPending) {
    content = <LoadingState message="Loading product…" />
  } else if (productQuery.isError) {
    const status = isAxiosError(productQuery.error) ? productQuery.error.response?.status : undefined
    content = <ErrorState
      title={status === 404 ? 'Product not found' : status === 403 ? 'Permission denied' : 'Unable to load product'}
      message={status === 404 ? 'This product is no longer available' : status === 403 ? 'You do not have permission to view this product' : 'Please try again'}
      onRetry={status === 404 || status === 403 ? undefined : () => void productQuery.refetch()}
      isRetrying={productQuery.isFetching}
    />
  } else {
    const product = productQuery.data
    const stockStatus = product.stockQuantity === 0 ? 'Out of stock' : product.stockQuantity <= product.minStockLevel ? 'Low stock' : 'In stock'
    const stockTone = product.stockQuantity === 0 ? 'danger' : product.stockQuantity <= product.minStockLevel ? 'warning' : 'success'

    content = (
      <div className="space-y-6">
        <section aria-labelledby="product-information" className="rounded-panel border border-border bg-surface p-4 sm:p-6">
          <div className="flex flex-wrap items-start gap-5">
            <ProductImage key={product.id} imagePath={product.imagePath} name={product.name} className="size-36 sm:size-40" />
            <div className="min-w-0 flex-1 basis-60">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 id="product-information" className="text-xl font-semibold wrap-break-word text-heading">{product.name}</h2>
                  <p className="mt-1 font-mono text-sm wrap-break-word text-muted">{product.sku}</p>
                </div>
                {user?.role === 'OWNER' && (
                  <Link to={`/products/${product.id}/edit`} className="inline-flex min-h-10 items-center gap-2 rounded-control border border-input-border px-3 py-2 text-sm font-medium hover:bg-surface-muted"><Pencil size={16} aria-hidden="true" />Edit product</Link>
                )}
              </div>
              <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
                <div><dt className="text-xs text-muted">Status</dt><dd className="mt-1"><Badge tone={product.isActive ? 'success' : 'neutral'}>{product.isActive ? 'Active' : 'Inactive'}</Badge></dd></div>
                <div><dt className="text-xs text-muted">Category</dt><dd className="mt-1 font-medium">{product.categoryId === null ? 'Uncategorized' : product.categoryName ?? `Category #${product.categoryId}`}</dd></div>
                <div><dt className="text-xs text-muted">Base unit</dt><dd className="mt-1 font-medium">{product.baseUnitName} ({product.baseUnitCode})</dd></div>
                <div><dt className="text-xs text-muted">Current stock</dt><dd className="mt-1 space-y-1"><p className="font-semibold tabular-nums text-heading">{product.stockQuantity.toLocaleString('en-US')} {product.baseUnitName}</p><Badge tone={stockTone}>{stockStatus}</Badge></dd></div>
                <div><dt className="text-xs text-muted">Minimum stock</dt><dd className="mt-1 font-medium tabular-nums">{product.minStockLevel.toLocaleString('en-US')} {product.baseUnitName}</dd></div>
                {/* Backend က Cashier response မှာ cost မပို့ပါ။ UI မှာလည်း Owner အတွက်သာ ပြသည်။ */}
                {user?.role === 'OWNER' && product.latestPurchaseCost !== undefined && (
                  <div><dt className="text-xs text-muted">Latest purchase cost / base unit</dt><dd className="mt-1 font-medium tabular-nums">{product.latestPurchaseCost} MMK</dd></div>
                )}
              </dl>
            </div>
          </div>
        </section>

        <section aria-labelledby="product-units-title">
          <h2 id="product-units-title" className="text-base font-semibold text-heading">Product units</h2>
          <p className="mt-1 mb-4 text-sm text-muted">Conversions are measured in {product.baseUnitName}. Selling prices are in MMK.</p>
          <div role="region" aria-label="Product units table" tabIndex={0} className="overflow-x-auto rounded-panel border border-border bg-surface">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-xs whitespace-nowrap text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Unit</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Base quantity per unit</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Barcode</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Selling price (MMK)</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Can sell</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Can purchase</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {product.units.map((unit) => (
                  <tr key={unit.id} className="hover:bg-surface-muted/40">
                    <th scope="row" className="px-4 py-3 font-medium text-heading"><div className="flex items-center gap-2"><span>{unit.unitName} <span className="font-normal text-muted">({unit.unitCode})</span></span>{unit.unitId === product.baseUnitId && <Badge>Base</Badge>}</div></th>
                    <td className="px-4 py-3 text-right tabular-nums">{unit.conversionFactor.toLocaleString('en-US')}</td>
                    <td className="px-4 py-3 font-mono text-xs">{unit.barcode ?? '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{unit.sellingPrice}</td>
                    <td className="px-4 py-3">{unit.canSell ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">{unit.canPurchase ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3"><Badge tone={unit.isActive ? 'success' : 'neutral'}>{unit.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  </tr>
                ))}
                {product.units.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">No product units available</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    )
  }

  return (
    <>
      <Link to="/products" className="mb-4 inline-flex items-center gap-1.5 rounded-control text-sm font-medium text-muted hover:text-heading"><ArrowLeft size={16} aria-hidden="true" />Back to products</Link>
      <PageHeader title="Product details" description="View product information, stock and unit settings" />
      {content}
    </>
  )
}
