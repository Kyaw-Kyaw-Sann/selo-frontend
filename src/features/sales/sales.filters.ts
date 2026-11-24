import { z } from 'zod'

export function isSaleReferenceId(value: string) {
  return /^[1-9]\d{0,18}$/.test(value)
    && (value.length < 19 || value <= '9223372036854775807')
}

const dateSchema = z.iso.date()

export function getSalesFilterErrors(cashierId: string, from: string, to: string) {
  const cashier = cashierId && !isSaleReferenceId(cashierId) ? 'Enter a valid cashier ID' : ''
  const fromDate = from && !dateSchema.safeParse(from).success ? 'Enter a valid from date' : ''
  let toDate = to && !dateSchema.safeParse(to).success ? 'Enter a valid to date' : ''
  if (!fromDate && !toDate && from && to && from > to) {
    toDate = 'From date must not be after to date'
  }
  return { cashier, fromDate, toDate }
}
