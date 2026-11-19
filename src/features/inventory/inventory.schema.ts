import { z } from 'zod'

export const movementDateRangeSchema = z.object({
  from: z.union([z.iso.date(), z.literal('')], { error: 'Enter a valid from date' }),
  to: z.union([z.iso.date(), z.literal('')], { error: 'Enter a valid to date' }),
}).refine((range) => !range.from || !range.to || range.from <= range.to, {
  message: 'From date must not be after to date',
  path: ['to'],
})

export const stockAdjustmentSchema = z.object({
  quantityChange: z.number({ error: 'Enter a whole-number quantity change' })
    .int('Enter a whole-number quantity change')
    .min(-2147483647, 'Quantity change is below the supported limit')
    .max(2147483647, 'Quantity change exceeds the supported limit')
    .refine((value) => value !== 0, 'Quantity change must not be zero'),
  reason: z.string().trim().min(1, 'Reason is required').max(255, 'Reason must not exceed 255 characters'),
})

export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>
