export default class Address {
  public company?: string
  public streetAddress?: string
  public streetAddress2?: string
  public zipCode?: string
  public city?: string
  public country?: string

  constructor({
    company,
    streetAddress,
    streetAddress2,
    zipCode,
    city,
    country
  }: {
    company?: string
    streetAddress?: string
    streetAddress2?: string
    zipCode?: string
    city?: string
    country?: string
  }) {
    this.company = company
    this.streetAddress = streetAddress
    this.streetAddress2 = streetAddress2
    this.zipCode = zipCode
    this.city = city
    this.country = country
  }

  public isEmpty(): boolean {
    return (
      !this.company &&
      !this.streetAddress &&
      !this.streetAddress2 &&
      !this.zipCode &&
      !this.city &&
      !this.country
    )
  }
}
