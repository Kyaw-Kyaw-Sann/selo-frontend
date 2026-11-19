export type StockStatus = 'LOW_STOCK' | 'OUT_OF_STOCK' | 'IN_STOCK'

export type InventoryStatus = 'ALL' | StockStatus

export type InventoryItem = {
  productId: string
  sku: string
  productName: string
  baseUnitId: string
  baseUnitName: string
  stockQuantity: number
  minStockLevel: number
  stockStatus: StockStatus
  isActive: boolean
}

export type InventoryListParams = {
  search: string
  status: InventoryStatus
  page: number
  limit: number
}

export type MovementType = 'OPENING' | 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT'

export type InventoryMovementsListParams = {
  productId?: string
  movementType: 'ALL' | MovementType
  // YYYY-MM-DD; backend က UTC calendar dates အဖြစ် စစ်သည်။
  from?: string
  to?: string
  page: number
  limit: number
}

export type InventoryMovement = {
  id: string
  productId: string
  sku: string
  productName: string
  baseUnitName: string
  movementType: MovementType
  quantityChange: number
  quantityBefore: number
  quantityAfter: number
  // Reference က purchase/sale header မဟုတ်ဘဲ source item ကို ညွှန်းနိုင်သည်။
  referenceType: string | null
  referenceId: string | null
  reason: string | null
  performedBy: string
  performedByName: string
  createdAt: string
}

export type InventoryMovementDetail = InventoryMovement & {
  operationKey: string
}

export type CreateInventoryAdjustmentInput = {
  productId: string
  // Base units ဖြင့် signed nonzero integer ပို့သည်။
  quantityChange: number
  reason: string
  operationKey: string
}

export type InventoryAdjustment = {
  id: string
  productId: string
  quantityChange: number
  quantityBefore: number
  quantityAfter: number
  reason: string
  performedBy: string
  operationKey: string
}
