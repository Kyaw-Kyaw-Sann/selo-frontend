import { isAxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionQueryKey } from '../auth/auth.queries'
import { createCategory, getCategories, getRootCategories, updateCategory, updateCategoryStatus } from './categories.api'
import type { Category, CategoriesListParams, CreateCategoryInput, UpdateCategoryInput } from './categories.types'

export function useCategoriesQuery(params: CategoriesListParams) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['categories', 'list', params],
    queryFn: async ({ signal }) => {
      try {
        return await getCategories(params, signal)
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          // Session expired ဖြစ်လျှင် AuthGuard ကို logged-out state ပေးသည်။
          await queryClient.cancelQueries({ queryKey: sessionQueryKey })
          queryClient.setQueryData(sessionQueryKey, null)
        }
        throw error
      }
    },
  })
}

export function useRootCategoriesQuery() {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['categories', 'roots'],
    queryFn: async ({ signal }) => {
      try {
        return await getRootCategories(signal)
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

export function useSaveCategoryMutation(category?: Category) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => {
      if (!category) return createCategory(input)

      // PATCH မှာ ပြောင်းထားတဲ့ fields ကိုသာပို့ပြီး omission = unchanged ကို ထိန်းသည်။
      const changes: UpdateCategoryInput = {}
      if (input.name !== category.name) changes.name = input.name
      if (input.parentId !== category.parentId) changes.parentId = input.parentId
      return updateCategory(category.id, changes)
    },
    retry: false,
    onSuccess: async () => {
      // List pages နဲ့ parent options နှစ်မျိုးလုံး ပြန်လည်သစ်လွင်စေသည်။
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: async (error) => {
      if (isAxiosError(error) && error.response?.status === 401) {
        await queryClient.cancelQueries({ queryKey: sessionQueryKey })
        queryClient.setQueryData(sessionQueryKey, null)
      }
    },
  })
}

export function useUpdateCategoryStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    // လိုချင်တဲ့ status ကို ပို့သည်။ Children/products ကို local မှာ မပြောင်းပါ။
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateCategoryStatus(id, isActive),
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: async (error) => {
      if (isAxiosError(error) && error.response?.status === 401) {
        await queryClient.cancelQueries({ queryKey: sessionQueryKey })
        queryClient.setQueryData(sessionQueryKey, null)
      }
    },
  })
}
