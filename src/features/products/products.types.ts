export type Product = {
  id: string
  sku: string
  name: string
  categoryId: string | null
  baseUnitId: string
  imagePath: string | null
  stockQuantity: number
  minStockLevel: number
  isActive: boolean
}

export type ProductStatus = 'ALL' | 'ACTIVE' | 'INACTIVE'

export type ProductsListParams = {
  search: string
  categoryId?: string
  status: ProductStatus
  page: number
  limit: number
}

export type CreateProductUnitInput = {
  // Shared-unit ID ဖြစ်သည်။ Transaction တွေမှာသုံးတဲ့ product-unit ID မဟုတ်ပါ။
  unitId: string
  conversionFactor: number
  barcode: string | null
  sellingPrice: string
  canSell: boolean
  canPurchase: boolean
}

export type CreateProductInput = {
  sku: string
  name: string
  categoryId: string | null
  baseUnitId: string
  imagePath: string | null
  minStockLevel: number
  units: CreateProductUnitInput[]
}

// Shared form ရဲ့ normalized data; create မှာ unit status ကို ဖြုတ်ပို့သည်။
export type ProductFormData = Omit<CreateProductInput, 'units'> & {
  units: (CreateProductUnitInput & { isActive?: boolean })[]
}

export type ProductUnit = {
  id: string // Product-unit ID; purchase/sale lines မှာ သုံးသည်။
  unitId: string // Shared-unit ID; product create/edit မှာ သုံးသည်။
  unitName: string
  unitCode: string
  conversionFactor: number
  barcode: string | null
  sellingPrice: string
  canSell: boolean
  canPurchase: boolean
  isActive: boolean
}

export type ProductDetail = Product & {
  categoryName: string | null
  baseUnitName: string
  baseUnitCode: string
  latestPurchaseCost?: string // Owner-only; Cashier response မှာ field မပါပါ။
  units: ProductUnit[]
}

export type UpdateProductUnitInput = {
  unitId: string
  conversionFactor?: number
  barcode?: string | null
  sellingPrice?: string
  canSell?: boolean
  canPurchase?: boolean
  isActive?: boolean
}

export type UpdateProductInput = {
  sku?: string
  name?: string
  categoryId?: string | null
  imagePath?: string | null
  minStockLevel?: number
  // Omitted units remain unchanged; this array is a merge, not replacement.
  units?: UpdateProductUnitInput[]
  // baseUnitId ကို edit input မှာ မထည့်ပါ။ Base unit ပြောင်းလဲခွင့် မရှိပါ။
}
