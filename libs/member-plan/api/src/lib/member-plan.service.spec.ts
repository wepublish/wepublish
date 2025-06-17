import {Test, TestingModule} from '@nestjs/testing'
import {MemberPlanService} from './member-plan.service'
import {PrismaClient} from '@prisma/client'
import {MemberPlanDataloader} from './member-plan.dataloader'
import {
  CreateMemberPlanInput,
  GetActiveMemberPlansArgs,
  GetMemberPlansArgs,
  MemberPlanSort,
  UpdateMemberPlanInput
} from './member-plan.model'
import {SortOrder} from '@wepublish/utils/api'

describe('MemberPlanService', () => {
  let service: MemberPlanService
  let dataloader: {[method in keyof MemberPlanDataloader]?: jest.Mock}
  let prismaMock: any

  beforeEach(async () => {
    prismaMock = {
      memberPlan: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      }
    }

    dataloader = {
      prime: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberPlanService,
        {provide: MemberPlanDataloader, useValue: dataloader},
        {provide: PrismaClient, useValue: prismaMock}
      ]
    }).compile()

    service = module.get<MemberPlanService>(MemberPlanService)
  })

  it('should get a member plan by slug', async () => {
    prismaMock.memberPlan.findUnique.mockResolvedValueOnce({
      id: '1',
      name: 'Basic Plan',
      slug: 'basic-plan',
      tags: ['tag1', 'tag2'],
      description: 'A basic plan',
      active: true,
      amountPerMonthMin: 10,
      extendable: false,
      maxCount: 100,
      imageID: 'image1',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      modifiedAt: new Date('2023-01-01T00:00:00Z'),
      availablePaymentMethods: []
    })
    await service.getMemberPlanBySlug('basic-plan')
    expect(prismaMock.memberPlan.findUnique).toHaveBeenCalled()
    expect(prismaMock.memberPlan.findUnique.mock.calls[0]).toMatchSnapshot()
    expect(dataloader.prime).toHaveBeenCalled()
  })

  it('should get member plans with filters', async () => {
    prismaMock.memberPlan.findMany.mockResolvedValueOnce([
      {
        id: '1',
        name: 'Basic Plan',
        slug: 'basic-plan',
        tags: ['tag1', 'tag2'],
        description: 'A basic plan',
        active: true,
        amountPerMonthMin: 10,
        extendable: false,
        maxCount: 100,
        imageID: 'image1',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        modifiedAt: new Date('2023-01-01T00:00:00Z'),
        availablePaymentMethods: []
      },
      {
        id: '2',
        name: 'Premium Plan',
        slug: 'premium-plan',
        tags: ['tag3', 'tag4'],
        description: 'A premium plan',
        active: false,
        amountPerMonthMin: 20,
        extendable: true,
        maxCount: 200,
        imageID: 'image2',
        createdAt: new Date('2023-01-02T00:00:00Z'),
        modifiedAt: new Date('2023-01-02T00:00:00Z'),
        availablePaymentMethods: []
      }
    ])
    const args: GetMemberPlansArgs = {
      filter: {name: 'Plan'},
      order: SortOrder.Ascending,
      sort: MemberPlanSort.CreatedAt,
      skip: 0,
      take: 2
    }
    await service.getMemberPlans(args)
    expect(prismaMock.memberPlan.findMany).toHaveBeenCalled()
    expect(prismaMock.memberPlan.findMany.mock.calls[0]).toMatchSnapshot()
    expect(dataloader.prime).toHaveBeenCalled()
  })

  it('should get active member plans', async () => {
    prismaMock.memberPlan.findMany.mockResolvedValueOnce([
      {
        id: '1',
        name: 'Basic Plan',
        slug: 'basic-plan',
        tags: ['tag1', 'tag2'],
        description: 'A basic plan',
        active: true,
        amountPerMonthMin: 10,
        extendable: false,
        maxCount: 100,
        imageID: 'image1',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        modifiedAt: new Date('2023-01-01T00:00:00Z'),
        availablePaymentMethods: []
      }
    ])
    const args: GetActiveMemberPlansArgs = {
      filter: {tags: ['tag1']},
      order: SortOrder.Ascending,
      sort: MemberPlanSort.CreatedAt,
      skip: 0,
      take: 1
    }
    await service.getActiveMemberPlans(args)
    expect(prismaMock.memberPlan.findMany).toHaveBeenCalled()
    expect(prismaMock.memberPlan.findMany.mock.calls[0]).toMatchSnapshot()
    expect(dataloader.prime).toHaveBeenCalled()
  })

  it('should create a member plan', async () => {
    const memberPlan: CreateMemberPlanInput = {
      name: 'New Plan',
      slug: 'new-plan',
      tags: ['tag1', 'tag2'],
      description: 'A new plan',
      active: true,
      amountPerMonthMin: 15,
      extendable: true,
      maxCount: 150,
      imageID: 'image3'
    }
    prismaMock.memberPlan.create.mockResolvedValueOnce({
      id: '3',
      ...memberPlan,
      createdAt: new Date('2023-01-03T00:00:00Z'),
      modifiedAt: new Date('2023-01-03T00:00:00Z'),
      availablePaymentMethods: []
    })
    await service.createMemberPlan(memberPlan)
    expect(prismaMock.memberPlan.create).toHaveBeenCalled()
    expect(prismaMock.memberPlan.create.mock.calls[0]).toMatchSnapshot()
    expect(dataloader.prime).toHaveBeenCalled()
  })

  it('should update a member plan', async () => {
    const memberPlan: UpdateMemberPlanInput = {
      id: '1',
      name: 'Updated Plan',
      slug: 'updated-plan',
      tags: ['tag1', 'tag2'],
      description: 'An updated plan',
      active: true,
      amountPerMonthMin: 12,
      extendable: true,
      maxCount: 120,
      imageID: 'image4'
    }
    prismaMock.memberPlan.update.mockResolvedValueOnce({
      ...memberPlan,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      modifiedAt: new Date('2023-01-04T00:00:00Z'),
      availablePaymentMethods: []
    })
    await service.updateMemberPlan(memberPlan)
    expect(prismaMock.memberPlan.update).toHaveBeenCalled()
    expect(prismaMock.memberPlan.update.mock.calls[0]).toMatchSnapshot()
    expect(dataloader.prime).toHaveBeenCalled()
  })

  it('should delete a member plan by id', async () => {
    prismaMock.memberPlan.delete.mockResolvedValueOnce({
      id: '1',
      name: 'Deleted Plan',
      slug: 'deleted-plan',
      tags: ['tag1', 'tag2'],
      description: 'A deleted plan',
      active: false,
      amountPerMonthMin: 10,
      extendable: false,
      maxCount: 100,
      imageID: 'image1',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      modifiedAt: new Date('2023-01-01T00:00:00Z'),
      availablePaymentMethods: []
    })
    await service.deleteMemberPlanById('1')
    expect(prismaMock.memberPlan.delete).toHaveBeenCalled()
    expect(prismaMock.memberPlan.delete.mock.calls[0]).toMatchSnapshot()
    expect(dataloader.prime).not.toHaveBeenCalled()
  })
})
