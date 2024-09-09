import {
  Invoice,
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
import {mailLogType} from '@wepublish/mail/api'
import {unselectPassword} from '@wepublish/user/api'
import {DataLoaderContext} from './context'
import {InvoiceWithItems} from '@wepublish/payment/api'
import {MemberPlanWithPaymentMethods} from './db/memberPlan'
import {SubscriptionWithRelations} from './db/subscription'
import {InternalError, NotFound, PaymentConfigurationNotAllowed, UserInputError} from './error'
import {MailContext} from '@wepublish/mail/api'
import {PaymentProvider} from '@wepublish/payment/api'
import {logger} from '@wepublish/utils/api'
import {ONE_DAY_IN_MILLISECONDS, ONE_MONTH_IN_MILLISECONDS} from './utility'
import {SubscriptionEventDictionary, Action, LookupActionInput} from '@wepublish/membership/api'
import {add} from 'date-fns'

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
  subscription: Subscription
  deactivationReason?: SubscriptionDeactivationReason
}

export interface MemberContextInterface {
  prisma: PrismaClient
  loaders: DataLoaderContext
  paymentProviders: PaymentProvider[]

  mailContext: MailContext

  getLoginUrlForUser(user: User): string

  handleSubscriptionChange(props: HandleSubscriptionChangeProps): Promise<Subscription>

  renewSubscriptionForUser(props: RenewSubscriptionForUserProps): Promise<Invoice | null>

  chargeInvoice(props: ChargeInvoiceProps): Promise<boolean | Payment>

  deactivateSubscription(props: DeactivateSubscriptionForUserProps): Promise<Subscription>
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

export class MemberContext implements MemberContextInterface {
  loaders: DataLoaderContext
  paymentProviders: PaymentProvider[]
  prisma: PrismaClient

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

        // only return the invoice if it hasn't been canceled. Otherwise,
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

      const subscriptionFlows = await this.getActionsForSubscriptions({
        memberplanId: subscription.memberPlanID,
        paymentMethodId: subscription.paymentMethodID,
        periodicity: subscription.paymentPeriodicity,
        autorenwal: subscription.autoRenew,
        events: [SubscriptionEvent.DEACTIVATION_UNPAID]
      })
      const subscriptionFlowActionDeactivationUnpaid = subscriptionFlows.find(
        a => a.type === SubscriptionEvent.DEACTIVATION_UNPAID
      )

      if (!subscriptionFlowActionDeactivationUnpaid) {
        logger('memberContext').info(
          'Subscription flow for subscription with id "%s" not found',
          subscription.id
        )
        return null
      }
      const deactivationDate = add(subscription.paidUntil || new Date(), {
        days: subscriptionFlowActionDeactivationUnpaid.daysAwayFromEnding
      })

