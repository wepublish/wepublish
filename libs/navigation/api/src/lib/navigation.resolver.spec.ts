import {INestApplication} from '@nestjs/common'
import {Test, TestingModule} from '@nestjs/testing'
import {GraphQLModule} from '@nestjs/graphql'
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {NavigationService} from './navigation.service'
import {NavigationResolver} from './navigation.resolver'
import {PrismaClient} from '@prisma/client'
import request from 'supertest'
import {expect} from '@storybook/jest'
import {NavigationDataloaderService} from './navigation-dataloader.service'

const navigationQueryById = `
  query GetNavigationById($id: ID!) {
    getNavigationById(id: $id) {
      id
      key
      name
      links {
        id
        label
        type
        ... on ArticleNavigationLink{
          articleID
        }

        ... on PageNavigationLink{
          pageID
        }

        ... on ExternalNavigationLink{
          url
        }
      }
    }
  }
`

const navigationListQuery = `
  query GetNavigations {
    getNavigations {
      id
      key
      name
      links {
        id
        label
        type
      }
    }
  }
`

const createNavigationMutation = `
  mutation CreateNavigation($navigation: CreateNavigationInput!) {
    createNavigation(navigation: $navigation) {
      id
      key
      name
    }
  }
`

const updateNavigationMutation = `
  mutation UpdateNavigation($navigation: UpdateNavigationInput!) {
    updateNavigation(navigation: $navigation) {
        id
        key
        name
    }
  }
`

const deleteNavigationMutation = `
  mutation DeleteNavigation($id: ID!) {
    deleteNavigation(id: $id) {
      id
    }
  }
`

describe('NavigationResolver', () => {
  let app: INestApplication
  let navigationServiceMock: {[method in keyof NavigationService]?: jest.Mock}
  let navigationDataloaderService: {[method in keyof NavigationDataloaderService]?: jest.Mock}

  beforeEach(async () => {
    navigationServiceMock = {
      getNavigations: jest.fn(),
      createNavigation: jest.fn(),
      deleteNavigationById: jest.fn(),
      updateNavigation: jest.fn()
    }

    navigationDataloaderService = {
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
        NavigationResolver,
        {provide: NavigationDataloaderService, useValue: navigationDataloaderService},
        {provide: NavigationService, useValue: navigationServiceMock},
        {provide: PrismaClient, useValue: jest.fn()}
      ]
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('Query: getNavigation by id', async () => {
    const mockResponse = {id: '1', key: 'main', name: 'Main Navigation', links: []}
    navigationDataloaderService.load?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: navigationQueryById,
        variables: {id: '1'}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Query: getNavigation by id: Not found', async () => {
    navigationDataloaderService.load?.mockResolvedValue(null)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: navigationQueryById,
        variables: {id: 'not-found'}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Query: getNavigations list', async () => {
    const mockResponse = [{id: '1', key: 'main', name: 'Main Navigation', links: []}]
    navigationServiceMock.getNavigations?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({query: navigationListQuery})
      .expect(res => {
        expect(navigationServiceMock.getNavigations).toHaveBeenCalled()
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Mutation: createNavigation', async () => {
    const navigation = {key: 'new', name: 'New Navigation', links: []}
    const mockResponse = {id: '2', key: 'new', name: 'New Navigation'}
    navigationServiceMock.createNavigation?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: createNavigationMutation,
        variables: {navigation}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
        expect(navigationServiceMock.createNavigation).toHaveBeenCalledWith(navigation)
      })
      .expect(200)
  })

  test('Mutation: updateNavigation', async () => {
    const navigation = {id: 'hello', key: 'updated', name: 'Updated Navigation', links: []}
    const mockResponse = {id: '1', key: 'updated', name: 'Updated Navigation'}
    navigationServiceMock.updateNavigation?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: updateNavigationMutation,
        variables: {navigation}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
        expect(navigationServiceMock.updateNavigation).toHaveBeenCalledWith(navigation)
      })
      .expect(200)
  })

  test('Mutation: deleteNavigation', async () => {
    const mockId = '1'
    const mockResponse = {id: '1'}
    navigationServiceMock.deleteNavigationById?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: deleteNavigationMutation,
        variables: {id: mockId}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
        expect(navigationServiceMock.deleteNavigationById).toHaveBeenCalledWith(mockId)
      })
      .expect(200)
  })
})
