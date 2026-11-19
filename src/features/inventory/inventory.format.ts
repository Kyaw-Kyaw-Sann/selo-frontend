import type { MovementType } from './inventory.types'

export const movementTypeLabels: Record<MovementType, string> = {
  OPENING: 'Opening',
  PURCHASE: 'Purchase',
  SALE: 'Sale',
  RETURN: 'Return',
  ADJUSTMENT: 'Adjustment',
}

const movementDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  timeZone: 'UTC',
})

export function formatMovementDate(value: string) {
  return movementDateFormatter.format(new Date(value))
}

export function formatQuantityChange(value: number) {
  return `${value > 0 ? '+' : ''}${value.toLocaleString('en-US')}`
}
