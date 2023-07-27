import {clearDatabase, clearFullDatabase} from '../../prisma-utils'
import {
  MemberPlan,
  PaymentPeriodicity,
  PrismaClient,
  SubscriptionEvent,
  SubscriptionFlow,
  SubscriptionInterval
} from '@prisma/client'
import {
  initialize,
  defineMemberPlanFactory,
  defineSubscriptionFlowFactory,
  definePaymentMethodFactory,
  defineSubscriptionIntervalFactory
} from '../../__generated__/fabbrica'
import {add, format, sub} from 'date-fns'
import {SubscriptionEventDictionary} from './subscription-event-dictionary'
import nock from 'nock'

type SubscriptionFlowInterval = {
  subscriptionFlowId: string
  mailTemplateName: string
  event: SubscriptionEvent
  daysAwayFromEnding: null | number
}

describe('SubscriptionEventDictionary', () => {
  const prismaClient = new PrismaClient()
  initialize({prisma: prismaClient})

  const MemberPlanFactory = defineMemberPlanFactory()
  const PaymentMethodFactory = definePaymentMethodFactory()
  const SubscriptionFlowFactory = defineSubscriptionFlowFactory({
    defaultData: {
      memberPlan: MemberPlanFactory,
      intervals: {connect: []}
    } as any
  })
  const SubscriptionIntervalFactory = defineSubscriptionIntervalFactory({
    defaultData: {
      subscriptionFlow: SubscriptionFlowFactory
    }
  })
  const createSubscriptionInterval = async function (sfi: SubscriptionFlowInterval) {
    return await SubscriptionIntervalFactory.create({
      subscriptionFlow: {
        connect: {
          id: sfi.subscriptionFlowId
        }
      },
      event: sfi.event,
      daysAwayFromEnding: sfi.daysAwayFromEnding,
      mailTemplate: {
        create: {
          externalMailTemplateId: sfi.mailTemplateName,
          name: sfi.mailTemplateName
        }
      }
    })
  }
  let customMemberPlan1: MemberPlan
  let customMemberPlan2: MemberPlan
  let customMemberPlanFlow1: SubscriptionFlow
  let customMemberPlanFlow2: SubscriptionFlow
  let defaultFlow: SubscriptionFlow

  beforeAll(async () => {
    await clearFullDatabase(prismaClient)
  })

  beforeEach(async () => {
    await nock.disableNetConnect()

    await clearDatabase(prismaClient, [
      'subscription_communication_flows',
      'payment.methods',
      'member.plans',
      'subscriptions.intervals',
      'mail_templates'
    ])

    // Base data
    await PaymentMethodFactory.create({
      id: 'payrexx',
      name: 'payrexx',
      paymentProviderID: 'payrexx',
      slug: 'payrexx',
      active: true
    })
    await PaymentMethodFactory.create({
      id: 'payrexx-subscription',
      name: 'payrexx-subscription',
      paymentProviderID: 'payrexx-subscription',
      slug: 'payrexx-subscription',
      active: true
    })

    await PaymentMethodFactory.create({
      id: 'stripe',
      name: 'stripe',
      paymentProviderID: 'stripe',
      slug: 'stripe',
      active: true
    })

    await MemberPlanFactory.create({
      name: 'yearly',
      slug: 'yearly'
    })

    defaultFlow = await SubscriptionFlowFactory.create({
      default: true,
      memberPlan: undefined,
      autoRenewal: [],
      periodicities: [],
      paymentMethods: {}
    })

    customMemberPlan1 = await MemberPlanFactory.create({
      name: 'custom1',
      slug: 'custom1'
    })
    customMemberPlan2 = await MemberPlanFactory.create({
      name: 'custom2',
      slug: 'custom2'
    })

    customMemberPlanFlow1 = await SubscriptionFlowFactory.create({
      default: false,
      memberPlan: {
        connect: {
          id: customMemberPlan1.id
        }
      },
      autoRenewal: [true, false],
      periodicities: [PaymentPeriodicity.yearly],
      paymentMethods: {
        connect: {
          id: 'stripe'
        }
      }
    })
    customMemberPlanFlow2 = await SubscriptionFlowFactory.create({
      default: false,
      memberPlan: {
        connect: {
          id: customMemberPlan1.id
        }
      },
      autoRenewal: [true, false],
      periodicities: [PaymentPeriodicity.monthly],
      paymentMethods: {
        connect: {
          id: 'stripe'
        }
      }
    })
    await prismaClient.subscriptionFlow.update({
      where: {
        id: customMemberPlanFlow2.id
      },
      data: {
        paymentMethods: {
          connect: {
            id: 'payrexx'
          }
        }
      }
    })

    const subscriptionFLowIntervals: SubscriptionFlowInterval[] = [
      // Default SubscriptionFlow
      {
        subscriptionFlowId: defaultFlow.id,
        mailTemplateName: 'default-SUBSCRIBE',
        event: SubscriptionEvent.SUBSCRIBE,
        daysAwayFromEnding: null
      },
      {
        subscriptionFlowId: defaultFlow.id,
        mailTemplateName: 'default-RENEWAL_SUCCESS',
        event: SubscriptionEvent.RENEWAL_SUCCESS,
        daysAwayFromEnding: null
      },
      {
        subscriptionFlowId: defaultFlow.id,
        mailTemplateName: 'default-RENEWAL_FAILED',
        event: SubscriptionEvent.RENEWAL_FAILED,
        daysAwayFromEnding: null
      },
      {
        subscriptionFlowId: defaultFlow.id,
        mailTemplateName: 'default-INVOICE_CREATION',
        event: SubscriptionEvent.INVOICE_CREATION,
        daysAwayFromEnding: -14
      },
      {
        subscriptionFlowId: defaultFlow.id,
        mailTemplateName: 'default-DEACTIVATION_UNPAID',
        event: SubscriptionEvent.DEACTIVATION_UNPAID,
        daysAwayFromEnding: 5
      },
      {
        subscriptionFlowId: defaultFlow.id,
        mailTemplateName: 'default-DEACTIVATION_BY_USER',
        event: SubscriptionEvent.DEACTIVATION_BY_USER,
        daysAwayFromEnding: null
      },
      {
        subscriptionFlowId: defaultFlow.id,
        mailTemplateName: 'default-CUSTOM1',
        event: SubscriptionEvent.CUSTOM,
        daysAwayFromEnding: -15
      }
    ]
    for (const sfi of subscriptionFLowIntervals) {
      await createSubscriptionInterval(sfi)
    }
  })

  afterEach(async () => {
    await nock.cleanAll()
    await nock.enableNetConnect()
    await prismaClient.$disconnect()
  })

  it('get action from store custom and default flow basic', async () => {
    const subscriptionFLowIntervals: SubscriptionFlowInterval[] = [
      // Custom1 SubscriptionFlow
      {
        subscriptionFlowId: customMemberPlanFlow1.id,
        mailTemplateName: 'custom1-SUBSCRIBE',
        event: SubscriptionEvent.SUBSCRIBE,
        daysAwayFromEnding: null
      },
      {
        subscriptionFlowId: customMemberPlanFlow1.id,
        mailTemplateName: 'custom1-RENEWAL_SUCCESS',
        event: SubscriptionEvent.RENEWAL_SUCCESS,
        daysAwayFromEnding: null
      },
      {
        subscriptionFlowId: customMemberPlanFlow1.id,
        mailTemplateName: 'custom1-RENEWAL_FAILED',
        event: SubscriptionEvent.RENEWAL_FAILED,
        daysAwayFromEnding: null
      },
      {
        subscriptionFlowId: customMemberPlanFlow1.id,
        mailTemplateName: 'custom1-INVOICE_CREATION',
        event: SubscriptionEvent.INVOICE_CREATION,
        daysAwayFromEnding: -7
      },
      {
        subscriptionFlowId: customMemberPlanFlow1.id,
        mailTemplateName: 'custom1-DEACTIVATION_UNPAID',
        event: SubscriptionEvent.DEACTIVATION_UNPAID,
        daysAwayFromEnding: 7
      },
      {
        subscriptionFlowId: customMemberPlanFlow1.id,
        mailTemplateName: 'custom1-DEACTIVATION_BY_USER',
        event: SubscriptionEvent.DEACTIVATION_BY_USER,
        daysAwayFromEnding: null
      },
      {
        subscriptionFlowId: customMemberPlanFlow1.id,
        mailTemplateName: 'custom1-CUSTOM1',
        event: SubscriptionEvent.CUSTOM,
        daysAwayFromEnding: -10
      },
      {
        subscriptionFlowId: customMemberPlanFlow1.id,
        mailTemplateName: 'custom1-CUSTOM2',
        event: SubscriptionEvent.CUSTOM,
        daysAwayFromEnding: -7
      },
      // Custom2 SubscriptionFlow
      {
        subscriptionFlowId: customMemberPlanFlow2.id,
        mailTemplateName: 'custom2-SUBSCRIBE',
        event: SubscriptionEvent.SUBSCRIBE,
        daysAwayFromEnding: null
      },
      {
        subscriptionFlowId: customMemberPlanFlow2.id,
        mailTemplateName: 'custom2-RENEWAL_SUCCESS',
        event: SubscriptionEvent.RENEWAL_SUCCESS,
        daysAwayFromEnding: null
      },
      {
        subscriptionFlowId: customMemberPlanFlow2.id,
        mailTemplateName: 'custom2-RENEWAL_FAILED',
        event: SubscriptionEvent.RENEWAL_FAILED,
        daysAwayFromEnding: null
      },
      {
        subscriptionFlowId: customMemberPlanFlow2.id,
        mailTemplateName: 'custom2-INVOICE_CREATION',
        event: SubscriptionEvent.INVOICE_CREATION,
        daysAwayFromEnding: -3
      },
      {
        subscriptionFlowId: customMemberPlanFlow2.id,
        mailTemplateName: 'custom2-DEACTIVATION_UNPAID',
        event: SubscriptionEvent.DEACTIVATION_UNPAID,
        daysAwayFromEnding: 4
      },
      {
        subscriptionFlowId: customMemberPlanFlow2.id,
        mailTemplateName: 'custom2-DEACTIVATION_BY_USER',
        event: SubscriptionEvent.DEACTIVATION_BY_USER,
        daysAwayFromEnding: null
      },
      {
        subscriptionFlowId: customMemberPlanFlow2.id,
        mailTemplateName: 'custom2-CUSTOM1',
        event: SubscriptionEvent.CUSTOM,
        daysAwayFromEnding: 9
      }
    ]
    for (const sfi of subscriptionFLowIntervals) {
      await createSubscriptionInterval(sfi)
    }

    const sed = new SubscriptionEventDictionary(prismaClient)

    // Test custom static Actions
    let actions = await sed.getActionsForSubscriptions({
      memberplanId: customMemberPlan1.id,
      periodicity: PaymentPeriodicity.yearly,
      paymentMethodId: 'stripe',
      autorenwal: true
    })
    let res =
      '[{"type":"SUBSCRIBE","daysAwayFromEnding":null,"externalMailTemplate":"custom1-SUBSCRIBE"},{"type":"RENEWAL_SUCCESS","daysAwayFromEnding":null,"externalMailTemplate":"custom1-RENEWAL_SUCCESS"},{"type":"RENEWAL_FAILED","daysAwayFromEnding":null,"externalMailTemplate":"custom1-RENEWAL_FAILED"},{"type":"DEACTIVATION_BY_USER","daysAwayFromEnding":null,"externalMailTemplate":"custom1-DEACTIVATION_BY_USER"},{"type":"REACTIVATION","daysAwayFromEnding":null,"externalMailTemplate":"custom1-REACTIVATION"}]'
    expect(JSON.stringify(actions)).toEqual(res)

    // Test custom variable actions
    actions = await sed.getActionsForSubscriptions({
      memberplanId: customMemberPlan1.id,
      periodicity: PaymentPeriodicity.yearly,
      paymentMethodId: 'stripe',
      autorenwal: true,
      daysAwayFromEnding: -7
    })
    res =
      '[{"type":"INVOICE_CREATION","daysAwayFromEnding":-7,"externalMailTemplate":"custom1-INVOICE_CREATION"},{"type":"CUSTOM","daysAwayFromEnding":-7,"externalMailTemplate":"custom1-CUSTOM2"}]'
    expect(JSON.stringify(actions)).toEqual(res)

    actions = await sed.getActionsForSubscriptions({
      memberplanId: customMemberPlan1.id,
      periodicity: PaymentPeriodicity.yearly,
      paymentMethodId: 'stripe',
      autorenwal: true,
      daysAwayFromEnding: -10
    })
    res = '[{"type":"CUSTOM","daysAwayFromEnding":-10,"externalMailTemplate":"custom1-CUSTOM1"}]'
    expect(JSON.stringify(actions)).toEqual(res)

    actions = await sed.getActionsForSubscriptions({
      memberplanId: customMemberPlan1.id,
      periodicity: PaymentPeriodicity.yearly,
      paymentMethodId: 'stripe',
      autorenwal: true,
      daysAwayFromEnding: 7
    })
    res =
      '[{"type":"DEACTIVATION_UNPAID","daysAwayFromEnding":7,"externalMailTemplate":"custom1-DEACTIVATION_UNPAID"}]'
    expect(JSON.stringify(actions)).toEqual(res)

    actions = await sed.getActionsForSubscriptions({
      memberplanId: customMemberPlan1.id,
      periodicity: PaymentPeriodicity.yearly,
      paymentMethodId: 'stripe',
      autorenwal: true,
      daysAwayFromEnding: 9
    })
    res = '[]'
    expect(JSON.stringify(actions)).toEqual(res)

    actions = await sed.getActionsForSubscriptions({
      memberplanId: customMemberPlan1.id,
      periodicity: PaymentPeriodicity.monthly,
      paymentMethodId: 'payrexx',
      autorenwal: false,
      daysAwayFromEnding: 9
    })
    res = '[{"type":"CUSTOM","daysAwayFromEnding":9,"externalMailTemplate":"custom2-CUSTOM1"}]'
    expect(JSON.stringify(actions)).toEqual(res)

    // Test default static Actions

    actions = await sed.getActionsForSubscriptions({
      memberplanId: customMemberPlan1.id,
      periodicity: PaymentPeriodicity.biannual,
      paymentMethodId: 'payrexx',
      autorenwal: false
    })
    res =
      '[{"type":"SUBSCRIBE","daysAwayFromEnding":null,"externalMailTemplate":"default-SUBSCRIBE"},{"type":"RENEWAL_SUCCESS","daysAwayFromEnding":null,"externalMailTemplate":"default-RENEWAL_SUCCESS"},{"type":"RENEWAL_FAILED","daysAwayFromEnding":null,"externalMailTemplate":"default-RENEWAL_FAILED"},{"type":"DEACTIVATION_BY_USER","daysAwayFromEnding":null,"externalMailTemplate":"default-DEACTIVATION_BY_USER"},{"type":"REACTIVATION","daysAwayFromEnding":null,"externalMailTemplate":"default-REACTIVATION"}]'
    expect(JSON.stringify(actions)).toEqual(res)

    // Test custom variable actions

    actions = await sed.getActionsForSubscriptions({
      memberplanId: customMemberPlan1.id,
      periodicity: PaymentPeriodicity.biannual,
      paymentMethodId: 'payrexx',
      autorenwal: false,
      daysAwayFromEnding: -15
    })
    res = '[{"type":"CUSTOM","daysAwayFromEnding":-15,"externalMailTemplate":"default-CUSTOM1"}]'
    expect(JSON.stringify(actions)).toEqual(res)

    actions = await sed.getActionsForSubscriptions({
      memberplanId: customMemberPlan1.id,
      periodicity: PaymentPeriodicity.biannual,
      paymentMethodId: 'payrexx',
      autorenwal: false,
      daysAwayFromEnding: -14
    })
    res =
      '[{"type":"INVOICE_CREATION","daysAwayFromEnding":-14,"externalMailTemplate":"default-INVOICE_CREATION"}]'
    expect(JSON.stringify(actions)).toEqual(res)

    actions = await sed.getActionsForSubscriptions({
      memberplanId: customMemberPlan1.id,
      periodicity: PaymentPeriodicity.biannual,
      paymentMethodId: 'payrexx',
      autorenwal: false,
      daysAwayFromEnding: 5
    })
    res =
      '[{"type":"DEACTIVATION_UNPAID","daysAwayFromEnding":5,"externalMailTemplate":"default-DEACTIVATION_UNPAID"}]'
    expect(JSON.stringify(actions)).toEqual(res)

    actions = await sed.getActionsForSubscriptions({
      memberplanId: customMemberPlan1.id,
      periodicity: PaymentPeriodicity.biannual,
      paymentMethodId: 'payrexx',
      autorenwal: false,
      daysAwayFromEnding: 9
    })
    res = '[]'
    expect(JSON.stringify(actions)).toEqual(res)

    try {
      await sed.getActionsForSubscriptions({
        memberplanId: customMemberPlan1.id,
        periodicity: PaymentPeriodicity.biannual,
        paymentMethodId: 'payrexx',
        autorenwal: false,
        daysAwayFromEnding: 10,
        events: [SubscriptionEvent.INVOICE_CREATION]
      })
      throw Error('This execution should fail!')
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        'Error: Its not supported to query for daysAwayFromEnding combined with an event list'
      )
    }

    // Lookup events custom

    actions = await sed.getActionsForSubscriptions({
      memberplanId: customMemberPlan1.id,
      periodicity: PaymentPeriodicity.yearly,
      paymentMethodId: 'stripe',
      autorenwal: false,
      events: [SubscriptionEvent.INVOICE_CREATION, SubscriptionEvent.DEACTIVATION_UNPAID]
    })
    res =
      '[{"type":"INVOICE_CREATION","daysAwayFromEnding":-7,"externalMailTemplate":"custom1-INVOICE_CREATION"},{"type":"DEACTIVATION_UNPAID","daysAwayFromEnding":7,"externalMailTemplate":"custom1-DEACTIVATION_UNPAID"}]'
    expect(JSON.stringify(actions)).toEqual(res)

    // Lookup events default
    actions = await sed.getActionsForSubscriptions({
      memberplanId: customMemberPlan1.id,
      periodicity: PaymentPeriodicity.biannual,
      paymentMethodId: 'stripe',
      autorenwal: false,
      events: [SubscriptionEvent.INVOICE_CREATION, SubscriptionEvent.DEACTIVATION_UNPAID]
    })
    res =
      '[{"type":"INVOICE_CREATION","daysAwayFromEnding":-14,"externalMailTemplate":"default-INVOICE_CREATION"},{"type":"DEACTIVATION_UNPAID","daysAwayFromEnding":5,"externalMailTemplate":"default-DEACTIVATION_UNPAID"}]'
    expect(JSON.stringify(actions)).toEqual(res)
  })
  it('earliest creation date', async () => {
    const subscriptionFLowIntervals: SubscriptionFlowInterval[] = [
      // default -7
      {
        subscriptionFlowId: customMemberPlanFlow1.id,
        mailTemplateName: 'custom1-INVOICE_CREATION',
        event: SubscriptionEvent.INVOICE_CREATION,
        daysAwayFromEnding: -1
      },
      {
        subscriptionFlowId: customMemberPlanFlow2.id,
        mailTemplateName: 'custom2-INVOICE_CREATION',
        event: SubscriptionEvent.INVOICE_CREATION,
        daysAwayFromEnding: -3
      }
    ]
    const intervalList: SubscriptionInterval[] = []
    for (const sfi of subscriptionFLowIntervals) {
      intervalList.push(await createSubscriptionInterval(sfi))
    }

    let testDate = new Date()
    const sed = new SubscriptionEventDictionary(prismaClient)
    let res = await sed.getEarliestInvoiceCreationDate(testDate)
    expect(format(res, 'dd-MM-yyyy')).toEqual(format(add(testDate, {days: 14}), 'dd-MM-yyyy'))

    await prismaClient.subscriptionInterval.update({
      where: {
        id: intervalList.find(il => il.daysAwayFromEnding === -3)!.id
      },
      data: {
        daysAwayFromEnding: -20
      }
    })
    res = await sed.getEarliestInvoiceCreationDate(testDate)
    expect(format(res, 'dd-MM-yyyy')).toEqual(format(add(testDate, {days: 20}), 'dd-MM-yyyy'))

    testDate = sub(new Date(), {days: 10})
    res = await sed.getEarliestInvoiceCreationDate(testDate)
    expect(format(res, 'dd-MM-yyyy')).toEqual(format(add(testDate, {days: 20}), 'dd-MM-yyyy'))
  })

  it('custom event date list', async () => {
    const subscriptionFLowIntervals: SubscriptionFlowInterval[] = [
      {
        subscriptionFlowId: customMemberPlanFlow1.id,
        mailTemplateName: 'custom1-CUSTOM1',
        event: SubscriptionEvent.CUSTOM,
        daysAwayFromEnding: -90
      },
      {
        subscriptionFlowId: customMemberPlanFlow2.id,
        mailTemplateName: 'custom2-CUSTOM1',
        event: SubscriptionEvent.CUSTOM,
        daysAwayFromEnding: -40
      },
      {
        subscriptionFlowId: customMemberPlanFlow1.id,
        mailTemplateName: 'custom1-CUSTOM2',
        event: SubscriptionEvent.CUSTOM,
        daysAwayFromEnding: -40
      },
      {
        subscriptionFlowId: customMemberPlanFlow2.id,
        mailTemplateName: 'custom2-CUSTOM2',
        event: SubscriptionEvent.CUSTOM,
        daysAwayFromEnding: 0
      },
      {
        subscriptionFlowId: customMemberPlanFlow1.id,
        mailTemplateName: 'custom1-CUSTOM3',
        event: SubscriptionEvent.CUSTOM,
        daysAwayFromEnding: 10
      },
      {
        subscriptionFlowId: customMemberPlanFlow2.id,
        mailTemplateName: 'custom2-CUSTOM3',
        event: SubscriptionEvent.CUSTOM,
        daysAwayFromEnding: 40
      },
      {
        subscriptionFlowId: customMemberPlanFlow1.id,
        mailTemplateName: 'custom1-CUSTOM4',
        event: SubscriptionEvent.CUSTOM,
        daysAwayFromEnding: 90
      }
    ]
    const intervalList: SubscriptionInterval[] = []
    for (const sfi of subscriptionFLowIntervals) {
      intervalList.push(await createSubscriptionInterval(sfi))
    }
    const sed = new SubscriptionEventDictionary(prismaClient)

    let testDate = new Date()
    let res = await sed.getDatesWithCustomEvent(testDate)
    let dateRes = res.map(r => {
      return format(r, 'dd-MM-yyyy')
    })
    expect(
      dateRes.find(d => d === format(sub(testDate, {days: -90}), 'dd-MM-yyyy'))
    ).not.toBeUndefined()
    expect(
      dateRes.find(d => d === format(sub(testDate, {days: -40}), 'dd-MM-yyyy'))
    ).not.toBeUndefined()
    expect(
      dateRes.find(d => d === format(sub(testDate, {days: -15}), 'dd-MM-yyyy'))
    ).not.toBeUndefined()
    expect(
      dateRes.find(d => d === format(sub(testDate, {days: 0}), 'dd-MM-yyyy'))
    ).not.toBeUndefined()
    expect(
      dateRes.find(d => d === format(sub(testDate, {days: 10}), 'dd-MM-yyyy'))
    ).not.toBeUndefined()
    expect(
      dateRes.find(d => d === format(sub(testDate, {days: 40}), 'dd-MM-yyyy'))
    ).not.toBeUndefined()
    expect(
      dateRes.find(d => d === format(sub(testDate, {days: 90}), 'dd-MM-yyyy'))
    ).not.toBeUndefined()
    expect(dateRes.find(d => d === format(sub(testDate, {days: 15}), 'dd-MM-yyyy'))).toBeUndefined()
    expect(dateRes.find(d => d === format(sub(testDate, {days: 7}), 'dd-MM-yyyy'))).toBeUndefined()

    testDate = sub(new Date(), {days: 12})
    res = await sed.getDatesWithCustomEvent(testDate)
    dateRes = res.map(r => {
      return format(r, 'dd-MM-yyyy')
    })
    expect(
      dateRes.find(d => d === format(sub(testDate, {days: -90}), 'dd-MM-yyyy'))
    ).not.toBeUndefined()
    expect(
      dateRes.find(d => d === format(sub(testDate, {days: -40}), 'dd-MM-yyyy'))
    ).not.toBeUndefined()
    expect(
      dateRes.find(d => d === format(sub(testDate, {days: -15}), 'dd-MM-yyyy'))
    ).not.toBeUndefined()
    expect(
      dateRes.find(d => d === format(sub(testDate, {days: 0}), 'dd-MM-yyyy'))
    ).not.toBeUndefined()
    expect(
      dateRes.find(d => d === format(sub(testDate, {days: 10}), 'dd-MM-yyyy'))
    ).not.toBeUndefined()
    expect(
      dateRes.find(d => d === format(sub(testDate, {days: 40}), 'dd-MM-yyyy'))
    ).not.toBeUndefined()
    expect(
      dateRes.find(d => d === format(sub(testDate, {days: 90}), 'dd-MM-yyyy'))
    ).not.toBeUndefined()
    expect(dateRes.find(d => d === format(sub(testDate, {days: 15}), 'dd-MM-yyyy'))).toBeUndefined()
    expect(dateRes.find(d => d === format(sub(testDate, {days: 7}), 'dd-MM-yyyy'))).toBeUndefined()
  })

  it('No default flow defined', async () => {
    await prismaClient.subscriptionFlow.deleteMany({
      where: {
        default: true
      }
    })
    const sed = new SubscriptionEventDictionary(prismaClient)
    try {
      await sed.getActionsForSubscriptions({
        memberplanId: customMemberPlan1.id,
        periodicity: PaymentPeriodicity.yearly,
        paymentMethodId: 'stripe',
        autorenwal: true
      })
      throw Error('This execution should fail!')
    } catch (e) {
      expect((e as Error).toString()).toEqual('Error: Default user subscription flow not found!')
    }
  })

  it('Subscription Flow with no memberplan', async () => {
    await SubscriptionFlowFactory.create({
      memberPlan: undefined,
      default: false
    })
    const sed = new SubscriptionEventDictionary(prismaClient)
    try {
      await sed.getActionsForSubscriptions({
        memberplanId: customMemberPlan1.id,
        periodicity: PaymentPeriodicity.yearly,
        paymentMethodId: 'stripe',
        autorenwal: true
      })
      throw Error('This execution should fail!')
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        'Error: Subscription Flow with no memberplan found that is not default! This is a data integrity error!'
      )
    }
  })

  it('Multiple default memberplans', async () => {
    await SubscriptionFlowFactory.create({
      memberPlan: undefined,
      default: true
    })
    const sed = new SubscriptionEventDictionary(prismaClient)
    try {
      await sed.getActionsForSubscriptions({
        memberplanId: customMemberPlan1.id,
        periodicity: PaymentPeriodicity.yearly,
        paymentMethodId: 'stripe',
        autorenwal: true
      })
      throw Error('This execution should fail!')
    } catch (e) {
      expect((e as Error).toString()).toEqual(
        'Error: Multiple default memberplans found! This is a data integrity error!'
      )
    }
  })
})
