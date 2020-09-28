import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {URL} from 'url'
import {
  Author,
  contextFromRequest,
  GraphQLWepublishPublicSchema,
  GraphQLWepublishSchema,
  OptionalUserSession,
  PublicArticle,
  PublicPage,
  URLAdapter
} from '../src'
import {ApolloServer} from 'apollo-server'
import {createTestClient} from 'apollo-server-testing'
import {ApolloServerTestClient} from 'apollo-server-testing/dist/createTestClient'
import {KarmaMediaAdapter} from '@wepublish/api-media-karma/src'

export interface TestClient {
  dbAdapter: MongoDBAdapter
  testClientPublic: ApolloServerTestClient
  testClientPrivate: ApolloServerTestClient
}

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

export async function createGraphQLTestClientWithMongoDB(): Promise<TestClient> {
  if (!process.env.TEST_MONGO_URL) {
    throw new Error('TEST_MONGO_URL not defined')
  }
  let adminUser

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

  const dbAdapter = await MongoDBAdapter.connect({
    url: process.env.TEST_MONGO_URL!,
    locale: 'en'
  })

  const mediaAdapter: KarmaMediaAdapter = {
    url: new URL('https://fakeurl.com'),
    token: 'fake',
    getImageURL: jest.fn(),

    deleteImage: jest.fn(),
    uploadImage: jest.fn(),
    uploadImageFromArrayBuffer: jest.fn(),
    _uploadImage: jest.fn()
  }
  if (!adminUser) {
    throw new Error('Could not get admin user')
  }

  const userSession: OptionalUserSession = await dbAdapter.session.createUserSession(adminUser)

  const request: any = {
    headers: {
      authorization: `Bearer ${userSession?.token}`
    }
  }

  const apolloServerPublic = new ApolloServer({
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

  const apolloServerPrivate = new ApolloServer({
    schema: GraphQLWepublishSchema,
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

  const testClientPrivate = createTestClient(apolloServerPrivate)
  const testClientPublic = createTestClient(apolloServerPublic)

  return {
    dbAdapter,
    testClientPublic,
    testClientPrivate
  }
}
