export type Row = {
  status: string
  productCode: string
  productName: string
  periodAmount: string
  quantity: string
  totalOnPositionNet: string
  totalOnPositionGross: string
  vatRateOnPosition: string
  currency: string
  contactNumber: string
  contactType: string
  issue: string
  dateOfBirth: Date | undefined
  companyOrLastName: string
  firstName: string
  streetAddress: string
  zipCode: string
  city: string
  country: string
  start: string
  end: string
  email: string
}

export function convertColumnsToRow(row: string[]) {
  const [
    status,
    productCode,
    productName,
    periodAmount,
    quantity,
    totalOnPositionNet,
    totalOnPositionGross,
    vatRateOnPosition,
    currency,
    contactNumber,
    contactNumberDe,
    contactType,
    issue,
    email,
    dateOfBirth,
    companyOrLastName,
    firstName,
    streetAddress,
    zipCode,
    city,
    country,
    start,
    end
  ] = row
  return {
    status,
    productCode,
    productName,
    periodAmount,
    quantity,
    totalOnPositionNet,
    totalOnPositionGross,
    vatRateOnPosition,
    currency,
    contactNumber,
    contactType,
    issue,
    dateOfBirth: extractDate(dateOfBirth),
    companyOrLastName,
    firstName,
    streetAddress,
    zipCode,
    city,
    country,
    start,
    end,
    email
  }
}

export function extractDate(dateString: string) {
  if (!dateString || dateString === '0' || dateString === '00.01.00') {
    return undefined
  }
  const [day, month, yearString] = dateString.split('.')

  const year =
    +yearString > 1900 ? +yearString : +yearString > 15 ? 1900 + +yearString : 2000 + +yearString
  const date = new Date()
  date.setUTCDate(+day)
  date.setUTCMonth(+month - 1)
  date.setUTCFullYear(year)
  date.setUTCHours(12)
  date.setUTCMinutes(0)
  date.setUTCSeconds(0)
  date.setUTCMilliseconds(0)
  return date
}
