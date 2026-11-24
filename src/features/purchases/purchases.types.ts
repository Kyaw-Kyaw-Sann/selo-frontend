export type PurchasesListParams = {
  search: string
  supplierId?: string
  // YYYY-MM-DD ကို backend က UTC calendar date အဖြစ် သုံးသည်။
  from?: string
  to?: string
  page: number
  limit: number
}

export type PurchaseReceipt = {
  id: string
  purchaseNo: string
  totalAmount: string
  receivedAt: string
}

export type Purchase = PurchaseReceipt & {
  supplierId: string | null
  supplierName: string | null
  receivedBy: string
  receivedByName: string
}

export type PurchaseItem = {
  id: string
  productId: string
  productUnitId: string
  // Names နဲ့ conversion factor က လက်ခံခဲ့ချိန်က သိမ်းထားတဲ့ snapshots ဖြစ်သည်။
  productName: string
  unitName: string
  quantity: number
  conversionFactor: number
  baseQuantity: number
  unitCost: string
  lineTotal: string
}

export type PurchaseDetail = Purchase & {
  notes: string | null
  createdAt: string
  items: PurchaseItem[]
}

export type CreatePurchaseItemInput = {
  // Product detail ရဲ့ units[].id ကို ပို့သည်။
  productUnitId: string
  quantity: number
  unitCost: string
}

export type CreatePurchaseInput = {
  supplierId?: string | null
  notes?: string | null
  idempotencyKey: string
  items: CreatePurchaseItemInput[]
}
