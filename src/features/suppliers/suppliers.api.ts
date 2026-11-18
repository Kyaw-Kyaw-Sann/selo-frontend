import { api } from '../../lib/api'
import type { ApiSuccess, PaginatedApiSuccess } from '../../types/api'
import type { CreateSupplierInput, Supplier, SupplierDetail, SuppliersListParams, UpdateSupplierInput } from './suppliers.types'

export async function getSuppliers(
  params: SuppliersListParams,
  signal?: AbortSignal,
): Promise<PaginatedApiSuccess<Supplier>> {
  const response = await api.get<PaginatedApiSuccess<Supplier>>('/suppliers', { params, signal })
  // List နဲ့ pagination ကို query/page က အတူသုံးနိုင်ရန် envelope ကို ဆက်ပေးသည်။
  return response.data
}

export async function getSupplier(id: string, signal?: AbortSignal): Promise<SupplierDetail> {
  const response = await api.get<ApiSuccess<SupplierDetail>>(`/suppliers/${id}`, { signal })
  return response.data.data
}

export async function createSupplier(input: CreateSupplierInput): Promise<SupplierDetail> {
  const response = await api.post<ApiSuccess<SupplierDetail>>('/suppliers', input)
  // Supplier mutations က Product mutations နဲ့မတူဘဲ full detail ပြန်ပေးသည်။
  return response.data.data
}

export async function updateSupplier(id: string, input: UpdateSupplierInput): Promise<SupplierDetail> {
  const response = await api.patch<ApiSuccess<SupplierDetail>>(`/suppliers/${id}`, input)
  return response.data.data
}

export async function updateSupplierStatus(id: string, isActive: boolean): Promise<SupplierDetail> {
  const response = await api.patch<ApiSuccess<SupplierDetail>>(`/suppliers/${id}/status`, { isActive })
  return response.data.data
}
