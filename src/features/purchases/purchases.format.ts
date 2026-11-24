import { formatMmk } from '../../utils/format'

export { formatMmk as formatPurchaseAmount, formatUtcDateTime as formatPurchaseDate } from '../../utils/format'

export function formatPurchaseMinorUnits(value: bigint) {
  const fraction = (value % 100n).toString().padStart(2, '0')
  return formatMmk(`${value / 100n}.${fraction}`)
}
