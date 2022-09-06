import {ApolloServerTestClient} from 'apollo-server-testing'
import {
  ArticleInput,
  CreateArticle,
  CreateNavigation,
  CreatePage,
  DeleteNavigation,
  Navigation,
  NavigationInput,
  NavigationList,
  PageInput,
  UpdateNavigation
} from '../api/private'
import {createGraphQLTestClientWithPrisma, generateRandomString} from '../utility'

let testClientPrivate: ApolloServerTestClient
let pageID: string
let articleID: string

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma()
    testClientPrivate = setupClient.testClientPrivate
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

    beforeAll(async () => {
      const {mutate} = testClientPrivate
      const input: NavigationInput = {
        name: `Test ${ids.length}`,
        key: generateRandomString(),
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

      ids.unshift(res.data.createNavigation?.id)
    })

    test('can be created', async () => {
      const key = generateRandomString()
      const {mutate} = testClientPrivate
      const input: NavigationInput = {
        name: 'Create Navigation Name',
        key: key,
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
            key: expect.any(String),
            links: expect.any(Array)
          }
        }
      })

      const links = res.data.createNavigation?.links
      expect(links).toHaveLength(3)
      // external link
      expect(links[0].label).toBe('External Label')
      expect(links[0].url).toBe('linkurl.ch/')
      // article
      expect(links[1].label).toBe('Article Label')
      expect(links[1].article.id).toBe(articleID)
      // page
      expect(links[2].label).toBe('Page Label')
      expect(links[2].page.id).toBe(pageID)

      ids.unshift(res.data.createNavigation?.id)
    })

    test('can be read in list', async () => {
      const {query} = testClientPrivate
      const res = await query({
        query: NavigationList
      })

      expect(res.data.navigations).not.toHaveLength(0)
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
            id: expect.any(String),
            key: expect.any(String),
            links: expect.any(Array)
          }
        }
      })

      expect(res.data.navigation.id).toBe(ids[0])
    })

    test('can be updated', async () => {
      const {mutate} = testClientPrivate
      const res = await mutate({
        mutation: UpdateNavigation,
        variables: {
          input: {
            name: 'Updated Navigation Name',
            key: generateRandomString(),
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
            id: expect.any(String),
            key: expect.any(String)
          }
        }
      })

      const updatedNav = res.data.updateNavigation
      expect(updatedNav.id).toBe(ids[0])
      expect(updatedNav.name).toBe('Updated Navigation Name')
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
          deleteNavigation: expect.any(Object)
        }
      })

      expect(res.data.deleteNavigation.id).toBe(ids[0])
      ids.shift()
    })
  })
})
