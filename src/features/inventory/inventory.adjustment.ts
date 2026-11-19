import { isAxiosError } from 'axios'
import type { ApiError } from '../../types/api'

export function isUncertainAdjustmentError(error: unknown) {
  if (!isAxiosError<ApiError>(error) || !error.response) return true

  const { status, data } = error.response
  if ([400, 401, 403, 404].includes(status)) return false

  // ဒီ 409 နှစ်မျိုးက rollback သေချာသည်။ Duplicate key/5xx/network failure က result မသေချာပါ။
  return !(status === 409 && ['INSUFFICIENT_STOCK', 'STOCK_LIMIT_EXCEEDED'].includes(data?.code ?? ''))
}
