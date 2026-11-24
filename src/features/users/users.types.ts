import type { AuthUser } from '../auth/auth.types'

export type StaffUser = AuthUser & {
  isActive: boolean
}

export type UsersListParams = {
  search: string
  page: number
  limit: number
}

type StaffProfile = Pick<StaffUser, 'name' | 'username' | 'role'>

export type CreateUserInput = StaffProfile & {
  password: string
}

// PATCH မှာ မပို့တဲ့ profile fields တွေရဲ့ တန်ဖိုးကို backend က ဆက်ထိန်းထားသည်။
export type UpdateUserInput = Partial<StaffProfile>
