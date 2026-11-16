import { api } from '../../lib/api'
import type { ApiSuccess, PaginatedApiSuccess } from '../../types/api'
import type { Category, CategoriesListParams, CreateCategoryInput, RootCategory, UpdateCategoryInput } from './categories.types'

export async function getCategories(
  params: CategoriesListParams,
  signal?: AbortSignal,
): Promise<PaginatedApiSuccess<RootCategory>> {
  const response = await api.get<PaginatedApiSuccess<RootCategory>>('/categories', {
    params,
    signal,
  })

  // Root list၊ nested children နဲ့ pagination ကို အတူပြန်ပေးသည်။
  return response.data
}

export async function getRootCategories(signal?: AbortSignal): Promise<RootCategory[]> {
  const roots: RootCategory[] = []
  let page = 1
  let totalPages = 1

  // Parent dropdown မှာ ပထမ page တစ်ခုတည်းမဟုတ်ဘဲ roots အားလုံးလိုသည်။
  while (page <= totalPages) {
    const response = await getCategories({ page, limit: 100 }, signal)
    roots.push(...response.data)
    totalPages = response.pagination.totalPages
    page += 1
  }

  return roots
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const response = await api.post<ApiSuccess<Category>>('/categories', input)
  return response.data.data
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  const response = await api.patch<ApiSuccess<Category>>(`/categories/${id}`, input)
  return response.data.data
}

export async function updateCategoryStatus(id: string, isActive: boolean): Promise<Category> {
  const response = await api.patch<ApiSuccess<Category>>(`/categories/${id}/status`, { isActive })
  return response.data.data
}
