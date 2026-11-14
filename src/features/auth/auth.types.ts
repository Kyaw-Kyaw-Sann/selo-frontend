export type AuthUser = {
  id: string
  name: string
  username: string
  role: 'OWNER' | 'CASHIER'
}

export type LoginInput = {
  username: string
  password: string
}
