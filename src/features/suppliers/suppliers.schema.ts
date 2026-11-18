import { z } from 'zod'

export const supplierSchema = z.object({
  name: z.string().trim().min(1, 'Supplier name is required').max(200, 'Name must not exceed 200 characters'),
  // Form က blank string ကို ထိန်းပြီး API payload အတွက် null ပြောင်းသည်။
  phone: z.string().trim().max(40, 'Phone must not exceed 40 characters').transform((value) => value || null),
  contactPerson: z.string().trim().max(150, 'Contact person must not exceed 150 characters').transform((value) => value || null),
  address: z.string().trim().max(5000, 'Address must not exceed 5000 characters').transform((value) => value || null),
  notes: z.string().trim().max(5000, 'Notes must not exceed 5000 characters').transform((value) => value || null),
})

export type SupplierFormValues = z.input<typeof supplierSchema>
export type SupplierFormInput = z.output<typeof supplierSchema>
