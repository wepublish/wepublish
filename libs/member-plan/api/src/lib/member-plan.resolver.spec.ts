import {INestApplication} from '@nestjs/common'
import {Test, TestingModule} from '@nestjs/testing'
import {GraphQLModule} from '@nestjs/graphql'
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {MemberPlanService} from './member-plan.service'
import {MemberPlanResolver} from './member-plan.resolver'
import {PrismaClient} from '@prisma/client'
import request from 'supertest'
import {expect} from '@storybook/jest'
import {MemberPlanDataloader} from './member-plan.dataloader'

const memberPlanQueryById = `
    query GetMemberPlanById($id: ID!) {
      getMemberPlanById(id: $id) {
        id
        createdAt
        modifiedAt
        name
        slug
        tags
        description
        active
        amountPerMonthMin
        extendable
        maxCount
        imageID
      }
    }
  `

const memberPlanQueryBySlug = `
    query GetMemberPlanBySlug($slug: String!) {
      getMemberPlanBySlug(slug: $slug) {
        id
        createdAt
        modifiedAt
        name
        slug
        tags
        description
        active
        amountPerMonthMin
        extendable
        maxCount
        imageID
      }
    }
  `

const activeMemberPlansQuery = `
    query GetActiveMemberPlans {
      getActiveMemberPlans {
        id
        createdAt
        modifiedAt
        name
        slug
        tags
        description
        active
        amountPerMonthMin
        extendable
        maxCount
        imageID
      }
    }
  `

const memberPlansListQuery = `
    query GetMemberPlans {
      getMemberPlans {
        id
        createdAt
        modifiedAt
        name
        slug
        tags
        description
        active
        amountPerMonthMin
        extendable
        maxCount
        imageID
      }
    }
  `

const createMemberPlanMutation = `
    mutation CreateMemberPlan($memberPlan: CreateMemberPlanInput!) {
      createMemberPlan(memberPlan: $memberPlan) {
        id
      }
    }
  `

const updateMemberPlanMutation = `
    mutation UpdateMemberPlan($memberPlan: UpdateMemberPlanInput!) {
      updateMemberPlan(memberPlan: $memberPlan) {
        id
      }
    }
  `

const deleteMemberPlanMutation = `
    mutation DeleteMemberPlan($id: ID!) {
      deleteMemberPlanById(id: $id) {
        id
      }
    }
  `

