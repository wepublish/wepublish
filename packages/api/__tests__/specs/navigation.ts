import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {ApolloServerTestClient} from 'apollo-server-testing'
import {createGraphQLTestClientWithMongoDB} from '../utility'
import {
  NavigationInput,
  CreateNavigation,
  PageInput,
  CreatePage,
  ArticleInput,
  CreateArticle
} from '../api/private'

let testClientPublic: ApolloServerTestClient
let testClientPrivate: ApolloServerTestClient
let dbAdapter: MongoDBAdapter
let pageID: string
let articleID: string

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithMongoDB()
    testClientPublic = setupClient.testClientPublic
    testClientPrivate = setupClient.testClientPrivate
    dbAdapter = setupClient.dbAdapter

    console.log('public', testClientPublic)
  } catch (error) {
    console.log('Error', error)
    throw new Error('Error during test setup')
  }
  const {mutate} = testClientPrivate
  const pageInput: PageInput = {
    title: 'Testing Page',
    slug: 'testing-page',
    tags: ['tags'],
    properties: [],
    blocks: []
  }
  const pageRes = await mutate({
    mutation: CreatePage,
    variables: {
      input: pageInput
    }
  })
  pageID = pageRes.data?.createPage?.id
  console.log('page id: ' + pageID)

  const articleInput: ArticleInput = {
    title: 'Article Title',
    slug: 'article-slug',
    shared: false,
    tags: [],
    breaking: true,
    lead: 'Article Lead',
    preTitle: 'Testing GraphQL',
    hideAuthor: false,
    properties: [],
    authorIDs: [],
    socialMediaTitle: 'A social media title',
    socialMediaAuthorIDs: [],
    socialMediaDescription: 'A social media description',
    socialMediaImageID: '',
    blocks: []
  }
  const articleRes = await mutate({
    mutation: CreateArticle,
    variables: {
      input: articleInput
    }
  })
  articleID = articleRes.data?.createArticle?.id
  console.log('article id: ' + articleID)
})

describe('Navigations', () => {
  describe('can be created/edited/deleted:', () => {
    const ids: string[] = []
    beforeEach(async () => {
      const {mutate} = testClientPrivate
      const input: NavigationInput = {
        name: 'Test Name',
        key: 'Test Key',
        links: [
          {article: {label: 'Article Label', articleID: 'articleID123'}},
          {external: {label: 'External Label', url: 'linkurl.ch/'}},
          {page: {label: 'Page Label', pageID: 'pageID123'}}
        ]
      }
      const res = await mutate({
        mutation: CreateNavigation,
        variables: {
          input: input
        }
      })
      ids.unshift(res.data?.createNavigation?.id)
    })

    test('can be created', async () => {
      const {mutate} = testClientPrivate
      const input: NavigationInput = {
        name: 'Create Navigation Name',
        key: 'createNavKey321',
        links: [
          {article: {label: 'Article Label', articleID: articleID}},
          {external: {label: 'External Label', url: 'linkurl.ch/'}},
          {page: {label: 'Page Label', pageID: pageID}}
        ]
      }
      const res = await mutate({
        mutation: CreateNavigation,
        variables: {
          input: input
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          createNavigation: {
            id: expect.any(String),
            links: Array.from({length: 3}, () => ({}))
          }

          /*
            {
              article: {
                createdAt: expect.any(String),
                id: expect.any(String),
                modifiedAt: expect.any(String)
              }
            },
            {
              page: {
                createdAt: expect.any(String),
                id: expect.any(String),
                modifiedAt: expect.any(String)
              }
            }
            */
        }
      })
      ids.unshift(res.data?.createNavigation?.id)
      console.log(ids)
    })
  })
})

afterAll(async () => {
  if (dbAdapter) {
    await dbAdapter.db.dropDatabase()
    await dbAdapter.client.close()
  }
})
