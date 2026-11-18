import { Link } from 'react-router-dom'
import Badge from '../../../components/ui/badge'
import ProductImage from './product-image'
import type { RootCategory } from '../../categories/categories.types'
import type { Unit } from '../../units/units.types'
import type { Product } from '../products.types'

type ProductsTableProps = {
  products: Product[]
  categories: RootCategory[]
  units: Unit[]
  canEdit?: boolean
  onStatusChange?: (product: Product) => void
}

export default function ProductsTable({ products, categories, units, canEdit = false, onStatusChange }: ProductsTableProps) {
  // Shared reference data ကို ID နဲ့ချိတ်သည်။ Product detail ကို row တစ်ခုစီ မခေါ်ပါ။
  const categoryNames = new Map(categories.flatMap((root) => [root, ...root.children]).map((category) => [category.id, category.name]))
  const unitNames = new Map(units.map((unit) => [unit.id, unit.name]))

  return (
    <div role="region" aria-label="Products table" tabIndex={0} className="overflow-x-auto rounded-panel border border-border bg-surface">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead className="border-b border-border bg-surface-muted text-xs whitespace-nowrap text-muted">
          <tr>
            <th scope="col" className="w-18 px-4 py-3 font-semibold">Image</th>
            <th scope="col" className="px-4 py-3 font-semibold">Product</th>
            <th scope="col" className="px-4 py-3 font-semibold">SKU</th>
            <th scope="col" className="px-4 py-3 font-semibold">Category</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Stock</th>
            <th scope="col" className="px-4 py-3 font-semibold">Base unit</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Minimum stock</th>
            <th scope="col" className="px-4 py-3 font-semibold">Status</th>
            {canEdit && <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.map((product) => {
            const outOfStock = product.stockQuantity === 0
            const lowStock = product.stockQuantity > 0 && product.stockQuantity <= product.minStockLevel

            return (
              <tr key={product.id} className="hover:bg-surface-muted/40">
                <td className="px-4 py-2"><ProductImage imagePath={product.imagePath} name={product.name} /></td>
                <th scope="row" className="min-w-44 max-w-xs px-4 py-2.5 font-semibold wrap-break-word text-heading"><Link to={`/products/${product.id}`} className="rounded-control underline-offset-4 hover:text-primary hover:underline">{product.name}</Link></th>
                <td className="px-4 py-2.5 font-mono text-xs">{product.sku}</td>
                <td className="px-4 py-2.5">{product.categoryId === null ? 'Uncategorized' : categoryNames.get(product.categoryId) ?? `Category #${product.categoryId}`}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  <span className={`font-semibold ${outOfStock ? 'text-danger' : lowStock ? 'text-warning' : 'text-heading'}`}>{product.stockQuantity.toLocaleString('en-US')}</span>
                  {(outOfStock || lowStock) && <span className={`block whitespace-nowrap text-xs ${outOfStock ? 'text-danger' : 'text-warning'}`}>{outOfStock ? 'Out of stock' : 'Low stock'}</span>}
                </td>
                <td className="px-4 py-2.5">{unitNames.get(product.baseUnitId) ?? `Unit #${product.baseUnitId}`}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{product.minStockLevel.toLocaleString('en-US')}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={product.isActive ? 'success' : 'neutral'}>{product.isActive ? 'Active' : 'Inactive'}</Badge>
                </td>
                {canEdit && (
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-2 whitespace-nowrap">
                      <Link to={`/products/${product.id}/edit`} aria-label={`Edit ${product.name}`} className="inline-flex min-h-8 items-center rounded-control border border-border px-2.5 py-1.5 text-xs font-medium text-body hover:bg-surface-muted">Edit</Link>
                      {onStatusChange && (
                        <button
                          type="button"
                          aria-label={`${product.isActive ? 'Deactivate' : 'Activate'} ${product.name}`}
                          onClick={() => onStatusChange(product)}
                          className={`min-h-8 rounded-control px-2.5 py-1.5 text-xs font-medium ${product.isActive ? 'text-danger hover:bg-danger-soft' : 'text-primary hover:bg-primary-soft'}`}
                        >
                          {product.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
