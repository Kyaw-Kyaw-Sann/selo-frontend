import { isAxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionQueryKey } from '../auth/auth.queries'
import { createUnit, getUnits, getUnitOptions, updateUnit, updateUnitStatus } from './units.api'
import type { CreateUnitInput, UnitsListParams } from './units.types'

// Hook က state ကို ချက်ချင်းပြန်ပေးရလို့ async မထားပါ။
export function useUnitsQuery(params: UnitsListParams) {
  const queryClient = useQueryClient()

  return useQuery({
    // Search/page/limit အလိုက် သက်ဆိုင်ရာ cache ကို ခွဲထားသည်။
    queryKey: ['units', 'list', params],

    // Async HTTP request ကို queryFn က ကိုင်တွယ်သည်။
    queryFn: async ({ signal }) => {
      try {
        return await getUnits(params, signal)
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          // Session request အဟောင်းက user ကို ပြန်မဖြည့်စေရန် ရပ်သည်။
          await queryClient.cancelQueries({ queryKey: sessionQueryKey })

          // AuthGuard က logged-out state ကိုတွေ့ပြီး Login ဆီပို့မည်။
          queryClient.setQueryData(sessionQueryKey, null)
        }

        throw error
      }
    },
  })
}

export function useSaveUnitMutation(unitId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    // ID ရှိလျှင် edit၊ မရှိလျှင် create ဖြစ်ပြီး cache/error flow တူသည်။
    mutationFn: (input: CreateUnitInput) =>
      unitId ? updateUnit(unitId, input) : createUnit(input),
    retry: false,

    onSuccess: async () => {
      // Search/page တစ်မျိုးစီရဲ့ list cache ကို stale ဖြစ်စေပြီး
      // လက်ရှိပြထားတဲ့ list ကို server ကနေ ပြန်ယူသည်။
      await queryClient.invalidateQueries({
        queryKey: ['units'],
      })
    },

    onError: async (error) => {
      if (isAxiosError(error) && error.response?.status === 401) {
        await queryClient.cancelQueries({ queryKey: sessionQueryKey })
        queryClient.setQueryData(sessionQueryKey, null)
      }

      // 403/409 စတဲ့ errors ကို dialog က သီးခြားပြမည်။
    },
  })
}

export function useUpdateUnitStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    // Toggle command မဟုတ်ဘဲ လိုချင်တဲ့ status ကို Boolean အဖြစ် ပို့သည်။
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUnitStatus(id, isActive),
    retry: false,
    onSuccess: async () => {
      // Server အောင်မြင်မှ list ကို ပြန်ယူသည်။ Local status ကို ကြိုမပြောင်းပါ။
      await queryClient.invalidateQueries({ queryKey: ['units'] })
    },
    onError: async (error) => {
      if (isAxiosError(error) && error.response?.status === 401) {
        await queryClient.cancelQueries({ queryKey: sessionQueryKey })
        queryClient.setQueryData(sessionQueryKey, null)
      }
    },
  })
}

export function useUnitOptionsQuery() {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['units', 'options'],
    queryFn: async ({ signal }) => {
      try {
        return await getUnitOptions(signal)
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

