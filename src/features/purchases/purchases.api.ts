import { api } from '../../lib/api'
import type { ApiSuccess, PaginatedApiSuccess } from '../../types/api'
import type {
  CreatePurchaseInput,
  Purchase,
  PurchaseDetail,
  PurchaseReceipt,
  PurchasesListParams,
} from './purchases.types'

export async function getPurchases(
  params: PurchasesListParams,
  signal?: AbortSignal,
): Promise<PaginatedApiSuccess<Purchase>> {
  const response = await api.get<PaginatedApiSuccess<Purchase>>('/purchases', { params, signal })
  return response.data
}

export async function getPurchase(id: string, signal?: AbortSignal): Promise<PurchaseDetail> {
  const response = await api.get<ApiSuccess<PurchaseDetail>>(`/purchases/${id}`, { signal })
  return response.data.data
}

export async function createPurchase(input: CreatePurchaseInput): Promise<ApiSuccess<PurchaseReceipt>> {
  // Retry လုပ်တဲ့အခါ caller က မူလ key နဲ့ payload ကို ပြန်ပေးသည်။
  const response = await api.post<ApiSuccess<PurchaseReceipt>>('/purchases', input)
  // ပထမအကြိမ် receive နဲ့ replay အတွက် backend message ကို ဆက်ပေးသည်။
  return response.data
}
