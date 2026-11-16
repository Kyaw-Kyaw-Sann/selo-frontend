import { z } from 'zod'

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(150, 'Category name must not exceed 150 characters'),
  // Native select က string ပြန်ပေးသည်။ Empty option ကို submit မှာ null ပြောင်းမည်။
  parentId: z.string(),
})

export type CategoryFormInput = z.infer<typeof categoryFormSchema>
