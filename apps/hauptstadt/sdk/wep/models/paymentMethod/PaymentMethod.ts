import {gql} from 'graphql-tag'
import {PaymentMethodId} from '~/sdk/wep/interfacesAndTypes/WePublish'

export default class PaymentMethod {
  public id: string
  public slug: string
  public paymentProviderId: PaymentMethodId
  public name: string
  public description: string

  constructor({
    id,
    slug,
    paymentProviderId,
    name,
    description
  }: {
    id: string
    slug: string
    paymentProviderId: PaymentMethodId
    name: string
    description: string
  }) {
    this.id = id
    this.slug = slug
    this.paymentProviderId = paymentProviderId
    this.name = name
    this.description = description
  }

  public getId(): string {
    return this.id
  }

  public getSlug(): string {
    return this.slug
  }

  // the auto charging payment method slugs are defined in the nuxt.config.js file
  public isAutoCharging(autoChargingPmSlugs: string[]): boolean {
    return autoChargingPmSlugs.includes(this.slug)
  }

  public static paymentMethodFragment = gql`
    fragment paymentMethod on PaymentMethod {
      id
      paymentProviderID
      name
      slug
      description
    }
  `
}