      const newInvoice = await this.prisma.invoice.create({
        data: {
          subscriptionID: subscription.id,
          description: `Membership from ${startDate.toISOString()} for ${user.name || user.email}`,
          mail: user.email,
          dueAt: startDate,
          scheduledDeactivationAt: deactivationDate,
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

      logger('memberContext').info(
        'Renewed or created fresh subscription with id %s',
        subscription.id
      )

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

  async deactivateSubscription({
    subscription,
    deactivationReason
  }: DeactivateSubscriptionForUserProps): Promise<Subscription> {
    // deactivate remote subscriptions
    await this.cancelRemoteSubscription({
      subscriptionId: subscription.id,
      reason: deactivationReason
    })

    const now = new Date()
    const deactivationDate =
      subscription.paidUntil !== null && subscription.paidUntil > now ? subscription.paidUntil : now

    await this.cancelInvoicesForSubscription(subscription.id)

    const updatedSubscription: Subscription = await this.prisma.subscription.update({
      where: {id: subscription.id},
      data: {
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
      },
      include: {
        deactivation: true,
        properties: true
      }
    })

    // Send deactivation Mail
    await this.sendSubscriptionDeactivationMail(subscription, deactivationReason)
    return updatedSubscription
  }

  async cancelRemoteSubscription({
    subscriptionId,
    reason
  }: {
    subscriptionId: string
    reason: SubscriptionDeactivationReason
  }) {
    const subscription = await this.prisma.subscription.findUnique({
      where: {id: subscriptionId},
      include: {
        properties: true
      }
    })
    const {paymentProviderID} = await this.getPaymentMethodByIDOrSlug(
      this.loaders,
      undefined,
      subscription.paymentMethodID
    )
    const paymentProvider = this.paymentProviders.find(
      paymentProvider => paymentProvider.id === paymentProviderID
    )
    await paymentProvider.cancelRemoteSubscription({
      subscription
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
    prisma: PrismaClient,
    userID: string,
    paymentMethodId: string,
    paymentPeriodicity: PaymentPeriodicity,
    monthlyAmount: number,
    memberPlanId: string,
    properties: Pick<MetadataProperty, 'key' | 'value' | 'public'>[],
    autoRenew: boolean,
    extendable: boolean,
    startsAt: Date | string = new Date(),
    paidUntil?: Date | string
  ): Promise<{subscription: SubscriptionWithRelations; invoice: InvoiceWithItems}> {
    if (!extendable && autoRenew) {
      throw new Error("You can't create a non extendable subscription that is autoRenew!")
    }

    startsAt = new Date(startsAt)
    paidUntil = paidUntil ? new Date(paidUntil) : undefined

    const memberPlan = await prisma.memberPlan.findUnique({where: {id: memberPlanId}})
    const memberPlanSubscriptionCount = await prisma.subscription.count({
      where: {
        userID,
        memberPlanID: memberPlanId
      }
    })

    if (memberPlan.maxCount && memberPlan.maxCount <= memberPlanSubscriptionCount) {
      throw new Error(
        `Subscription count exceeded limit (given: ${memberPlanSubscriptionCount + 1} | max: ${
          memberPlan.maxCount
        }) for ${memberPlanId} memberplan!`
      )
    }

    const now = new Date()

    const subscription = await prisma.subscription.create({
      data: {
        userID,
        startsAt,
        modifiedAt: new Date(),
        paymentMethodID: paymentMethodId,
        paymentPeriodicity,
        paidUntil,
        monthlyAmount,
        memberPlanID: memberPlanId,
        properties: {
          createMany: {
            data: properties
          }
        },
        autoRenew,
        extendable
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

    if (startsAt < now || paidUntil) {
      const endsAt = paidUntil ?? getNextDateForPeriodicity(startsAt, paymentPeriodicity)

      const user = await this.prisma.user.findUnique({
        where: {
          id: subscription.userID
        },
        select: unselectPassword
      })
      const invoice = await this.prisma.invoice.create({
        data: {
          subscriptionID: subscription.id,
          description: `Membership from ${startsAt.toISOString()} for ${user.name || user.email}`,
          mail: user.email,
          dueAt: startsAt,
          scheduledDeactivationAt: endsAt,
          items: {
            create: {
              name: 'Membership',
              description: `From ${startsAt.toISOString()} to ${endsAt.toISOString()}`,
              amount: monthlyAmount,
              quantity: 1
            }
          },
          ...(paidUntil && {paidAt: startsAt})
        },
        include: {
          items: true
        }
      })

      await prisma.subscription.update({
        where: {id: subscription.id},
        data: {
          periods: {
            create: {
              startsAt,
              amount: monthlyAmount,
              endsAt,
              paymentPeriodicity,
              invoiceID: invoice.id
            }
          }
        }
      })
      return {
        subscription,
        invoice
      }
    } else {
      const invoice = await this.renewSubscriptionForUser({subscription})

      // Send subscribe mail
      await this.sendMailForSubscriptionEvent(SubscriptionEvent.SUBSCRIBE, subscription, {})

      return {
        subscription,
        invoice
      }
    }
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

  async getActionsForSubscriptions(query: LookupActionInput): Promise<Action[]> {
    return new SubscriptionEventDictionary(this.prisma).getActionsForSubscriptions(query)
  }

  async sendSubscriptionDeactivationMail(
    subscription: Subscription,
    deactivation: SubscriptionDeactivationReason
  ) {
    let event: SubscriptionEvent = SubscriptionEvent.DEACTIVATION_BY_USER
    if (deactivation === SubscriptionDeactivationReason.invoiceNotPaid) {
      event = SubscriptionEvent.DEACTIVATION_UNPAID
    }
    return this.sendMailForSubscriptionEvent(event, subscription, {})
  }

  async sendMailForSubscriptionEvent(
    subscriptionEvent: SubscriptionEvent,
    subscription: Subscription,
    optionalData: Record<string, any>
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: subscription.userID
      },
      select: unselectPassword
    })
    if (!user) {
      logger('MemberContext').warn(`User not found %s`, subscription.userID)
      return
    }

    const remoteTemplate = await this.getSubscriptionTemplateIdentifier(
      subscription,
      subscriptionEvent
    )

    if (!remoteTemplate) {
      logger('MemberContext').warn(
        `RemoteTemplate <%s> for subscription <%s> not found!`,
        subscriptionEvent,
        subscription.id
      )
      return
    }

    await this.mailContext.sendMail({
      externalMailTemplateId: remoteTemplate,
      recipient: user,
      optionalData: {
        subscription,
        ...optionalData
      },
      mailType: mailLogType.UserFlow
    })
  }
}
