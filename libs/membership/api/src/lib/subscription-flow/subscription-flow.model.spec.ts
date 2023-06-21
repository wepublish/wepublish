import {Test, TestingModule} from '@nestjs/testing'
import {SubscriptionFlowController} from './subscription-flow.controller'
import {clearDatabase} from '../../prisma-utils'
import {PrismaModule} from '@wepublish/nest-modules'
import {PrismaService} from '@wepublish/nest-modules'
import {MailTemplate, PrismaClient} from '@prisma/client'
import {PrismaClient} from '@prisma/client'
import {PeriodicJobController} from '../periodic-job/periodic-job.controller'
import {SubscriptionController} from '../subscription/subscription.controller'
import {
  initialize,
  defineMemberPlanFactory,
  defineMailTemplateFactory,
  defineSubscriptionFlowFactory,
  defineSubscriptionIntervalFactory
} from '../../__generated__/fabbrica'
import {MailContext, MailProvider, MailProviderTemplate} from '@wepublish/mails'
import {PaymentsService} from '@wepublish/payments'

const mockTemplate1: MailTemplate = {
  id: 'b9172f6b-b650-4053-a013-5a9430c95b9f',
  name: 'Mock Template 1',
  description: 'Mock Desc 1',
  externalMailTemplateId: 'slug-123',
  remoteMissing: false,
  createdAt: new Date(),
  modifiedAt: new Date()
}

const mockTemplate2: MailTemplate = {
  id: '3cb7a082-750d-4573-a95d-df8b2b480a80',
  name: 'Mock Template 2',
  description: 'Mock Desc 2',
  externalMailTemplateId: 'slug-234',
  remoteMissing: false,
  createdAt: new Date(),
  modifiedAt: new Date()
}

const mockRemoteTemplate1: MailProviderTemplate = {
  name: 'Mock Template 2',
  uniqueIdentifier: 'slug-234',
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockRemoteTemplate2: MailProviderTemplate = {
  name: 'Mock Template 3',
  uniqueIdentifier: 'slug-345',
  createdAt: new Date(),
  updatedAt: new Date()
}

const prismaServiceMock = {
  mailTemplate: {
    findMany: jest.fn((): MailTemplate[] => [mockTemplate1, mockTemplate2]),
    create: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis()
  }
}

const mailProviderServiceMock = {
  name: 'MockProvider',
  getTemplateUrl: jest.fn((): string => 'https://example.com/template.html'),
  getTemplates: jest.fn((): MailProviderTemplate[] => [mockRemoteTemplate1, mockRemoteTemplate2])
}

const mailContextMock = {
  mailProvider: mailProviderServiceMock as unknown as MailProvider,
  getUsedTemplateIdentifiers: jest.fn((): string[] => [])
}
import {registerMailsModule, registerPaymentsModule} from '../testing/module-registrars'

describe('SubscriptionFlowController', () => {
  let controller: SubscriptionFlowController
  const prismaClient = new PrismaClient()
  initialize({prisma: prismaClient})

  const MemberPlanFactory = defineMemberPlanFactory()
  const MailTemplateFactory = defineMailTemplateFactory()
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule.forTest(prismaClient),
        registerMailsModule(),
        registerPaymentsModule()
      ],
      providers: [SubscriptionFlowController, PeriodicJobController, SubscriptionController]
    }).compile()

    controller = module.get<SubscriptionFlowController>(SubscriptionFlowController)

    await clearDatabase(prismaClient, [
      'subscription_communication_flows',
      'payment.methods',
      'member.plans',
      'subscriptions.intervals',
      'mail_templates'
    ])
  })

  afterEach(async () => {
    await prismaClient.$disconnect()
  })

  test('can create default SCF with subscriptionMail and subscriptionInterval', async () => {
    const template = await MailTemplateFactory.create()
    const interval = await SubscriptionIntervalFactory.create({
      mailTemplate: {connect: {id: template.id}}
    })
    const flow1 = await SubscriptionFlowFactory.create({
      intervals: {connect: [{id: interval.id}]}
    })

    const flow = await prismaClient.subscriptionFlow.findFirst({
      where: {id: flow1.id},
      include: {intervals: {include: {mailTemplate: true}}}
    })

    expect(flow!.intervals[0].mailTemplate?.id).toBe(template.id)
  })
})
