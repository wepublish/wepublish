import {
  Invoice,
  MemberPlan,
  MetadataProperty,
  Payment,
  PaymentMethod,
  PaymentPeriodicity,
  PaymentProviderCustomer,
  PaymentState,
  PrismaClient,
  Subscription,
  SubscriptionDeactivationReason,
  SubscriptionEvent,
  User
} from '@prisma/client'
import {mailLogType} from '@wepublish/mails'
import {unselectPassword} from '@wepublish/user/api'
import {DataLoaderContext} from './context'
import {InvoiceWithItems} from './db/invoice'
import {MemberPlanWithPaymentMethods} from './db/memberPlan'
import {SubscriptionWithRelations} from './db/subscription'
import {InternalError, NotFound, PaymentConfigurationNotAllowed, UserInputError} from './error'
import {MailContext} from '@wepublish/mails'
import {PaymentProvider} from './payments/paymentProvider'
import {logger} from '@wepublish/utils'
import {ONE_DAY_IN_MILLISECONDS, ONE_MONTH_IN_MILLISECONDS} from './utility'
import {SubscriptionEventDictionary} from '@wepublish/membership/api'

export interface HandleSubscriptionChangeProps {
  subscription: SubscriptionWithRelations
}

export interface RenewSubscriptionForUserProps {
  subscription: SubscriptionWithRelations
}

export interface ChargeInvoiceProps {
  user: User
  invoice: InvoiceWithItems
  paymentMethodID: string
  customer: PaymentProviderCustomer
}

export interface DeactivateSubscriptionForUserProps {
  subscriptionID: string
  deactivationDate?: Date
  deactivationReason?: SubscriptionDeactivationReason
}

export interface MemberContext {
  prisma: PrismaClient
  loaders: DataLoaderContext
  paymentProviders: PaymentProvider[]

  mailContext: MailContext

  getLoginUrlForUser(user: User): string

  handleSubscriptionChange(props: HandleSubscriptionChangeProps): Promise<Subscription>

  renewSubscriptionForUser(props: RenewSubscriptionForUserProps): Promise<Invoice | null>

  chargeInvoice(props: ChargeInvoiceProps): Promise<boolean | Payment>

  deactivateSubscriptionForUser(props: DeactivateSubscriptionForUserProps): Promise<void>
}

export interface MemberContextProps {
  readonly prisma: PrismaClient
  readonly loaders: DataLoaderContext
  readonly paymentProviders: PaymentProvider[]
  readonly mailContext: MailContext

  getLoginUrlForUser(user: User): string
}

export function getNextDateForPeriodicity(start: Date, periodicity: PaymentPeriodicity): Date {
  start = new Date(start.getTime() - ONE_DAY_IN_MILLISECONDS) // create new Date object
  switch (periodicity) {
    case PaymentPeriodicity.monthly:
      return new Date(start.setMonth(start.getMonth() + 1))
    case PaymentPeriodicity.quarterly:
      return new Date(start.setMonth(start.getMonth() + 3))
    case PaymentPeriodicity.biannual:
      return new Date(start.setMonth(start.getMonth() + 6))
    case PaymentPeriodicity.yearly:
      return new Date(start.setMonth(start.getMonth() + 12))
  }
}

export function calculateAmountForPeriodicity(
  monthlyAmount: number,
  periodicity: PaymentPeriodicity
): number {
  switch (periodicity) {
    case PaymentPeriodicity.monthly:
      return monthlyAmount
    case PaymentPeriodicity.quarterly:
      return monthlyAmount * 3
    case PaymentPeriodicity.biannual:
      return monthlyAmount * 6
    case PaymentPeriodicity.yearly:
      return monthlyAmount * 12
  }
}

export class MemberContext implements MemberContext {
  loaders: DataLoaderContext
  paymentProviders: PaymentProvider[]

  mailContext: MailContext
  getLoginUrlForUser: (user: User) => string

  constructor(props: MemberContextProps) {
    this.loaders = props.loaders
    this.paymentProviders = props.paymentProviders
    this.prisma = props.prisma

    this.mailContext = props.mailContext

    this.getLoginUrlForUser = props.getLoginUrlForUser
  }

