import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { sessionQueryKey } from '../auth/auth.queries'
import type { AuthUser } from '../auth/auth.types'
import { createSale, getSale, getSales } from './sales.api'
import type { SalesListParams } from './sales.types'

function useSalesRead() {
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

export function useSalesQuery(params: SalesListParams, enabled: boolean) {
  const read = useSalesRead()
  return useQuery({
    queryKey: ['sales', 'list', params],
    enabled,
    queryFn: ({ signal }) => read(() => getSales(params, signal)),
  })
}

export function useSaleQuery(id: string, user: AuthUser | null | undefined) {
  const read = useSalesRead()
  return useQuery({
    // Owner detail မှာ cost ပါလို့ account နဲ့ role အလိုက် cache ခွဲထားသည်။
    queryKey: ['sales', 'detail', id, user?.id, user?.role],
    enabled: Boolean(id && user),
    queryFn: ({ signal }) => read(() => getSale(id, signal)),
  })
}

export function useCreateSaleMutation() {
  return useMutation({ mutationFn: createSale, retry: false })
}
