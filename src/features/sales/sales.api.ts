import { api } from '../../lib/api'
import type { ApiSuccess, PaginatedApiSuccess } from '../../types/api'
import type { CreateSaleInput, SaleCheckoutResult, SaleDetail, SaleListItem, SalesListParams } from './sales.types'

export async function getSales(
  params: SalesListParams,
  signal?: AbortSignal,
): Promise<PaginatedApiSuccess<SaleListItem>> {
  const response = await api.get<PaginatedApiSuccess<SaleListItem>>('/sales', { params, signal })
  return response.data
}

export async function getSale(id: string, signal?: AbortSignal): Promise<SaleDetail> {
  const response = await api.get<ApiSuccess<SaleDetail>>(`/sales/${id}`, { signal })
  return response.data.data
}

export async function createSale(input: CreateSaleInput): Promise<ApiSuccess<SaleCheckoutResult>> {
  // Checkout retry အတွက် caller ပေးတဲ့ key/body နဲ့ backend ရဲ့ success message ကို ထိန်းထားသည်။
  const response = await api.post<ApiSuccess<SaleCheckoutResult>>('/sales', input)
  return response.data
}
