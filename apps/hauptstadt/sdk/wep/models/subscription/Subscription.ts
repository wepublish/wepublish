import moment, {Moment} from 'moment'
import {gql} from 'graphql-tag'
import MemberPlan from '~/sdk/wep/models/memberPlan/MemberPlan'
import PaymentMethod from '~/sdk/wep/models/paymentMethod/PaymentMethod'
import {PaymentPeriodicity} from '~/sdk/wep/models/paymentMethod/AvailablePaymentMethod'
import SubscriptionDeactivation from '~/sdk/wep/models/subscription/SubscriptionDeactivation'
import Property from '~/sdk/wep/models/properties/Property'
import {PaymentMethodId} from '~/sdk/wep/interfacesAndTypes/WePublish'

export default class Subscription {
  public id: string
  public memberPlan?: MemberPlan
  public paymentPeriodicity: PaymentPeriodicity
  public monthlyAmount: number
  public autoRenew: boolean
  public startsAt?: Moment
  public paidUntil?: Moment
  public paymentMethod?: PaymentMethod
  public deactivation?: SubscriptionDeactivation
  public extendable: boolean

  constructor({
    id,
    memberPlan,
    paymentPeriodicity,
    monthlyAmount,
    autoRenew,
    startsAt,
    paidUntil,
    paymentMethod,
    deactivation,
    extendable
  }: {
    id: string
    memberPlan?: MemberPlan
    paymentPeriodicity: PaymentPeriodicity
    monthlyAmount: number
    autoRenew: boolean
    startsAt?: Moment
    paidUntil?: Moment
    paymentMethod?: PaymentMethod
    deactivation?: SubscriptionDeactivation
    extendable: boolean
  }) {
    this.id = id
    this.memberPlan = memberPlan ? new MemberPlan(memberPlan) : undefined
    this.paymentPeriodicity = paymentPeriodicity
    this.monthlyAmount = monthlyAmount
    this.autoRenew = autoRenew
    this.startsAt = startsAt ? moment(startsAt) : undefined
    this.paidUntil = paidUntil ? moment(paidUntil) : undefined
    this.paymentMethod = paymentMethod ? new PaymentMethod(paymentMethod) : undefined
    this.deactivation = deactivation ? new SubscriptionDeactivation(deactivation) : undefined
    this.extendable = extendable
  }

  /**
   * Checks if the payment is valid based on the current date.
   *
   * @returns {boolean} Returns true if the payment is valid, otherwise false.
   */
  public isValid(): boolean {
    if (this.isValidInvoiceSubscription()) {
      return true
    }
    const today: Moment = moment()
    return !!this.paidUntil?.isSameOrAfter(today)
  }

  isValidInvoiceSubscription(): boolean {
    const bexioType: PaymentMethodId = 'bexio'
    const invoiceOnly: PaymentMethodId = 'payrexx-invoice-only'
    if (this.paymentMethod?.slug !== bexioType && this.paymentMethod?.slug !== invoiceOnly) {
      return false
    }
    // new subscription doesn't have a paid until
    const startDate = this.paidUntil ? this.paidUntil : this.startsAt
    const GRACE_PERIOD: number = 30
    const today: Moment = moment().subtract(GRACE_PERIOD, 'days')
    return !!startDate?.isSameOrAfter(today)
  }

  public isDeactivated() {
    return !!this.deactivation
  }

  public getPaymentMethod(): PaymentMethod | undefined {
    return this.paymentMethod
  }

  // the auto charging payment method slugs are defined in the nuxt.config.js file
  public willBeAutoCharged(autoChargingPmSlugs: string[]): boolean {
    return (
      !!this.paymentMethod?.isAutoCharging(autoChargingPmSlugs) && this.isValid() && this.autoRenew
    )
  }

  public getPaymentPeriodicityReadable(asNoun: boolean = false): string {
    if (asNoun) {
      switch (this.paymentPeriodicity) {
        case 'YEARLY':
          return 'Jahr'
        case 'BIANNUAL':
          return 'halbes Jahr'
        case 'QUARTERLY':
          return 'Quartal'
        case 'MONTHLY':
          return 'Monat'
        default:
          return ''
      }
    }
    switch (this.paymentPeriodicity) {
      case 'YEARLY':
        return 'jährlich'
      case 'BIANNUAL':
        return 'halbjährlich'
      case 'QUARTERLY':
        return 'quartalsweise'
      case 'MONTHLY':
        return 'monatlich'
      default:
        return ''
    }
  }

  public static subscriptionFragment = gql`
    fragment subscription on Subscription {
      id
      memberPlan {
        ...memberPlan
      }
      paymentPeriodicity
      monthlyAmount
      autoRenew
      startsAt
      paidUntil
      paymentMethod {
        ...paymentMethod
      }
      deactivation {
        ...deactivation
      }
      properties {
        ...property
      }
    }
    ${MemberPlan.memberPlanFragment}
    ${PaymentMethod.paymentMethodFragment}
    ${SubscriptionDeactivation.deactivationFragment}
    ${Property.propertyFragment}
  `
}
