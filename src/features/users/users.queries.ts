import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { sessionQueryKey } from '../auth/auth.queries'
import type { AuthUser } from '../auth/auth.types'
import { createUser, getUser, getUsers, updateUser, updateUserStatus } from './users.api'
import type { CreateUserInput, UpdateUserInput, UsersListParams } from './users.types'

function useStaffRequest() {
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

export function useUsersQuery(params: UsersListParams) {
  const read = useStaffRequest()
  return useQuery({
    // Search နဲ့ page အလိုက် list response ကို cache ခွဲထားသည်။
    queryKey: ['users', 'list', params],
    queryFn: ({ signal }) => read(() => getUsers(params, signal)),
  })
}

export function useUserQuery(id: string) {
  const read = useStaffRequest()
  return useQuery({
    queryKey: ['users', 'detail', id],
    queryFn: ({ signal }) => read(() => getUser(id, signal)),
  })
}

type SaveStaffInput =
  | { mode: 'create'; input: CreateUserInput }
  | { mode: 'edit'; id: string; input: UpdateUserInput }

export function useSaveStaffMutation() {
  const request = useStaffRequest()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: SaveStaffInput) => request(() =>
      values.mode === 'create' ? createUser(values.input) : updateUser(values.id, values.input),
    ),
    retry: false,
    gcTime: 0,
    onSuccess: async (saved) => {
      const detailKey = ['users', 'detail', saved.id]
      await queryClient.cancelQueries({ queryKey: detailKey, exact: true })
      queryClient.setQueryData(detailKey, saved)
      // ကိုယ့် account ပြင်ထားရင် header နဲ့ OwnerGuard ကို session cache ကနေ ချက်ချင်း update လုပ်သည်။
      if (queryClient.getQueryData<AuthUser | null>(sessionQueryKey)?.id === saved.id) {
        await queryClient.cancelQueries({ queryKey: sessionQueryKey, exact: true })
        queryClient.setQueryData<AuthUser | null>(sessionQueryKey, (user) =>
          user?.id === saved.id ? { id: saved.id, name: saved.name, username: saved.username, role: saved.role } : user,
        )
      }
      void queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
    },
  })
}

export function useUpdateStaffStatusMutation() {
  const request = useStaffRequest()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => request(() => updateUserStatus(id, isActive)),
    retry: false,
    onSuccess: async (saved) => {
      const detailKey = ['users', 'detail', saved.id]
      await queryClient.cancelQueries({ queryKey: detailKey, exact: true })
      queryClient.setQueryData(detailKey, saved)

      // ကိုယ့် account ကို deactivate လုပ်ရင် AuthGuard က login ကို ပြန်ပို့နိုင်ဖို့ session ကို ရှင်းသည်။
      if (!saved.isActive && queryClient.getQueryData<AuthUser | null>(sessionQueryKey)?.id === saved.id) {
        await queryClient.cancelQueries()
        queryClient.setQueryData<AuthUser | null>(sessionQueryKey, (user) => user?.id === saved.id ? null : user)
        if (queryClient.getQueryData(sessionQueryKey) === null) {
          queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' })
        }
        return
      }

      void queryClient.invalidateQueries({ queryKey: ['users', 'list'] })
    },
  })
}
