import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { sessionQueryKey } from '../auth/auth.queries'
import { getProducts } from '../products/products.api'
import type { Product } from '../products/products.types'
import { getSuppliers } from '../suppliers/suppliers.api'
import type { Supplier } from '../suppliers/suppliers.types'
import { createPurchase, getPurchase, getPurchases } from './purchases.api'
import type { PurchasesListParams } from './purchases.types'

function usePurchaseRead() {
  const queryClient = useQueryClient()

  return async <T>(request: () => Promise<T>) => {
    try {
      return await request()
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        await queryClient.cancelQueries({ queryKey: sessionQueryKey })
        queryClient.setQueryData(sessionQueryKey, null)
      }
      throw error
    }
  }
}

export function usePurchasesQuery(params: PurchasesListParams, enabled: boolean) {
  const read = usePurchaseRead()
  return useQuery({
    queryKey: ['purchases', 'list', params],
    enabled,
    queryFn: ({ signal }) => read(() => getPurchases(params, signal)),
  })
}

export function usePurchaseQuery(id: string) {
  const read = usePurchaseRead()
  return useQuery({
    queryKey: ['purchases', 'detail', id],
    enabled: Boolean(id),
    queryFn: ({ signal }) => read(() => getPurchase(id, signal)),
  })
}

export function usePurchaseSuppliersQuery() {
  const read = usePurchaseRead()
  return useQuery({
    queryKey: ['suppliers', 'list', 'purchase-options'],
    queryFn: ({ signal }) => read(async () => {
      const suppliers: Supplier[] = []
      let totalPages = 1

      // History filter မှာ inactive suppliers နဲ့ နောက် pages က suppliers ပါ ရွေးနိုင်သည်။
      for (let page = 1; page <= totalPages; page++) {
        const result = await getSuppliers({ search: '', status: 'ALL', page, limit: 100 }, signal)
        suppliers.push(...result.data)
        totalPages = result.pagination.totalPages
      }

      return suppliers
    }),
  })
}

export function usePurchaseProductsQuery() {
  const read = usePurchaseRead()
  return useQuery({
    queryKey: ['products', 'list', 'purchase-options'],
    queryFn: ({ signal }) => read(async () => {
      const products: Product[] = []
      let totalPages = 1

      // Product options ထဲမှာ active products ရဲ့ pages အားလုံး ပါသည်။
      for (let page = 1; page <= totalPages; page++) {
        const result = await getProducts({ search: '', status: 'ACTIVE', page, limit: 100 }, signal)
        products.push(...result.data)
        totalPages = result.pagination.totalPages
      }

      return products
    }),
  })
}

export function useCreatePurchaseMutation() {
  return useMutation({ mutationFn: createPurchase, retry: false })
}
