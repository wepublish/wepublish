import { PrismaClient } from '@prisma/client'

/**
 * Subscription data model
 *
 * Subscription Communication Flows define, under what circumstances (payment provider,
 * plan periodicity, ...) and at what time in the subscription lifecycle which email
 * is sent.
 * When adding a magazine, a default "Subscription Communication Flow" is created. It
 * is unscoped (provider, periodicity, auto-renewal are empty) and defines the default
 * flow. When creating an override, the filters must be filled to override specific
 * situations.
 */

describe('Subscriptions', () => {
  describe('user communication flow', () => {
    let prisma: PrismaClient

    beforeAll(async () => {
      prisma = new PrismaClient()
      await prisma.$connect()
    })

    test('UCF can be created', async () => {
      const flow = await prisma.userCommunicationFlow.create({
        data: {
          // intentionally empty
        }
      })
      expect(flow.accountCreationMailTemplateId).toBeNull()
    })
  })

  describe('subscription communication flow', () => {
    let prisma: PrismaClient

    beforeAll(async () => {
      prisma = new PrismaClient()
      await prisma.$connect()
    })

    test('can create default SCF with subscriptionMail and subscriptionInterval', async () => {
      const template = await prisma.mailTemplate.create({
        data: {
          name: 'Test template',
          externalMailTemplateId: '11223344'
        }
      })

      const mail2 = await prisma.subscriptionInterval.create({
        data: {
          daysAwayFromEnding: 3,
          mailTemplate: {connect: {id: template.id}}
        }
      })

      const flow = await prisma.subscriptionFlow.create({
        data: {
          subscribeMailTemplate: {connect: {id: template.id}},
          invoiceCreationMailTemplate: {connect: {id: mail2.id}}
        }
      })
      expect(flow.subscribeMailTemplateId).toBe(template.id)
      expect(flow.invoiceCreationMailTemplateId).toBe(mail2.id)
    })

    test('can create SCF override', async () => {
      const templateDefault = await prisma.mailTemplate.create({
        data: {
          name: 'Test template',
          externalMailTemplateId: '11223344'
        }
      })

      const templateOverride = await prisma.mailTemplate.create({
        data: {
          name: 'Test template override',
          externalMailTemplateId: '66778899'
        }
      })

      const plan = await prisma.memberPlan.create({
        data: {
          name: 'Testplan',
          slug: 'testplan',
          description: {},
          active: true,
          amountPerMonthMin: 0
        }
      })

      const flowDefault = await prisma.subscriptionFlow.create({
        data: {
          subscribeMailTemplate: {connect: {id: templateDefault.id}}
        }
      })
      expect(flowDefault.subscribeMailTemplateId).toBe(templateDefault.id)

      const flowOverride = await prisma.subscriptionFlow.create({
        data: {
          memberPlan: {connect: {id: plan.id}},
          subscribeMailTemplate: {connect: {id: templateOverride.id}}
        }
      })
      expect(flowOverride.subscribeMailTemplateId).toBe(templateOverride.id)
    })
  })
})
