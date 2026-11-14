import { isAxiosError } from 'axios'
import { api } from '../../lib/api'
import type { ApiSuccess } from '../../types/api'
import type { AuthUser, LoginInput } from './auth.types'

export async function login(input: LoginInput): Promise<AuthUser> {
  const response = await api.post<ApiSuccess<AuthUser>>('/auth/login', input)
  return response.data.data
}

export async function getCurrentUser(signal?: AbortSignal): Promise<AuthUser | null> {
  try {
    const response = await api.get<ApiSuccess<AuthUser>>('/auth/me', { signal })
    return response.data.data
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      return null
    }

    throw error
  }
}

export async function logout(): Promise<void> {
  try {
    await api.post<ApiSuccess<null>>('/auth/logout')
  } catch (error) {
    // An already expired session is also logged out.
    if (isAxiosError(error) && error.response?.status === 401) return
    throw error
  }
}
