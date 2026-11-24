import Dialog from '../../../components/ui/dialog'
import ErrorState from '../../../components/shared/error-state'
import LoadingState from '../../../components/shared/loading-state'
import ProductImage from '../../products/components/product-image'
import { useProductQuery } from '../../products/products.queries'
import { useUnitOptionsQuery } from '../../units/units.queries'
import { formatMmk } from '../../../utils/format'
import { getCartAddError, toPosMinorUnits, type PosCartItem, type PosCartLine } from '../pos-cart'

type Props = {
  productId: string
  search: string
  lines: PosCartLine[]
  onAdd: (item: PosCartItem) => void
  onClose: () => void
}

export default function PosUnitDialog({ productId, search, lines, onAdd, onClose }: Props) {
  const product = useProductQuery(productId)
  const sharedUnits = useUnitOptionsQuery()

  let content
  if (product.isPending || sharedUnits.isPending) {
    content = <LoadingState message="Loading selling units…" />
  } else if (product.isError || sharedUnits.isError) {
    content = <ErrorState title="Unable to load selling units" onRetry={() => {
      if (product.isError) void product.refetch()
      if (sharedUnits.isError) void sharedUnits.refetch()
    }} isRetrying={product.isFetching || sharedUnits.isFetching} />
  } else {
    const detail = product.data
    const activeIds = new Set(sharedUnits.data.filter((unit) => unit.isActive).map((unit) => unit.id))
    const units = detail.isActive
      ? detail.units.filter((unit) => unit.isActive && unit.canSell && activeIds.has(unit.unitId) && toPosMinorUnits(unit.sellingPrice) > 0n)
      : []
    const barcode = search.toLowerCase()
    const orderedUnits = [...units].sort((left, right) =>
      Number(right.barcode?.toLowerCase() === barcode) - Number(left.barcode?.toLowerCase() === barcode),
    )
    content = (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <ProductImage imagePath={detail.imagePath} name={detail.name} className="size-14" />
          <div className="min-w-0">
            <p className="font-semibold wrap-anywhere text-heading">{detail.name}</p>
            <p className="text-sm text-muted">{detail.stockQuantity.toLocaleString('en-US')} {detail.baseUnitName} in stock</p>
          </div>
        </div>
        {orderedUnits.length === 0 && <p className="text-sm text-muted">No selling units are available for this product.</p>}
        <ul className="space-y-2">
          {orderedUnits.map((unit) => {
            const item: PosCartItem = {
              productId: detail.id,
              productUnitId: unit.id,
              productName: detail.name,
              unitName: unit.unitName,
              imagePath: detail.imagePath,
              unitPrice: unit.sellingPrice,
              conversionFactor: unit.conversionFactor,
              stockQuantity: detail.stockQuantity,
            }
            const error = getCartAddError(lines, item)
            return (
              <li key={unit.id} className="rounded-control border border-border p-3">
                <button type="button" disabled={Boolean(error)} onClick={() => onAdd(item)} className="flex w-full flex-wrap items-center justify-between gap-2 rounded-control text-left hover:text-primary disabled:text-muted">
                  <span className="font-medium">{unit.unitName} <span className="text-xs font-normal text-muted">×{unit.conversionFactor} base</span></span>
                  <span className="flex items-center gap-2 font-semibold tabular-nums">{formatMmk(unit.sellingPrice)} <span className="text-sm text-primary">Add</span></span>
                </button>
                {error && <p className="mt-1 text-xs text-muted">{error}</p>}
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  return <Dialog title="Choose selling unit" onClose={onClose}>{content}</Dialog>
}
