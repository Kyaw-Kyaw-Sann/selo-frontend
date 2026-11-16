import { isAxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionQueryKey } from '../auth/auth.queries'
import { createProduct, getProduct, getProducts, updateProduct, updateProductStatus } from './products.api'
import type { ProductsListParams, UpdateProductInput } from './products.types'

export function useProductsQuery(params: ProductsListParams) {
  const queryClient = useQueryClient()

  return useQuery({
    // Search/filter/page အလိုက် cache ခွဲပြီး obsolete requests ကို signal နဲ့ ရပ်သည်။
    queryKey: ['products', 'list', params],
    queryFn: async ({ signal }) => {
      try {
        return await getProducts(params, signal)
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          await queryClient.cancelQueries({ queryKey: sessionQueryKey })
          queryClient.setQueryData(sessionQueryKey, null)
        }
        throw error
      }
    },
  })
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProduct,
    retry: false,
    onSuccess: async () => {
      // ID-only response ကို Product အဖြစ် cache မထည့်ဘဲ lists ပြန်ယူသည်။
      await queryClient.invalidateQueries({ queryKey: ['products', 'list'] })
    },
    onError: async (error) => {
      if (isAxiosError(error) && error.response?.status === 401) {
        await queryClient.cancelQueries({ queryKey: sessionQueryKey })
        queryClient.setQueryData(sessionQueryKey, null)
      }
    },
  })
}

export function useProductQuery(id: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['products', 'detail', id],
    enabled: Boolean(id),
    queryFn: async ({ signal }) => {
      try {
        return await getProduct(id, signal)
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          await queryClient.cancelQueries({ queryKey: sessionQueryKey })
          queryClient.setQueryData(sessionQueryKey, null)
        }
        // 404/403 ကို page မှာ not-found/permission states အဖြစ် ခွဲပြမည်။
        throw error
      }
    },
  })
}

export function useUpdateProductMutation(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateProductInput) => updateProduct(id, input),
    retry: false,
    onSuccess: async () => {
      // ID-only response နဲ့ detail ကို မဖုံးဘဲ server result ကို ပြန်ယူသည်။
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products', 'detail', id], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['products', 'list'] }),
      ])
    },
    onError: async (error) => {
      if (isAxiosError(error) && error.response?.status === 401) {
        await queryClient.cancelQueries({ queryKey: sessionQueryKey })
        queryClient.setQueryData(sessionQueryKey, null)
      }
    },
  })
}

export function useUpdateProductStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateProductStatus(id, isActive),
    retry: false,
    onSuccess: async (_result, { id }) => {
      // Response က partial ဖြစ်လို့ detail ကို အစားမထိုးဘဲ server data ပြန်ယူသည်။
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products', 'detail', id], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['products', 'list'] }),
      ])
    },
    onError: async (error) => {
      if (isAxiosError(error) && error.response?.status === 401) {
        await queryClient.cancelQueries({ queryKey: sessionQueryKey })
        queryClient.setQueryData(sessionQueryKey, null)
      }
    },
  })
}
