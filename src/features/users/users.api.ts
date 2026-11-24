import { api } from '../../lib/api'
import type { ApiSuccess, PaginatedApiSuccess } from '../../types/api'
import type { CreateUserInput, StaffUser, UpdateUserInput, UsersListParams } from './users.types'

export async function getUsers(
  params: UsersListParams,
  signal?: AbortSignal,
): Promise<PaginatedApiSuccess<StaffUser>> {
  const response = await api.get<PaginatedApiSuccess<StaffUser>>('/users', { params, signal })
  return response.data
}

export async function getUser(id: string, signal?: AbortSignal): Promise<StaffUser> {
  const response = await api.get<ApiSuccess<StaffUser>>(`/users/${id}`, { signal })
  return response.data.data
}

export async function createUser(input: CreateUserInput): Promise<StaffUser> {
  const response = await api.post<ApiSuccess<StaffUser>>('/users', input)
  return response.data.data
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<StaffUser> {
  const response = await api.patch<ApiSuccess<StaffUser>>(`/users/${id}`, input)
  return response.data.data
}

export async function updateUserStatus(id: string, isActive: boolean): Promise<StaffUser> {
  const response = await api.patch<ApiSuccess<StaffUser>>(`/users/${id}/status`, { isActive })
  return response.data.data
}
