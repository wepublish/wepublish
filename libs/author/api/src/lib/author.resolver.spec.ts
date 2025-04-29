import {INestApplication} from '@nestjs/common'
import {Test, TestingModule} from '@nestjs/testing'
import {GraphQLModule} from '@nestjs/graphql'
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {PrismaClient} from '@prisma/client'
import request from 'supertest'
import {expect} from '@storybook/jest'
import {AuthorService} from './author.service'
import {AuthorResolver} from './author.resolver'
import {AuthorDataloader} from './author-dataloader'

const authorQueryById = `
  query GetAuthorById($id: ID!) {
    getAuthorsById(id: $id) {
      id
      slug
      name
      jobTitle
      bio
      imageID
      links {
        id
        createdAt
        modifiedAt
        title
        url
      }
    }
  }
`

const authorQueryBySlug = `
  query GetAuthorBySlug($slug: String!) {
    getAuthorBySlug(slug: $slug) {
      id
      slug
      name
      jobTitle
      bio
      imageID
      links {
        id
        createdAt
        modifiedAt
        title
        url
      }
    }
  }
`

const authorsListQuery = `
  query GetAuthors($skip: Int, $take: Int) {
    getAuthors(skip: $skip, take: $take) {
      nodes {
        id
        slug
        name
        jobTitle
        bio
        imageID
        links {
          id
          createdAt
          modifiedAt
          title
          url
        }
      }
      totalCount
    }
  }
`

const createAuthorMutation = `
  mutation CreateAuthor($author: CreateAuthorInput!) {
    createAuthor(author: $author) {
      id
      slug
    }
  }
`

const updateAuthorMutation = `
  mutation UpdateAuthor($author: UpdateAuthorInput!) {
    updateAuthor(author: $author) {
      id
      slug
    }
  }
`

const deleteAuthorMutation = `
  mutation DeleteAuthor($id: ID!) {
    deleteAuthor(id: $id) {
      id
    }
  }
`

describe('AuthorResolver', () => {
  let app: INestApplication
  let authorServiceMock: {[method in keyof AuthorService]?: jest.Mock}
  let authorDataloaderMock: {[method in keyof AuthorDataloader]?: jest.Mock}

  beforeEach(async () => {
    authorServiceMock = {
      getAuthorBySlug: jest.fn(),
      getAuthors: jest.fn(),
      createAuthor: jest.fn(),
      deleteAuthorById: jest.fn(),
      updateAuthor: jest.fn()
    }

    authorDataloaderMock = {
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
        AuthorResolver,
        {provide: AuthorDataloader, useValue: authorDataloaderMock},
        {provide: AuthorService, useValue: authorServiceMock},
        {provide: PrismaClient, useValue: jest.fn()}
      ]
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  test('Query: getAuthor by id', async () => {
    const mockResponse = {
      id: '1',
      slug: 'author-slug',
      name: 'Author Name',
      jobTitle: 'Author Job',
      bio: [],
      imageID: null,
      links: []
    }
    authorDataloaderMock.load?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: authorQueryById,
        variables: {id: '1'}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Query: getAuthor by id: Not found', async () => {
    authorDataloaderMock.load?.mockResolvedValue(null)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: authorQueryById,
        variables: {id: 'not-found'}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Query: getAuthor by slug', async () => {
    const mockResponse = {
      id: '1',
      slug: 'author-slug',
      name: 'Author Name',
      jobTitle: 'Author Job',
      bio: [],
      imageID: null,
      links: []
    }
    authorServiceMock.getAuthorBySlug?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: authorQueryBySlug,
        variables: {slug: 'author-slug'}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Query: getAuthor by slug: Not found', async () => {
    authorServiceMock.getAuthorBySlug?.mockResolvedValue(null)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: authorQueryBySlug,
        variables: {slug: 'not-found'}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Query: getAuthors list', async () => {
    const mockResponse = {
      nodes: [
        {
          id: '1',
          slug: 'author-slug',
          name: 'Author Name',
          jobTitle: 'Author Job',
          bio: [],
          imageID: null,
          links: []
        }
      ],
      totalCount: 1
    }
    authorServiceMock.getAuthors?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: authorsListQuery,
        variables: {take: 10, skip: 0}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
      })
      .expect(200)
  })

  test('Mutation: createAuthor', async () => {
    const author = {
      name: 'New Author',
      slug: 'new-author',
      jobTitle: 'New Job',
      bio: [],
      imageID: null,
      links: [],
      tagIds: []
    }
    const mockResponse = {
      id: '2',
      slug: 'new-author',
      name: 'New Author',
      jobTitle: 'New Job',
      bio: [],
      imageID: null,
      links: []
    }
    authorServiceMock.createAuthor?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: createAuthorMutation,
        variables: {author}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
        expect(authorServiceMock.createAuthor).toHaveBeenCalledWith(author)
      })
      .expect(200)
  })

  test('Mutation: updateAuthor', async () => {
    const author = {
      id: '1',
      name: 'Updated Author',
      slug: 'updated-author',
      jobTitle: 'Updated Job',
      bio: [],
      imageID: null,
      links: [],
      tagIds: []
    }
    const mockResponse = {
      id: '1',
      slug: 'updated-author',
      name: 'Updated Author',
      jobTitle: 'Updated Job',
      bio: [],
      imageID: null,
      links: []
    }
    authorServiceMock.updateAuthor?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: updateAuthorMutation,
        variables: {author}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
        expect(authorServiceMock.updateAuthor).toHaveBeenCalledWith(author)
      })
      .expect(200)
  })

  test('Mutation: deleteAuthor', async () => {
    const mockId = '1'
    const mockResponse = {id: '1'}
    authorServiceMock.deleteAuthorById?.mockResolvedValue(mockResponse)

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: deleteAuthorMutation,
        variables: {id: mockId}
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot()
        expect(authorServiceMock.deleteAuthorById).toHaveBeenCalledWith(mockId)
      })
      .expect(200)
  })
})
