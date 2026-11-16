import type { ProductFormData, ProductDetail, UpdateProductInput, UpdateProductUnitInput } from './products.types'

export function buildProductUpdate(product: ProductDetail, input: ProductFormData): UpdateProductInput {
  const changes: UpdateProductInput = {}
  if (input.sku !== product.sku) changes.sku = input.sku
  if (input.name !== product.name) changes.name = input.name
  if (input.categoryId !== product.categoryId) changes.categoryId = input.categoryId
  if (input.imagePath !== product.imagePath) changes.imagePath = input.imagePath
  if (input.minStockLevel !== product.minStockLevel) changes.minStockLevel = input.minStockLevel

  const unitChanges: UpdateProductUnitInput[] = []
  for (const unit of input.units) {
    // Edit က shared-unit ID နဲ့ merge လုပ်သည်။ Product-unit ID ကို မပို့ပါ။
    const existing = product.units.find((row) => row.unitId === unit.unitId)
    if (!existing) {
      unitChanges.push(unit)
      continue
    }

    const update: UpdateProductUnitInput = { unitId: unit.unitId }
    if (unit.conversionFactor !== existing.conversionFactor) update.conversionFactor = unit.conversionFactor
    if (unit.barcode !== existing.barcode) update.barcode = unit.barcode
    if (unit.sellingPrice !== existing.sellingPrice) update.sellingPrice = unit.sellingPrice
    if (unit.canSell !== existing.canSell) update.canSell = unit.canSell
    if (unit.canPurchase !== existing.canPurchase) update.canPurchase = unit.canPurchase
    // false ကို မပျောက်စေရန် truthy check မသုံးဘဲ undefined နဲ့ ခွဲစစ်သည်။
    if (unit.isActive !== undefined && unit.isActive !== existing.isActive) update.isActive = unit.isActive
    if (Object.keys(update).length > 1) unitChanges.push(update)
  }
  if (unitChanges.length > 0) changes.units = unitChanges

  // baseUnitId/stock/cost နဲ့ မပြောင်းထားတဲ့ unit status တွေကို PATCH မပို့ပါ။
  return changes
}
