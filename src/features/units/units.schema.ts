import { z } from 'zod'

export const unitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Unit name is required')
    .max(80, 'Unit name must not exceed 80 characters'),
  code: z
    .string()
    .trim()
    .min(1, 'Unit code is required')
    .max(30, 'Unit code must not exceed 30 characters'),
})