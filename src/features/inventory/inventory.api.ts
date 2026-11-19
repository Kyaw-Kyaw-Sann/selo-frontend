import { api } from '../../lib/api'
import type { ApiSuccess, PaginatedApiSuccess } from '../../types/api'
import type {
  CreateInventoryAdjustmentInput,
  InventoryAdjustment,
  InventoryItem,
  InventoryListParams,
  InventoryMovement,
  InventoryMovementDetail,
  InventoryMovementsListParams,
} from './inventory.types'

export async function getInventory(
  params: InventoryListParams,
  signal?: AbortSignal,
): Promise<PaginatedApiSuccess<InventoryItem>> {
  const response = await api.get<PaginatedApiSuccess<InventoryItem>>('/inventory', { params, signal })
  return response.data
}

export async function getInventoryMovements(
  params: InventoryMovementsListParams,
  signal?: AbortSignal,
): Promise<PaginatedApiSuccess<InventoryMovement>> {
  const response = await api.get<PaginatedApiSuccess<InventoryMovement>>('/inventory/movements', { params, signal })
  return response.data
}

export async function getInventoryMovement(id: string, signal?: AbortSignal): Promise<InventoryMovementDetail> {
  const response = await api.get<ApiSuccess<InventoryMovementDetail>>(`/inventory/movements/${id}`, { signal })
  return response.data.data
}

export async function createInventoryAdjustment(input: CreateInventoryAdjustmentInput): Promise<InventoryAdjustment> {
  // Caller ပေးတဲ့ UUID ကိုပဲ ပို့သည်။ Duplicate key က 409 ဖြစ်ပြီး successful replay မဟုတ်ပါ။
  const response = await api.post<ApiSuccess<InventoryAdjustment>>('/inventory/adjustments', input)
  // Result က new movement ID၊ authoritative stock balances နဲ့ manual: prefixed operationKey ဖြစ်သည်။
  return response.data.data
}
