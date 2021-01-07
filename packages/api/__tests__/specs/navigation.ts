import {MongoDBAdapter} from '@wepublish/api-db-mongodb'
import {ApolloServerTestClient} from 'apollo-server-testing'
import {createGraphQLTestClientWithMongoDB} from '../utility'
import {
  NavigationInput,
  CreateNavigation,
  PageInput,
  CreatePage,
  ArticleInput,
  CreateArticle,
  NavigationList,
  Navigation,
  UpdateNavigation,
  DeleteNavigation
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
    socialMediaAuthorIDs: [],
    blocks: []
  }
  const articleRes = await mutate({
    mutation: CreateArticle,
    variables: {
      input: articleInput
    }
  })
  articleID = articleRes.data?.createArticle?.id
})

describe('Navigations', () => {
  describe('can be created/edited/deleted:', () => {
    const ids: string[] = []
    beforeEach(async () => {
      const {mutate} = testClientPrivate
      const input: NavigationInput = {
        name: `Test ${ids.length}`,
        key: `TestKey${ids.length}`,
        links: [
          {external: {label: 'External Label', url: 'linkurl.ch/'}},
          {article: {label: 'Article Label', articleID: 'articleID123'}},
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
          {external: {label: 'External Label', url: 'linkurl.ch/'}},
          {article: {label: 'Article Label', articleID: articleID}},
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
            links: expect.any(Array)
          }
        }
      })

      const links = res.data?.createNavigation?.links
      expect(links).toHaveLength(3)
      //external link
      expect(links[0].label).toBe('External Label')
      expect(links[0].url).toBe('linkurl.ch/')
      //article
      expect(links[1].label).toBe('Article Label')
      expect(links[1].article.id).toBe(articleID)
      //page
      expect(links[2].label).toBe('Page Label')
      expect(links[2].page.id).toBe(pageID)

      ids.unshift(res.data?.createNavigation?.id)
    })

    test('can be read in list', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: NavigationList
      })
      expect(res).toMatchSnapshot({
        data: {
          navigations: Array.from({length: ids.length}, () => ({
            id: expect.any(String),
            links: expect.any(Array)
          }))
        }
      })
      expect(res.data?.navigations?.length).toBe(ids.length)
    })

    test('can be read by id', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: Navigation,
        variables: {
          id: ids[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          navigation: {
            id: expect.any(String)
          }
        }
      })
      expect(res.data?.navigation.id).toBe(ids[0])
    })

    test('can be updated', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: UpdateNavigation,
        variables: {
          input: {
            name: 'Updated Navigation Name',
            key: 'updatedNavKey321',
            links: [
              {external: {label: 'New External Label', url: 'newlinkurl.ch/'}},
              {article: {label: 'New Article Label', articleID: 'newID'}},
              {page: {label: 'New Page Label', pageID: 'newID'}}
            ]
          },
          id: ids[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          updateNavigation: {
            id: expect.any(String)
          }
        }
      })
      const updatedNav = res.data?.updateNavigation
      expect(updatedNav.id).toBe(ids[0])
      expect(updatedNav.name).toBe('Updated Navigation Name')
      expect(updatedNav.key).toBe('updatedNavKey321')
    })

    test('can be deleted', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: DeleteNavigation,
        variables: {
          id: ids[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          deleteNavigation: expect.any(String)
        }
      })
      expect(res.data?.deleteNavigation).toBe(ids[0])
      ids.shift()
    })
  })
})

afterAll(async () => {
  if (dbAdapter) {
    await dbAdapter.db.dropDatabase()
    await dbAdapter.client.close()
  }
})
