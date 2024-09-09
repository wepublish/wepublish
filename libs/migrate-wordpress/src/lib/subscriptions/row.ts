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
  dateOfBirth: string
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
    contactType,
    issue,
    dateOfBirth,
    companyOrLastName,
    firstName,
    streetAddress,
    zipCode,
    city,
    country,
    start,
    end,
    email
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
    dateOfBirth,
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
