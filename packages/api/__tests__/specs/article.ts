import {
  contextFromRequest,
  GraphQLWepublishPublicSchema,
  OptionalUser,
  OptionalUserSession,
  Author,
  PublicArticle,
  PublicPage,
  URLAdapter
} from '../../src'
import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {KarmaMediaAdapter} from '@wepublish/api-media-karma/lib'
import {URL} from 'url'
import {ApolloServer} from 'apollo-server'
import {ApolloServerTestClient, createTestClient} from 'apollo-server-testing'
import gql from 'graphql-tag'

class ExampleURLAdapter implements URLAdapter {
  getPublicArticleURL(article: PublicArticle): string {
    return `https://demo.wepublish.ch/article/${article.id}/${article.slug}`
  }

  getPublicPageURL(page: PublicPage): string {
    return `https://demo.wepublish.ch/page/${page.id}/${page.slug}`
  }

  getAuthorURL(author: Author): string {
    return `https://demo.wepublish.ch/author/${author.slug || author.id}`
  }
}

jest.useFakeTimers()

let testClient: ApolloServerTestClient
let adminUser: OptionalUser
let dbAdapter: MongoDBAdapter

beforeAll(async () => {
  try {
    if (!process.env.TEST_MONGO_URL) {
      throw new Error('TEST_MONGO_URL not defined')
    }

    await MongoDBAdapter.initialize({
      url: process.env.TEST_MONGO_URL!,
      locale: 'en',
      seed: async adapter => {
        const adminUserRole = await adapter.userRole.getUserRole('Admin')
        const adminUserRoleId = adminUserRole ? adminUserRole.id : 'fake'

        adminUser = await adapter.user.createUser({
          input: {
            email: 'dev@wepublish.ch',
            name: 'Dev User',
            roleIDs: [adminUserRoleId]
          },
          password: '123'
        })
      }
    })

    dbAdapter = await MongoDBAdapter.connect({
      url: process.env.TEST_MONGO_URL!,
      locale: 'en'
    })

    const mediaAdapter: KarmaMediaAdapter = {
      url: new URL('https://fakeurl.com'),
      token: 'fake',
      getImageURL: jest.fn(),
      deleteImage: jest.fn(),
      uploadImage: jest.fn()
    }
    if (!adminUser) return
    const userSession: OptionalUserSession = await dbAdapter.session.createUserSession(adminUser)

    const request: any = {
      headers: {
        authorization: `Bearer ${userSession?.token}`
      }
    }

    const apolloServer: ApolloServer = new ApolloServer({
      schema: GraphQLWepublishPublicSchema,
      playground: false,
      introspection: false,
      tracing: false,
      context: async () =>
        await contextFromRequest(request, {
          hostURL: 'https://fakeURL',
          websiteURL: 'https://fakeurl',
          dbAdapter,
          mediaAdapter,
          urlAdapter: new ExampleURLAdapter(),
          oauth2Providers: []
        })
    })

    testClient = createTestClient(apolloServer)
  } catch (error) {
    console.log('Setup Error', error)
    throw new Error('Error during test setup')
  }
})

describe('Articles', () => {
  const GET_ARTICLES = gql`
    {
      articles(first: 5) {
        nodes {
          id
          title
          lead
        }
      }
    }
  `

  test('can execute query', async done => {
    const {query} = testClient
    const res = await query({
      query: GET_ARTICLES,
      variables: {
        first: 5
      }
    })

    expect(res).toMatchSnapshot()
    done()
  })
})

afterAll(async () => {
  if (dbAdapter) {
    await dbAdapter.db.dropDatabase()
    await dbAdapter.client.close()
  }
})
