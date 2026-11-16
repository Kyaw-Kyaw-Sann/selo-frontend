export type Category = {
  id: string
  name: string
  parentId: string | null
  isActive: boolean
}

// List response မှာ root ကသာ children array ပါသည်။
export type RootCategory = Category & {
  parentId: null
  children: Category[]
}

export type CategoriesListParams = {
  page: number
  limit: number
}

export type CreateCategoryInput = {
  name: string
  parentId: string | null
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>
