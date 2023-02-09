import {Test, TestingModule} from '@nestjs/testing'
import {SubscriptionFlow} from '@prisma/client'
import {SubscriptionFlowController} from './subscription-flow.controller'

const mockFlowDefault: SubscriptionFlow = {
  id: 1,
  createdAt: new Date(),
  modifiedAt: new Date(),
  default: true,
  memberPlanId: 'sample-plan-id',
  periodicities: [],
  autoRenewal: [],
  subscribeMailTemplateId: 1,
  invoiceCreationMailTemplateId: 2,
  renewalSuccessMailTemplateId: 3,
  renewalFailedMailTemplateId: 4,
  deactivationUnpaidMailTemplateId: 5,
  deactivationByUserMailTemplateId: 6,
  reactivationMailTemplateId: 7
}

const mockFlowCustom: SubscriptionFlow = {
  id: 2,
  createdAt: new Date(),
  modifiedAt: new Date(),
  default: false,
  memberPlanId: 'sample-plan-id',
  periodicities: [],
  autoRenewal: [],
  subscribeMailTemplateId: 1,
  invoiceCreationMailTemplateId: 2,
  renewalSuccessMailTemplateId: 3,
  renewalFailedMailTemplateId: 4,
  deactivationUnpaidMailTemplateId: 5,
  deactivationByUserMailTemplateId: 6,
  reactivationMailTemplateId: 7
}

const prismaServiceMock = {
  subscriptionFlow: jest.fn().mockReturnThis(),
  findMany: jest.fn((): SubscriptionFlow[] => [mockFlowDefault, mockFlowCustom])
}

describe('SubscriptionFlowController', () => {
  let controller: SubscriptionFlowController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionFlowController
        //{provide: PrismaService, useValue: prismaServiceMock}
      ]
    }).compile()

    controller = module.get<SubscriptionFlowController>(SubscriptionFlowController)
  })

  xit('is defined', () => {
    expect(controller).toBeDefined()
  })

  xit('returns only default template', async () => {
    const result = await controller.getFlow(true)
    expect(result.length).toEqual(1)
    expect(result[0].default).toEqual(true)
  })

  xit('returns all templates', async () => {
    const result = await controller.getFlow(true)
    expect(result.length).toEqual(1)
    expect(result[0].default).toEqual(true)
  })

  xit('creates template', async () => {
    const result = await controller.getFlow(true)
    expect(result.length).toEqual(1)
    expect(result[0].default).toEqual(true)
  })

  xit('prevents creation of multiple default templates', async () => {
    const result = await controller.getFlow(true)
    expect(result.length).toEqual(1)
    expect(result[0].default).toEqual(true)
  })
})
