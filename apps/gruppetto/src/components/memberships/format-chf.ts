export const monthlyValueToYearly = (value: number) => Math.ceil((value / 100) * 12)

export const formatChf = (value: number) => {
  const formatter = new Intl.NumberFormat('ch-DE', {style: 'currency', currency: 'CHF'})
  const result = formatter.format(value)

  if (result.endsWith('.00')) {
    return result.replace('.00', '.-')
  }

  return result
}
