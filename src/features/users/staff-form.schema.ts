import { z } from 'zod'
import type { StaffUser, UpdateUserInput } from './users.types'

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150, 'Name must not exceed 150 characters'),
  username: z.string().trim().min(1, 'Username is required').max(80, 'Username must not exceed 80 characters'),
  role: z.enum(['OWNER', 'CASHIER']),
})

export const createStaffSchema = profileSchema.extend({
  password: z.string()
    .min(8, 'Password must contain at least 8 characters')
    // Backend နဲ့တူအောင် UTF-8 bytes နဲ့ စစ်ပြီး password ကို trim မလုပ်ပါ။
    .refine((value) => new TextEncoder().encode(value).length <= 72, 'Password must not exceed 72 bytes'),
})

export const editStaffFormSchema = profileSchema.extend({ password: z.string() })
export type StaffFormValues = z.infer<typeof createStaffSchema>

export function getStaffUpdates(staff: StaffUser, values: Pick<StaffFormValues, 'name' | 'username' | 'role'>) {
  const input: UpdateUserInput = {}
  if (values.name !== staff.name) input.name = values.name
  if (values.username !== staff.username) input.username = values.username
  if (values.role !== staff.role) input.role = values.role
  return input
}
