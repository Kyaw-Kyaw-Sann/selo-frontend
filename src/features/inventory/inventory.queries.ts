import { isAxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionQueryKey } from '../auth/auth.queries'
import { createInventoryAdjustment, getInventory, getInventoryMovement, getInventoryMovements } from './inventory.api'
import type { InventoryListParams, InventoryMovementsListParams } from './inventory.types'

export function useInventoryQuery(params: InventoryListParams) {
  const queryClient = useQueryClient()

  return useQuery({
    // Search/status/page အလိုက် cache ခွဲပြီး obsolete requests ကို signal နဲ့ ရပ်သည်။
    queryKey: ['inventory', 'list', params],
    queryFn: async ({ signal }) => {
      try {
        return await getInventory(params, signal)
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

export function useCreateInventoryAdjustmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createInventoryAdjustment,
    retry: false,
    onSuccess: async (saved) => {
      // Adjustment response က full product/movement detail မဟုတ်လို့ cache ကို မဖုံးပါ။
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['inventory', 'list'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory', 'movements', 'list'] }),
        queryClient.invalidateQueries({ queryKey: ['products', 'list'] }),
        queryClient.invalidateQueries({ queryKey: ['products', 'detail', saved.productId], exact: true }),
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

export function useInventoryMovementsQuery(params: InventoryMovementsListParams, enabled = true) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['inventory', 'movements', 'list', params],
    enabled,
    queryFn: async ({ signal }) => {
      try {
        return await getInventoryMovements(params, signal)
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

export function useInventoryMovementQuery(id: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['inventory', 'movements', 'detail', id],
    enabled: Boolean(id),
    queryFn: async ({ signal }) => {
      try {
        return await getInventoryMovement(id, signal)
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
