
export type Unit = {
  id: string
  name: string
  code: string
  isActive: boolean
}

export type UnitsListParams = {
  search: string
  page: number
  limit: number
}

export type CreateUnitInput = {
  name: string
  code: string
}

export type UpdateUnitInput = Partial<CreateUnitInput>
