import { formatMmk } from '../../utils/format'

export type PosCartItem = {
  productId: string
  productUnitId: string
  productName: string
  unitName: string
  imagePath: string | null
  unitPrice: string
  conversionFactor: number
  stockQuantity: number
}

export type PosCartLine = PosCartItem & { quantity: number }

export function toPosMinorUnits(price: string) {
  const [whole, fraction = ''] = price.split('.')
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
}

export function formatPosTotal(minor: bigint) {
  return formatMmk(`${minor / 100n}.${(minor % 100n).toString().padStart(2, '0')}`)
}

export function getPosTotal(lines: PosCartLine[]) {
  return lines.reduce((total, line) => total + toPosMinorUnits(line.unitPrice) * BigInt(line.quantity), 0n)
}

export function getCartAddError(lines: PosCartLine[], item: PosCartItem) {
  const existing = lines.find((line) => line.productUnitId === item.productUnitId)
  if (!existing && lines.length >= 100) return 'The cart can contain up to 100 lines.'

  // Product တစ်မျိုးကို unit မတူဘဲ ရွေးထားရင်လည်း stock ကို base units နဲ့ စုပေါင်းစစ်သည်။
  const nextQuantity = BigInt((existing?.quantity ?? 0) + 1)
  const reservedByOtherUnits = lines.filter((line) => line.productId === item.productId && line.productUnitId !== item.productUnitId)
    .reduce((total, line) => total + BigInt(line.quantity) * BigInt(line.conversionFactor), 0n)
  const nextReserved = reservedByOtherUnits + nextQuantity * BigInt(item.conversionFactor)
  if (nextReserved > BigInt(item.stockQuantity)) return 'Not enough stock for this unit.'

  const price = toPosMinorUnits(item.unitPrice)
  const replacedTotal = existing ? toPosMinorUnits(existing.unitPrice) * BigInt(existing.quantity) : 0n
  const newTotal = getPosTotal(lines) - replacedTotal + price * nextQuantity
  if (newTotal > 999999999999999999n) return 'The cart total exceeds the supported limit.'
  return ''
}

export function addCartItem(lines: PosCartLine[], item: PosCartItem): PosCartLine[] {
  if (getCartAddError(lines, item)) return lines
  const existing = lines.some((line) => line.productUnitId === item.productUnitId)
  const updated = lines.map((line) => {
    if (line.productUnitId === item.productUnitId) return { ...item, quantity: line.quantity + 1 }
    return line.productId === item.productId ? { ...line, stockQuantity: item.stockQuantity } : line
  })
  return existing ? updated : [...updated, { ...item, quantity: 1 }]
}

export function decreaseCartLine(lines: PosCartLine[], productUnitId: string) {
  return lines.map((line) => line.productUnitId === productUnitId ? { ...line, quantity: line.quantity - 1 } : line)
    .filter((line) => line.quantity > 0)
}
