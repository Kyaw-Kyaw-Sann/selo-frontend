import { isAxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionQueryKey } from '../auth/auth.queries'
import { createSupplier, getSupplier, getSuppliers, updateSupplier, updateSupplierStatus } from './suppliers.api'
import type { CreateSupplierInput, SupplierDetail, SuppliersListParams, UpdateSupplierInput } from './suppliers.types'

export function useSuppliersQuery(params: SuppliersListParams) {
  const queryClient = useQueryClient()

  return useQuery({
    // Search/status/page အလိုက် cache ခွဲပြီး obsolete requests ကို signal နဲ့ ရပ်သည်။
    queryKey: ['suppliers', 'list', params],
    queryFn: async ({ signal }) => {
      try {
        return await getSuppliers(params, signal)
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          await queryClient.cancelQueries({ queryKey: sessionQueryKey })
          queryClient.setQueryData(sessionQueryKey, null)
        }
        // 403 ကို session expired အဖြစ်မယူဘဲ page မှာ permission error ပြမည်။
        throw error
      }
    },
  })
}

export function useSupplierQuery(id: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['suppliers', 'detail', id],
    enabled: Boolean(id),
    queryFn: async ({ signal }) => {
      try {
        return await getSupplier(id, signal)
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

export function useSaveSupplierMutation(supplier?: SupplierDetail) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateSupplierInput) => {
      if (!supplier) return createSupplier(input)

      const changes: UpdateSupplierInput = {}
      if (input.name !== supplier.name) changes.name = input.name
      // မပို့တဲ့ optional field ကို မပြောင်းဘဲ explicit null ကိုသာ clear အဖြစ်ပို့သည်။
      for (const field of ['phone', 'contactPerson', 'address', 'notes'] as const) {
        if (input[field] !== undefined && input[field] !== supplier[field]) changes[field] = input[field]
      }
      if (Object.keys(changes).length === 0) return Promise.resolve(supplier)
      return updateSupplier(supplier.id, changes)
    },
    retry: false,
    onSuccess: async (saved) => {
      const detailKey = ['suppliers', 'detail', saved.id]
      // Full detail response ကို သိမ်းပြီး list filters/pages ကို server က ပြန်ယူသည်။
      await queryClient.cancelQueries({ queryKey: detailKey, exact: true })
      queryClient.setQueryData(detailKey, saved)
      await queryClient.invalidateQueries({ queryKey: ['suppliers', 'list'] })
    },
    onError: async (error) => {
      if (isAxiosError(error) && error.response?.status === 401) {
        await queryClient.cancelQueries({ queryKey: sessionQueryKey })
        queryClient.setQueryData(sessionQueryKey, null)
      }
    },
  })
}

export function useUpdateSupplierStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    // Toggle command မဟုတ်ဘဲ လိုချင်တဲ့ status ကို explicit Boolean အဖြစ် ပို့သည်။
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateSupplierStatus(id, isActive),
    retry: false,
    onSuccess: async (saved) => {
      const detailKey = ['suppliers', 'detail', saved.id]
      await queryClient.cancelQueries({ queryKey: detailKey, exact: true })
      queryClient.setQueryData(detailKey, saved)
      await queryClient.invalidateQueries({ queryKey: ['suppliers', 'list'] })
    },
    onError: async (error) => {
      if (isAxiosError(error) && error.response?.status === 401) {
        await queryClient.cancelQueries({ queryKey: sessionQueryKey })
        queryClient.setQueryData(sessionQueryKey, null)
      }
    },
  })
}