  async handleSubscriptionChange({
    subscription
  }: HandleSubscriptionChangeProps): Promise<Subscription> {
    // Check if user has any unpaid Periods and delete them and their invoices if so
    const invoices = await this.prisma.invoice.findMany({
      where: {
        subscriptionID: subscription.id
      },
      include: {
        items: true
      }
    })

    const openInvoice = invoices.find(
      invoice => invoice?.paidAt === null && invoice?.canceledAt === null
    )

    if (openInvoice || subscription.paidUntil === null || subscription.paidUntil <= new Date()) {
      const periodToDelete = subscription.periods.find(
        period => period.invoiceID === openInvoice?.id
      )

      if (periodToDelete) {
        await this.prisma.subscription.update({
          where: {id: subscription.id},
          data: {
            periods: {
              delete: {
                id: periodToDelete.id
              }
            }
          }
        })
      }

      if (openInvoice) {
        await this.prisma.invoice.delete({
          where: {id: openInvoice.id}
        })
      }

      const finalUpdatedSubscription = await this.prisma.subscription.findUnique({
        where: {id: subscription.id},
        include: {
          deactivation: true,
          periods: true,
          properties: true
        }
      })

      if (!finalUpdatedSubscription) throw new Error('Error during updateSubscription')

      // renew user subscription
      await this.renewSubscriptionForUser({
        subscription: finalUpdatedSubscription
      })

      return finalUpdatedSubscription
    }
    return subscription
  }

  async renewSubscriptionForUser({
    subscription
  }: RenewSubscriptionForUserProps): Promise<InvoiceWithItems | null> {
    try {
      const {periods = [], paidUntil, deactivation} = subscription

      if (deactivation) {
        logger('memberContext').info(
          'Subscription with id %s is deactivated and will not be renewed',
          subscription.id
        )
        return null
      }

      periods.sort((periodA, periodB) => {
        if (periodA.endsAt < periodB.endsAt) return -1
        if (periodA.endsAt > periodB.endsAt) return 1
        return 0
      })

      if (
        periods.length > 0 &&
        (paidUntil === null ||
          (paidUntil !== null && periods[periods.length - 1].endsAt > paidUntil))
      ) {
        const period = periods[periods.length - 1]
        const invoice = await this.prisma.invoice.findUnique({
          where: {
            id: period.invoiceID
          },
          include: {
            items: true
          }
        })

        // only return the invoice if it hasn't been canceled. Otherwise
        // create a new period and a new invoice
        if (!invoice?.canceledAt) {
          return invoice
        }
      }

      const startDate = new Date(
        paidUntil && paidUntil.getTime() > new Date().getTime() - ONE_MONTH_IN_MILLISECONDS
          ? paidUntil.getTime() + ONE_DAY_IN_MILLISECONDS
          : new Date().getTime()
      )
      const nextDate = getNextDateForPeriodicity(
        startDate,
        subscription.paymentPeriodicity as PaymentPeriodicity
      )
      const amount = calculateAmountForPeriodicity(
        subscription.monthlyAmount,
        subscription.paymentPeriodicity as PaymentPeriodicity
      )

      const user = await this.prisma.user.findUnique({
        where: {
          id: subscription.userID
        },
        select: unselectPassword
      })

      if (!user) {
        logger('memberContext').info('User with id "%s" not found', subscription.userID)
        return null
      }

      const newInvoice = await this.prisma.invoice.create({
        data: {
          subscriptionID: subscription.id,
          description: `Membership from ${startDate.toISOString()} for ${user.name || user.email}`,
          mail: user.email,
          dueAt: startDate,
          items: {
            create: {
              name: 'Membership',
              description: `From ${startDate.toISOString()} to ${nextDate.toISOString()}`,
              amount,
              quantity: 1
            }
          }
        },
        include: {
          items: true
        }
      })

      await this.prisma.subscriptionPeriod.create({
        data: {
          subscriptionId: subscription.id,
          startsAt: startDate,
          endsAt: nextDate,
          paymentPeriodicity: subscription.paymentPeriodicity,
          amount,
          invoiceID: newInvoice.id
        }
      })

      logger('memberContext').info('Renewed subscription with id %s', subscription.id)

      return newInvoice
    } catch (error) {
      logger('memberContext').error(
        error as Error,
        'Error while renewing subscription with id %s',
        subscription.id
      )
    }

    return null
  }

  private getOffSessionPaymentProviderIDs(): string[] {
    return this.paymentProviders
      .filter(provider => provider.offSessionPayments)
      .map(provider => provider.id)
  }

