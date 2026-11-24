const utcDateTime = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

export function formatUtcDateTime(value: string) {
  return utcDateTime.format(new Date(value))
}

export function formatMmk(value: string) {
  const [whole, fraction = ''] = value.split('.')
  // Decimal string ကို Number မပြောင်းဘဲ precision ထိန်းထားသည်။
  return `${BigInt(whole).toLocaleString('en-US')}.${fraction.padEnd(2, '0')} MMK`
}
