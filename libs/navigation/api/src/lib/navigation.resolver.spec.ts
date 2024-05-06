import {INestApplication} from '@nestjs/common'
import {Test, TestingModule} from '@nestjs/testing'
import {GraphQLModule} from '@nestjs/graphql'
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {NavigationService} from './navigation.service'
import {NavigationResolver} from './navigation.resolver'
import {PrismaClient} from '@prisma/client'
import request from 'supertest'
import {expect} from '@storybook/jest'

const navigationQuery = `
  query GetNavigation($id: String, $key: String) {
    getNavigation(id: $id, key: $key) {
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
  mutation CreateNavigation($input: CreateNavigationInput!) {
    createNavigation(input: $input) {
      id
      key
      name
    }
  }
`

const updateNavigationMutation = `
  mutation UpdateNavigation($input: UpdateNavigationArgs!) {
    updateNavigation(input: $input) {
      id
      key
      name
    }
  }
`

const deleteNavigationMutation = `
  mutation DeleteNavigation($id: String!) {
    deleteNavigation(id: $id) {
      id
    }
  }
`

describe('NavigationResolver', () => {
  let app: INestApplication
  let navigationServiceMock: {[method in keyof NavigationService]?: jest.Mock}

  beforeEach(async () => {
    navigationServiceMock = {
      getNavigationById: jest.fn(),
      getNavigationByKey: jest.fn(),
      getNavigations: jest.fn(),
      createNavigation: jest.fn(),
      deleteNavigationById: jest.fn(),
      updateNavigation: jest.fn()
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

  test('Query: getNavigation by key', async () => {
    const mockKey = 'main'
    const mockResponse = {id: '1', key: 'main', name: 'Main Navigation', links: []}
    navigationServiceMock.getNavigationByKey?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: navigationQuery,
        variables: {key: mockKey}
      })
      .expect(200)
      .expect(res => {
        expect(navigationServiceMock.getNavigationByKey).toHaveBeenCalledWith(mockKey)
        expect(res.body.data.getNavigation).toMatchSnapshot()
      })
  })

  test('Query: getNavigations list', async () => {
    const mockResponse = [{id: '1', key: 'main', name: 'Main Navigation', links: []}]
    navigationServiceMock.getNavigations?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({query: navigationListQuery})
      .expect(200)
      .expect(res => {
        expect(navigationServiceMock.getNavigations).toHaveBeenCalled()
        expect(res.body.data.getNavigations).toMatchSnapshot()
      })
  })

  test('Mutation: createNavigation', async () => {
    const mockInput = {key: 'new', name: 'New Navigation', links: []}
    const mockResponse = {id: '2', key: 'new', name: 'New Navigation'}
    navigationServiceMock.createNavigation?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: createNavigationMutation,
        variables: {input: mockInput}
      })
      .expect(200)
      .expect(res => {
        expect(navigationServiceMock.createNavigation).toHaveBeenCalledWith(mockInput)
        expect(res.body.data.createNavigation).toMatchSnapshot()
      })
  })

  test('Mutation: updateNavigation', async () => {
    const mockInput = {id: 'hello', key: 'updated', name: 'Updated Navigation', links: []}
    const mockResponse = {id: '1', key: 'updated', name: 'Updated Navigation'}
    navigationServiceMock.updateNavigation?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: updateNavigationMutation,
        variables: {input: mockInput}
      })
      .expect(200)
      .expect(res => {
        expect(navigationServiceMock.updateNavigation).toHaveBeenCalledWith(mockInput)
        expect(res.body.data.updateNavigation).toMatchSnapshot()
      })
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
      .expect(200)
      .expect(res => {
        expect(navigationServiceMock.deleteNavigationById).toHaveBeenCalledWith(mockId)
        expect(res.body.data.deleteNavigation).toMatchSnapshot()
      })
  })
})
