import { api } from '../../lib/api'
import type { ApiSuccess, PaginatedApiSuccess } from '../../types/api'
import type { CreateProductInput, Product, ProductDetail, ProductsListParams, UpdateProductInput } from './products.types'

export async function getProducts(
  params: ProductsListParams,
  signal?: AbortSignal,
): Promise<PaginatedApiSuccess<Product>> {
  const response = await api.get<PaginatedApiSuccess<Product>>('/products', { params, signal })
  return response.data
}

export async function createProduct(input: CreateProductInput): Promise<{ id: string }> {
  const response = await api.post<ApiSuccess<{ id: string }>>('/products', input)
  // Create response က ID သာဖြစ်ပြီး Product detail မဟုတ်ပါ။
  return response.data.data
}

export async function getProduct(id: string, signal?: AbortSignal): Promise<ProductDetail> {
  const response = await api.get<ApiSuccess<ProductDetail>>(`/products/${id}`, { signal })
  return response.data.data
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<{ id: string }> {
  const response = await api.patch<ApiSuccess<{ id: string }>>(`/products/${id}`, input)
  return response.data.data
}

export async function updateProductStatus(id: string, isActive: boolean): Promise<{ id: string; isActive: boolean }> {
  const response = await api.patch<ApiSuccess<{ id: string; isActive: boolean }>>(`/products/${id}/status`, { isActive })
  return response.data.data
}