describe('MemberPlanResolver', () => {
  let app: INestApplication
  let memberPlanServiceMock: {[method in keyof MemberPlanService]?: jest.Mock}
  let memberPlanDataloaderMock: {[method in keyof MemberPlanDataloader]?: jest.Mock}

  beforeEach(async () => {
    memberPlanServiceMock = {
      getMemberPlanBySlug: jest.fn(),
      getActiveMemberPlans: jest.fn(),
      getMemberPlans: jest.fn(),
      createMemberPlan: jest.fn(),
      deleteMemberPlanById: jest.fn(),
      updateMemberPlan: jest.fn()
    }

    memberPlanDataloaderMock = {
      load: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/'
        })
      ],
      providers: [
        MemberPlanResolver,
        {provide: MemberPlanDataloader, useValue: memberPlanDataloaderMock},
        {provide: MemberPlanService, useValue: memberPlanServiceMock},
        {provide: PrismaClient, useValue: jest.fn()}
      ]
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('Query: getMemberPlan by id', async () => {
    const mockResponse = {
      id: '1',
      createdAt: new Date('2022-01-01'),
      modifiedAt: new Date('2022-01-02'),
      name: 'Member Plan 1',
      slug: 'member-plan-1',
      tags: ['tag1', 'tag2'],
      description: 'description',
      active: true,
      amountPerMonthMin: 10.0,
      extendable: true,
      maxCount: 100,
      imageID: null
    }
    memberPlanDataloaderMock.load?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: memberPlanQueryById,
        variables: {id: '1'}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Query: getMemberPlan by id: Not found', async () => {
    memberPlanDataloaderMock.load?.mockResolvedValue(null)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: memberPlanQueryById,
        variables: {id: 'not-found'}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Query: getMemberPlan by slug', async () => {
    const mockResponse = {
      id: '1',
      createdAt: new Date('2022-01-01'),
      modifiedAt: new Date('2022-01-02'),
      name: 'Member Plan 1',
      slug: 'member-plan-1',
      tags: ['tag1', 'tag2'],
      description: 'description',
      active: true,
      amountPerMonthMin: 10.0,
      extendable: true,
      maxCount: 100,
      imageID: null
    }
    memberPlanServiceMock.getMemberPlanBySlug?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: memberPlanQueryBySlug,
        variables: {slug: 'member-plan-1'}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Query: getMemberPlan by slug: Not found', async () => {
    memberPlanServiceMock.getMemberPlanBySlug?.mockResolvedValue(null)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: memberPlanQueryBySlug,
        variables: {slug: 'not-found'}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Query: getActiveMemberPlans', async () => {
    const mockResponse = [
      {
        id: '1',
        createdAt: new Date('2022-01-01'),
        modifiedAt: new Date('2022-01-02'),
        name: 'Member Plan 1',
        slug: 'member-plan-1',
        tags: ['tag1', 'tag2'],
        description: 'description',
        active: true,
        amountPerMonthMin: 10.0,
        extendable: true,
        maxCount: 100,
        imageID: null
      }
    ]
    memberPlanServiceMock.getActiveMemberPlans?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: activeMemberPlansQuery
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
        expect(memberPlanServiceMock.getActiveMemberPlans).toHaveBeenCalled()
      })
      .expect(200)
  })

  test('Query: getMemberPlans list', async () => {
    const mockResponse = [
      {
        id: '1',
        createdAt: new Date('2022-01-01'),
        modifiedAt: new Date('2022-01-02'),
        name: 'Member Plan 1',
        slug: 'member-plan-1',
        tags: ['tag1', 'tag2'],
        description: 'description',
        active: true,
        amountPerMonthMin: 10.0,
        extendable: true,
        maxCount: 100,
        imageID: null
      }
    ]
    memberPlanServiceMock.getMemberPlans?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: memberPlansListQuery
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
        expect(memberPlanServiceMock.getMemberPlans).toHaveBeenCalled()
      })
      .expect(200)
  })

  test('Mutation: createMemberPlan', async () => {
    const memberPlan = {
      name: 'New Member Plan',
      slug: 'new-member-plan',
      tags: ['tag1', 'tag2'],
      description: 'description',
      active: true,
      amountPerMonthMin: 10.0,
      extendable: true,
      maxCount: 100,
      imageID: null
    }
    const mockResponse = {
      id: '2'
    }
    memberPlanServiceMock.createMemberPlan?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: createMemberPlanMutation,
        variables: {memberPlan}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
        expect(memberPlanServiceMock.createMemberPlan).toHaveBeenCalledWith(memberPlan)
      })
      .expect(200)
  })

  test('Mutation: updateMemberPlan', async () => {
    const memberPlan = {
      id: '1',
      name: 'Updated Member Plan',
      slug: 'updated-member-plan',
      tags: ['tag1', 'tag2'],
      description: 'description',
      active: true,
      amountPerMonthMin: 20.0,
      extendable: true,
      maxCount: 200,
      imageID: null
    }
    const mockResponse = {
      id: '1'
    }
    memberPlanServiceMock.updateMemberPlan?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: updateMemberPlanMutation,
        variables: {memberPlan}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
        expect(memberPlanServiceMock.updateMemberPlan).toHaveBeenCalledWith(memberPlan)
      })
      .expect(200)
  })

  test('Mutation: deleteMemberPlan', async () => {
    const mockId = '1'
    const mockResponse = {id: '1'}
    memberPlanServiceMock.deleteMemberPlanById?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: deleteMemberPlanMutation,
        variables: {id: mockId}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
        expect(memberPlanServiceMock.deleteMemberPlanById).toHaveBeenCalledWith(mockId)
      })
      .expect(200)
  })
})
