import {gql} from 'graphql-tag'
import PaymentProviderCustomer from '~/sdk/wep/models/paymentProvider/PaymentProviderCustomer'
import Address from '~/sdk/wep/models/user/Address'
import {UserMutationObject} from '~/sdk/wep/interfacesAndTypes/Custom'
import Subscription from '~/sdk/wep/models/subscription/Subscription'
import Subscriptions from '~/sdk/wep/models/subscription/Subscriptions'
import WepImage from '~/sdk/wep/models/image/WepImage'
import Invoices from '~/sdk/wep/models/invoice/Invoices'
import Invoice from '~/sdk/wep/models/invoice/Invoice'

export interface UserProps {
  id?: string
  name?: string
  firstName?: string
  email?: string
  preferredName?: string
  address?: Address
  flair?: string
  subscriptions?: Subscriptions
  invoices?: Invoices
  image?: WepImage
  createdOnClient?: Date
}

export default class User {
  public id?: string
  public firstName?: string
  public name?: string
  public email?: string
  public preferredName?: string
  public address?: Address
  public flair?: string
  public subscriptions?: Subscriptions
  public invoices?: Invoices
  public image?: WepImage
  public createdOnClient: Date

  constructor({
    id,
    name,
    firstName,
    email,
    preferredName,
    address,
    flair,
    subscriptions,
    invoices,
    image,
    createdOnClient
  }: UserProps) {
    this.id = id
    this.name = name
    this.firstName = firstName
    this.email = email
    this.preferredName = preferredName
    this.address = address ? new Address(address) : new Address({})
    this.flair = flair
    this.subscriptions = subscriptions
      ? new Subscriptions().parse(subscriptions as unknown as Subscription[])
      : undefined
    this.invoices = invoices
      ? new Invoices().parseApiData(invoices as unknown as Invoice[])
      : undefined
    this.image = image ? new WepImage(image) : undefined
    this.createdOnClient = createdOnClient || new Date()
  }

  public getUserName(): string | undefined {
    if (this.name && this.firstName) {
      return `${this.firstName} ${this.name}`
    }
    return this.firstName || this.name
  }

  public hasValidSubscription(): boolean {
    return !!this.subscriptions?.hasValidSubscription()
  }

  public getMutationObject(): UserMutationObject {
    return {
      name: this.name,
      firstName: this.firstName,
      email: this.email,
      address: this.address,
      flair: this.flair
    }
  }

  public clone(): User {
    const clone = new User({
      ...this,
      address: undefined,
      subscriptions: undefined,
      invoices: undefined
    })
    clone.address = this.address
    clone.subscriptions = this.subscriptions
    clone.invoices = this.invoices
    return clone
  }

  public clientObjectIsOlderThan(seconds: number) {
    const secondsSince = (new Date().getTime() - this.createdOnClient.getTime()) / 1000
    return secondsSince > seconds
  }

  /**
   *  GRAPHQL FRAGMENTS
   */
  public static addressFragment = gql`
    fragment address on UserAddress {
      company
      streetAddress
      streetAddress2
      zipCode
      city
      country
    }
  `

  public static userFragment = gql`
    fragment user on User {
      id
      name
      firstName
      email
      preferredName
      address {
        ...address
      }
      flair
      paymentProviderCustomers {
        ...paymentProviderCustomer
      }
      image {
        ...image
      }
    }
    ${User.addressFragment}
    ${PaymentProviderCustomer.paymentProviderCustomerFragment}
    ${WepImage.wepImageFragment}
  `
}
