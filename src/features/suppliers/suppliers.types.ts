export type Supplier = {
  id: string
  name: string
  phone: string | null
  contactPerson: string | null
  isActive: boolean
}

// List မှာ address/notes မပါလို့ detail response ကို သီးခြားသတ်မှတ်သည်။
export type SupplierDetail = Supplier & {
  address: string | null
  notes: string | null
}

export type SupplierStatus = 'ALL' | 'ACTIVE' | 'INACTIVE'

export type SuppliersListParams = {
  search: string
  status: SupplierStatus
  page: number
  limit: number
}

export type CreateSupplierInput = {
  name: string
  phone?: string | null
  contactPerson?: string | null
  address?: string | null
  notes?: string | null
}

// PATCH မှာ omission က unchanged ဖြစ်ပြီး null က nullable field ကို clear လုပ်သည်။
export type UpdateSupplierInput = Partial<CreateSupplierInput>