  async chargeInvoice({
    user,
    invoice,
    paymentMethodID,
    customer
  }: ChargeInvoiceProps): Promise<boolean | Payment> {
    const offSessionPaymentProvidersID = this.getOffSessionPaymentProviderIDs()
    const paymentMethods = await this.prisma.paymentMethod.findMany()
    const paymentMethodIDs = paymentMethods
      .filter(method => offSessionPaymentProvidersID.includes(method.paymentProviderID))
      .map(method => method.id)

    if (!paymentMethodIDs.includes(paymentMethodID)) {
      logger('memberContext').warn(
        'PaymentMethod %s does not support off session payments',
        paymentMethodID
      )
      return false
    }

    const paymentMethod = paymentMethods.find(method => method.id === paymentMethodID)
    if (!paymentMethod) {
      logger('memberContext').error('PaymentMethod %s does not exist', paymentMethodID)
      return false
    }

    const paymentProvider = this.paymentProviders.find(
      provider => provider.id === paymentMethod.paymentProviderID
    )

    if (!paymentProvider) {
      logger('memberContext').error(
        'PaymentProvider %s does not exist',
        paymentMethod.paymentProviderID
      )
      return false
    }

    const payment = await this.prisma.payment.create({
      data: {
        paymentMethodID,
        invoiceID: invoice.id,
        state: PaymentState.created
      }
    })

    const intent = await paymentProvider.createIntent({
      paymentID: payment.id,
      invoice,
      saveCustomer: false,
      customerID: customer.customerID
    })

    const updatedPayment = await this.prisma.payment.update({
      where: {id: payment.id},
      data: {
        state: intent.state,
        intentID: intent.intentID,
        intentData: intent.intentData,
        intentSecret: intent.intentSecret,
        paymentData: intent.paymentData,
        paymentMethodID: payment.paymentMethodID,
        invoiceID: payment.invoiceID
      }
    })

    if (intent.state === PaymentState.requiresUserAction) {
      if (!invoice.subscriptionID) {
        logger('memberContext').error('Invoice %s has no associated subscriptionID', invoice.id)
        return false
      }
      const subscription = await this.prisma.subscription.findUnique({
        where: {id: invoice.subscriptionID}
      })
      if (!subscription) {
        logger('memberContext').error('No subscription found with ID %s', invoice.subscriptionID)
        return false
      }
      const remoteTemplate = await this.getSubscriptionTemplateIdentifier(
        subscription,
        SubscriptionEvent.RENEWAL_FAILED
      )
      if (remoteTemplate) {
        await this.mailContext.sendMail({
          externalMailTemplateId: remoteTemplate,
          recipient: user,
          optionalData: {
            invoice,
            paymentProviderID: paymentProvider.id,
            errorCode: intent.errorCode
          },
          mailType: mailLogType.UserFlow
        })
      } else {
        logger('memberContext').info(
          'No remote template found for subscription %s and event RENEWAL_FAILED',
          subscription.id
        )
      }

      const {items, ...invoiceData} = invoice

      await this.prisma.invoice.update({
        where: {id: invoice.id},
        data: {
          ...invoiceData,
          items: {
            deleteMany: {
              invoiceId: invoiceData.id
            },
            create: items.map(({invoiceId, ...item}) => item)
          }
        }
      })
      return updatedPayment
    }
    return updatedPayment
  }

  async cancelInvoicesForSubscription(subscriptionID: string) {
    // Cancel invoices when subscription is canceled
    const invoices = await this.prisma.invoice.findMany({
      where: {
        subscriptionID
      }
    })

    for (const invoice of invoices) {
      if (!invoice || invoice.paidAt !== null || invoice.canceledAt !== null) continue
      await this.prisma.invoice.update({
        where: {
          id: invoice.id
        },
        data: {
          canceledAt: new Date()
        }
      })
    }
  }

