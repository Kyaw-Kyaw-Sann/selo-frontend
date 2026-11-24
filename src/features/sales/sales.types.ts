export type SalePaymentMethod = 'CASH' | 'QR'

export type SalesListParams = {
  search: string
  paymentMethod: 'ALL' | SalePaymentMethod
  cashierId?: string
  // Backend က YYYY-MM-DD ကို UTC calendar date အဖြစ် စစ်သည်။
  from?: string
  to?: string
  page: number
  limit: number
}

export type SaleSummary = {
  id: string
  saleNo: string
  subtotal: string
  totalPayable: string
  completedAt: string
}

export type SaleListItem = SaleSummary & {
  cashierId: string
  cashierName: string
  paymentMethod: SalePaymentMethod | null
}

export type SalePayment = {
  method: SalePaymentMethod
  amount: string
  tenderedAmount: string | null
  changeAmount: string
  referenceNo: string | null
}

export type SaleItem = {
  id: string
  productId: string
  productUnitId: string
  productName: string
  unitName: string
  quantity: number
  conversionFactor: number
  baseQuantity: number
  unitPrice: string
  lineTotal: string
  // Cashier response မှာ ဒီ field ကို ချန်ထားသည်။
  unitCostSnapshot?: string
}

export type SaleDetail = SaleSummary & {
  cashierId: string
  cashierName: string
  createdAt: string
  payment: (SalePayment & {
    id: string
    confirmedBy: string
    confirmedAt: string
  }) | null
  items: SaleItem[]
}

export type CreateSaleInput = {
  idempotencyKey: string
  items: {
    // Product detail ထဲက units[].id ကို ပို့သည်။
    productUnitId: string
    quantity: number
  }[]
  payment:
    | { method: 'CASH'; tenderedAmount: string }
    | { method: 'QR'; manuallyConfirmed: true; referenceNo?: string | null }
}

export type SaleCheckoutResult = SaleSummary & {
  payment: SalePayment
}
