import { api } from "../../lib/api";
import type { ApiSuccess, PaginatedApiSuccess } from "../../types/api";
import type { CreateUnitInput, Unit, UnitsListParams, UpdateUnitInput } from "./units.types";

export async function getUnits(
  params: UnitsListParams,
  signal: AbortSignal,
): Promise<PaginatedApiSuccess<Unit>> {
  const response = await api.get<PaginatedApiSuccess<Unit>>("/units", {
    params,
    signal,
  });

  return response.data;
}

export async function createUnit(input: CreateUnitInput): Promise<Unit> {
  const response = await api.post<ApiSuccess<Unit>>('/units', input)

  return response.data.data
}

export async function updateUnit(id: string, input: UpdateUnitInput): Promise<Unit> {
  const response = await api.patch<ApiSuccess<Unit>>(`/units/${id}`, input)
  return response.data.data
}

export async function updateUnitStatus(id: string, isActive: boolean): Promise<Unit> {
  const response = await api.patch<ApiSuccess<Unit>>(`/units/${id}/status`, { isActive })
  return response.data.data
}

export async function getUnitOptions(signal: AbortSignal): Promise<Unit[]> {
  const units: Unit[] = []
  let page = 1
  let totalPages = 1

  // Products မှာ base-unit names ချိတ်ရန် active/inactive အားလုံးကို page ဖြတ်ယူသည်။
  while (page <= totalPages) {
    const response = await getUnits({ search: '', page, limit: 100 }, signal)
    units.push(...response.data)
    totalPages = response.pagination.totalPages
    page += 1
  }

  return units
}