  async deactivateSubscriptionForUser({
    subscriptionID,
    deactivationDate,
    deactivationReason
  }: DeactivateSubscriptionForUserProps): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: {id: subscriptionID},
      include: {
        deactivation: true,
        periods: true,
        properties: true
      }
    })

    if (!subscription) {
      logger('memberContext').info('Subscription with id "%s" does not exist', subscriptionID)
      return
    }

    await this.cancelInvoicesForSubscription(subscriptionID)

    await this.prisma.subscription.update({
      where: {id: subscriptionID},
      data: {
        paymentPeriodicity: subscription.paymentPeriodicity as PaymentPeriodicity,
        deactivation: {
          upsert: {
            create: {
              date: deactivationDate ?? subscription.paidUntil ?? new Date(),
              reason: deactivationReason ?? SubscriptionDeactivationReason.none
            },
            update: {
              date: deactivationDate ?? subscription.paidUntil ?? new Date(),
              reason: deactivationReason ?? SubscriptionDeactivationReason.none
            }
          }
        }
      }
    })
  }

  /**
   * Function used to
   * @param memberPlanID
   * @param memberPlanSlug
   * @param paymentMethodID
   * @param paymentMethodSlug
   */

  async validateInputParamsCreateSubscription(
    memberPlanID: string | null,
    memberPlanSlug: string | null,
    paymentMethodID: string | null,
    paymentMethodSlug: string | null
  ) {
    if (
      (memberPlanID == null && memberPlanSlug == null) ||
      (memberPlanID != null && memberPlanSlug != null)
    ) {
      throw new UserInputError('You must provide either `memberPlanID` or `memberPlanSlug`.')
    }

    if (
      (paymentMethodID == null && paymentMethodSlug == null) ||
      (paymentMethodID != null && paymentMethodSlug != null)
    ) {
      throw new UserInputError('You must provide either `paymentMethodID` or `paymentMethodSlug`.')
    }
  }

  async getMemberPlanByIDOrSlug(
    loaders: DataLoaderContext,
    memberPlanSlug: string,
    memberPlanID: string
  ) {
    const memberPlan = memberPlanID
      ? await loaders.activeMemberPlansByID.load(memberPlanID)
      : await loaders.activeMemberPlansBySlug.load(memberPlanSlug)
    if (!memberPlan) throw new NotFound('MemberPlan', memberPlanID || memberPlanSlug)
    return memberPlan
  }

  async getPaymentMethodByIDOrSlug(
    loaders: DataLoaderContext,
    paymentMethodSlug: string,
    paymentMethodID: string
  ) {
    const paymentMethod = paymentMethodID
      ? await loaders.activePaymentMethodsByID.load(paymentMethodID)
      : await loaders.activePaymentMethodsBySlug.load(paymentMethodSlug)
    if (!paymentMethod) throw new NotFound('PaymentMethod', paymentMethodID || paymentMethodSlug)
    return paymentMethod
  }

  async validateSubscriptionPaymentConfiguration(
    memberPlan: MemberPlanWithPaymentMethods,
    autoRenew: boolean,
    paymentPeriodicity: PaymentPeriodicity,
    paymentMethod: PaymentMethod
  ) {
    if (
      !memberPlan.availablePaymentMethods.some(apm => {
        if (apm.forceAutoRenewal && !autoRenew) return false
        return (
          apm.paymentPeriodicities.includes(paymentPeriodicity) &&
          apm.paymentMethodIDs.includes(paymentMethod.id)
        )
      })
    )
      throw new PaymentConfigurationNotAllowed()
  }

  async processSubscriptionProperties(
    subscriptionProperties: Omit<MetadataProperty, 'public'>[]
  ): Promise<Pick<MetadataProperty, 'public' | 'key' | 'value'>[]> {
    return Array.isArray(subscriptionProperties)
      ? subscriptionProperties.map(property => {
          return {
            public: true,
            key: property.key,
            value: property.value
          }
        })
      : []
  }

  async createSubscription(
    subscriptionClient: PrismaClient['subscription'],
    userID: string,
    paymentMethod: PaymentMethod,
    paymentPeriodicity: PaymentPeriodicity,
    monthlyAmount: number,
    memberPlan: MemberPlan,
    properties: Pick<MetadataProperty, 'key' | 'value' | 'public'>[],
    autoRenew: boolean
  ): Promise<SubscriptionWithRelations> {
    const subscription = await subscriptionClient.create({
      data: {
        userID,
        startsAt: new Date(),
        modifiedAt: new Date(),
        paymentMethodID: paymentMethod.id,
        paymentPeriodicity,
        paidUntil: null,
        monthlyAmount,
        memberPlanID: memberPlan.id,
        properties: {
          createMany: {
            data: properties
          }
        },
        autoRenew
      },
      include: {
        deactivation: true,
        periods: true,
        properties: true
      }
    })

    if (!subscription) {
      logger('mutation.public').error('Could not create new subscription for userID "%s"', userID)
      throw new InternalError()
    }

    return subscription
  }

  async getSubscriptionTemplateIdentifier(
    subscription: Subscription,
    subscriptionEvent: SubscriptionEvent
  ): Promise<string | undefined> {
    return new SubscriptionEventDictionary(this.prisma).getSubsciptionTemplateIdentifier(
      subscription,
      subscriptionEvent
    )
  }
}
