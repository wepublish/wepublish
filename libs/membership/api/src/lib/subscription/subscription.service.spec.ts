import {
  Currency,
  Invoice,
  PaymentPeriodicity,
  PrismaClient,
  Subscription,
  SubscriptionDeactivationReason,
  SubscriptionEvent
} from '@prisma/client'
import nock from 'nock'

import {forwardRef} from '@nestjs/common'
import {Test, TestingModule} from '@nestjs/testing'
import {PrismaModule} from '@wepublish/nest-modules'
import {PaymentsService} from '@wepublish/payment/api'
import {add, sub} from 'date-fns'
import {PeriodicJobService} from '../periodic-job/periodic-job.service'
import {Action} from '../subscription-event-dictionary/subscription-event-dictionary.type'
import {SubscriptionFlowService} from '../subscription-flow/subscription-flow.service'
import {registerMailsModule, registerPaymentsModule} from '../testing/module-registrars'
import {SubscriptionService} from './subscription.service'

describe('SubscriptionPaymentsService', () => {
  let subscriptionService: SubscriptionService
  let prismaMock: {
    subscription: {[method in keyof PrismaClient['subscription']]?: jest.Mock}
    invoice: {[method in keyof PrismaClient['invoice']]?: jest.Mock}
    subscriptionPeriod: {[method in keyof PrismaClient['subscriptionPeriod']]?: jest.Mock}
    payment: {[method in keyof PrismaClient['payment']]?: jest.Mock}
    subscriptionDeactivation: {
      [method in keyof PrismaClient['subscriptionDeactivation']]?: jest.Mock
    }
  }

  const mockMemberPlan = {
    id: 'plan-1',
    name: 'memberplan',
    slug: 'memberplan',
    description: 'Test Plan',
    active: true,
    amountPerMonthMin: 100,
    currency: Currency.CHF,
    createdAt: new Date(),
    modifiedAt: new Date()
  }

  const mockPaymentMethod = {
    id: 'payment-1',
    name: 'Test Payment',
    slug: 'test-payment',
    description: 'Test Payment Method',
    paymentProviderID: 'stripe',
    active: true,
    createdAt: new Date(),
    modifiedAt: new Date()
  }

  const mockUser = {
    id: 'user-1',
    email: 'test@wepublish.com',
    name: 'user',
    password: 'xxx',
    active: true,
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    modifiedAt: new Date(),
    roleIDs: [],
    properties: [],
    birthday: null,
    flair: null,
    userImageID: null,
    firstName: null,
    lastLogin: null
  }

  beforeEach(async () => {
    await nock.disableNetConnect()

    prismaMock = {
      subscription: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn()
      },
      invoice: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      subscriptionPeriod: {
        create: jest.fn()
      },
      payment: {
        findMany: jest.fn(),
        create: jest.fn()
      },
      subscriptionDeactivation: {
        create: jest.fn()
      }
    } as any
    ;(prismaMock as any).$transaction = jest.fn().mockImplementation(async (operations: any) => {
      return await Promise.all(operations)
    })

    const module: TestingModule = await Test.createTestingModule({
      imports: [registerMailsModule(), registerPaymentsModule()],
      providers: [
        SubscriptionFlowService,
        PeriodicJobService,
        SubscriptionService,
        {
          provide: PrismaClient,
          useValue: prismaMock
        }
      ]
    }).compile()

    const paymentsService = module.get<PaymentsService>(PaymentsService)
    subscriptionService = new SubscriptionService(prismaMock as any, paymentsService)
  })

  afterEach(async () => {
    await nock.cleanAll()
    await nock.enableNetConnect()
  })

  it('get subscriptions for invoice creation', async () => {
    const mockSubscriptions = [
      {
        id: 'sub-1',
        paidUntil: add(new Date(), {days: 1}),
        autoRenew: true,
        deactivation: null,
        currency: Currency.CHF,
        periods: [
          {
            startsAt: add(new Date(), {days: 1}),
            endsAt: add(new Date(), {years: 1}),
            paymentPeriodicity: PaymentPeriodicity.yearly,
            amount: 22
          }
        ]
      }
    ]

    prismaMock.subscription.findMany!.mockResolvedValue(mockSubscriptions)

    let subscriptionsToExtend = await subscriptionService.getActiveSubscriptionsWithoutInvoice(
      new Date(),
      add(new Date(), {days: 200})
    )
    expect(subscriptionsToExtend.length).toEqual(1)
    expect(prismaMock.subscription.findMany).toHaveBeenCalled()
  })

  it('invoices to charge', async () => {
    const mockInvoices = [
      {
        id: 'invoice-1',
        dueAt: sub(new Date(), {days: 1}),
        paidAt: null,
        canceledAt: null,
        subscription: {
          confirmed: true
        }
      },
      {
        id: 'invoice-2',
        dueAt: add(new Date(), {seconds: 10}),
        paidAt: null,
        canceledAt: null,
        subscription: {
          confirmed: true
        }
      }
    ]

    prismaMock.invoice.findMany!.mockResolvedValue(mockInvoices)

    let invoicesToCharge = await subscriptionService.findUnpaidDueInvoices(new Date())
    expect(invoicesToCharge.length).toEqual(2)
    expect(prismaMock.invoice.findMany).toHaveBeenCalled()
  })

  it('skips unconfirmed invoices', async () => {
    const mockInvoices = [
      {
        id: 'invoice-1',
        dueAt: sub(new Date(), {days: 1}),
        paidAt: null,
        canceledAt: null,
        subscription: {
          confirmed: true
        }
      },
      {
        id: 'invoice-2',
        dueAt: sub(new Date(), {days: 1}),
        paidAt: null,
        canceledAt: null,
        subscription: {
          confirmed: false
        }
      }
    ]

    prismaMock.invoice.findMany!.mockResolvedValue(
      mockInvoices.filter(inv => inv.subscription.confirmed)
    )

    let invoicesToCharge = await subscriptionService.findUnpaidDueInvoices(new Date())
    expect(invoicesToCharge.length).toEqual(1)
    expect(prismaMock.invoice.findMany).toHaveBeenCalled()
  })

  it('skips invoices without subscription', async () => {
    const mockInvoices = [
      {
        id: 'invoice-1',
        dueAt: sub(new Date(), {days: 1}),
        paidAt: null,
        canceledAt: null,
        subscriptionID: 'sub-1',
        subscription: {
          confirmed: true
        }
      }
    ]

    prismaMock.invoice.findMany!.mockResolvedValue(mockInvoices)

    let invoicesToCharge = await subscriptionService.findUnpaidDueInvoices(new Date())
    expect(invoicesToCharge.length).toEqual(1)
    expect(invoicesToCharge[0].id).toEqual('invoice-1')
    expect(prismaMock.invoice.findMany).toHaveBeenCalled()
  })

  it('invoices of subscriptions to deactivate', async () => {
    const mockInvoices = [
      {
        id: 'invoice-1',
        scheduledDeactivationAt: sub(new Date(), {days: 1}),
        paidAt: null,
        canceledAt: null
      }
    ]

    prismaMock.invoice.findMany!.mockResolvedValue(mockInvoices)

    let invoicesToDeactivate = await subscriptionService.findUnpaidScheduledForDeactivationInvoices(
      new Date()
    )
    expect(invoicesToDeactivate.length).toEqual(1)
    expect(prismaMock.invoice.findMany).toHaveBeenCalled()
  })

  it('invoice creation yearly', async () => {
    const paidUntil = add(new Date(), {days: 14})
    const deactivationDate = add(paidUntil, {days: 10})

    const mockSubscription = {
      id: 'sub-1',
      monthlyAmount: 10,
      paymentPeriodicity: PaymentPeriodicity.yearly,
      paidUntil,
      startsAt: sub(paidUntil, {years: 3, days: -1}),
      periods: [],
      memberPlan: mockMemberPlan,
      user: mockUser
    }

    const mockInvoice = {
      id: 'invoice-1',
      dueAt: paidUntil,
      scheduledDeactivationAt: deactivationDate
    }

    const mockPeriod = {
      id: 'period-1',
      startsAt: add(paidUntil, {days: 1}),
      endsAt: add(paidUntil, {years: 1}),
      amount: 120,
      paymentPeriodicity: PaymentPeriodicity.yearly
    }

    prismaMock.invoice.create!.mockResolvedValue(mockInvoice)
    prismaMock.subscriptionPeriod.create!.mockResolvedValue(mockPeriod)

    await subscriptionService.createInvoice(mockSubscription as any, deactivationDate)

    expect(prismaMock.invoice.create).toHaveBeenCalled()
    expect(prismaMock.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subscriptionPeriods: expect.objectContaining({
            create: expect.any(Object)
          })
        })
      })
    )
  })

  it('mark Invoice as paid (renewal)', async () => {
    const paidUntil = add(new Date(), {days: 5})
    const mockSubscription = {
      id: 'sub-1',
      paidUntil,
      createdAt: sub(new Date(), {years: 1, days: 4}),
      paymentPeriodicity: PaymentPeriodicity.yearly
    }

    const mockInvoice = {
      id: 'invoice-1',
      paidAt: null,
      subscriptionID: 'sub-1',
      subscription: mockSubscription
    }

    const updatedInvoice = {
      ...mockInvoice,
      paidAt: new Date(),
      subscription: {
        ...mockSubscription,
        paidUntil: add(paidUntil, {years: 1})
      }
    }

    prismaMock.invoice.findUnique!.mockResolvedValue(updatedInvoice)
    prismaMock.subscription.update!.mockResolvedValue(updatedInvoice.subscription)

    await subscriptionService.markInvoiceAsPaid(mockInvoice as any)

    expect(prismaMock.subscription.update).toHaveBeenCalled()
  })

  it('deactivate subscription', async () => {
    const mockSubscription = {
      id: 'sub-1',
      deactivation: null
    }

    const mockInvoice = {
      id: 'invoice-1',
      canceledAt: null,
      subscriptionID: 'sub-1',
      subscription: mockSubscription
    }

    const mockDeactivation = {
      id: 'deact-1',
      reason: SubscriptionDeactivationReason.invoiceNotPaid,
      date: new Date()
    }

    prismaMock.subscriptionDeactivation.create!.mockResolvedValue(mockDeactivation)

    await subscriptionService.deactivateSubscription(mockInvoice as any)

    expect(prismaMock.subscriptionDeactivation.create).toHaveBeenCalled()
  })

  it('Charge invoice: Payment invalid payment provider', async () => {
    const mockInvoice = {
      id: 'invoice-1',
      subscription: {
        paymentMethod: {
          paymentProviderID: 'invalid'
        }
      }
    }

    const actions: Action[] = []

    try {
      await subscriptionService.chargeInvoice(mockInvoice as any, actions)
      throw Error('This execution should fail!')
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        'NotFoundException: Payment Provider invalid not found!'
      )
    }
  })

  it('Charge invoice: No offsession payment provider', async () => {
    const mockInvoice = {
      id: 'invoice-1',
      subscription: {
        paymentMethod: {
          paymentProviderID: 'payrexx'
        }
      }
    }

    const actions: Action[] = []

    const answer = await subscriptionService.chargeInvoice(mockInvoice as any, actions)
    expect(answer.action).toBeUndefined()
    expect(answer.errorCode).toEqual('')
  })

  it('Get period start and and if no previous period exist', async () => {
    const res = await subscriptionService['getNextPeriod']([], PaymentPeriodicity.monthly)
    expect(res.startsAt.getTime()).toBeGreaterThanOrEqual(
      add(new Date(), {minutes: -2, days: 1}).getTime()
    )
    expect(res.startsAt.getTime()).toBeLessThanOrEqual(add(new Date(), {days: 1}).getTime())
    expect(res.endsAt.getTime()).toBeGreaterThanOrEqual(
      add(new Date(), {minutes: -2, months: 1}).getTime()
    )
    expect(res.endsAt.getTime()).toBeLessThanOrEqual(add(new Date(), {months: 1}).getTime())
  })

  it('Offsession payment with canceled or already paid invoice', async () => {
    const date = new Date()
    try {
      await subscriptionService['offSessionPayment'](
        {canceledAt: date, paidAt: null} as any,
        {} as any,
        {} as any
      )
      throw Error('This execution should fail!')
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        `BadRequestException: Can not renew canceled invoice for subscription undefined`
      )
    }
    try {
      await subscriptionService['offSessionPayment'](
        {canceledAt: null, paidAt: date} as any,
        {} as any,
        {} as any
      )
      throw Error('This execution should fail!')
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        `BadRequestException: Can not renew paid invoice for subscription undefined`
      )
    }
  })

  it('Offsession payment invoice without subscription', async () => {
    try {
      const event: Action = {
        type: SubscriptionEvent.RENEWAL_SUCCESS,
        daysAwayFromEnding: 1,
        externalMailTemplate: null
      }
      await subscriptionService['offSessionPayment'](
        {canceledAt: null, paidAt: null} as any,
        {} as any,
        [event]
      )
      throw Error('This execution should fail!')
    } catch (e) {
      expect((e as Error).toString()).toEqual('NotFoundException: Subscription not found!')
    }
  })
})
