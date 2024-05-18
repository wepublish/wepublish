import {ApolloServer} from 'apollo-server-express'
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

let testServerPrivate: ApolloServer
let pageID: string
let articleID: string

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma()
    testServerPrivate = setupClient.testServerPrivate
  } catch (error) {
    console.log('Error', error)
    throw new Error('Error during test setup')
  }

  const pageInput: PageInput = {
    title: 'Testing Page',
    slug: 'testing-page',
    tags: [],
    properties: [],
    blocks: []
  }

  const pageRes = await testServerPrivate.executeOperation({
    query: CreatePage,
    variables: {
      input: pageInput
    }
  })
  pageID = pageRes.data?.createPage?.id

  const articleInput: ArticleInput = {
    title: 'Article Title',
    slug: 'article-slug',
    shared: false,
    hidden: false,
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

  const articleRes = await testServerPrivate.executeOperation({
    query: CreateArticle,
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
      const input: NavigationInput = {
        name: `Test ${ids.length}`,
        key: generateRandomString(),
        links: [
          {external: {label: 'External Label', url: 'linkurl.ch/'}},
          {article: {label: 'Article Label', articleID: 'articleID123'}},
          {page: {label: 'Page Label', pageID: 'pageID123'}}
        ]
      }

      const res = await testServerPrivate.executeOperation({
        query: CreateNavigation,
        variables: {
          input
        }
      })

      ids.unshift(res.data?.createNavigation?.id)
    })

    test('can be created', async () => {
      const key = generateRandomString()
      const input: NavigationInput = {
        name: 'Create Navigation Name',
        key,
        links: [
          {external: {label: 'External Label', url: 'linkurl.ch/'}},
          {article: {label: 'Article Label', articleID}},
          {page: {label: 'Page Label', pageID}}
        ]
      }

      const res = await testServerPrivate.executeOperation({
        query: CreateNavigation,
        variables: {
          input
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
      const res = await testServerPrivate.executeOperation({
        query: NavigationList
      })

      expect(res.data?.navigations).not.toHaveLength(0)
    })

    test('can be read by id', async () => {
      const res = await testServerPrivate.executeOperation({
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

      expect(res.data?.navigation.id).toBe(ids[0])
    })

    test('can be updated', async () => {
      const articleInput: ArticleInput = {
        title: '',
        slug: generateRandomString(),
        shared: false,
        hidden: false,
        tags: [],
        breaking: true,
        lead: '',
        preTitle: '',
        hideAuthor: false,
        properties: [],
        authorIDs: [],
        socialMediaTitle: '',
        socialMediaAuthorIDs: [],
        socialMediaDescription: '',
        socialMediaImageID: null,
        blocks: []
      }
      const articleRes = await testServerPrivate.executeOperation({
        query: CreateArticle,
        variables: {
          input: articleInput
        }
      })

      const pageInput: PageInput = {
        title: '',
        slug: generateRandomString(),
        tags: [],
        properties: [],
        blocks: []
      }
      const pageRes = await testServerPrivate.executeOperation({
        query: CreatePage,
        variables: {
          input: pageInput
        }
      })

      const res = await testServerPrivate.executeOperation({
        query: UpdateNavigation,
        variables: {
          input: {
            name: 'Updated Navigation Name',
            key: generateRandomString(),
            links: [
              {external: {label: 'New External Label', url: 'newlinkurl.ch/'}},
              {article: {label: 'New Article Label', articleID: articleRes.data?.createArticle.id}},
              {page: {label: 'New Page Label', pageID: pageRes.data?.createPage.id}}
            ]
          },
          id: ids[0]
        }
      })

      expect(res).toMatchSnapshot({
        data: {
          updateNavigation: {
            id: expect.any(String),
            key: expect.any(String),
            links: expect.arrayContaining([
              expect.objectContaining({
                label: 'New External Label',
                url: 'newlinkurl.ch/'
              }),
              expect.objectContaining({
                label: 'New Page Label',
                page: expect.any(Object)
              }),
              expect.objectContaining({
                label: 'New Article Label',
                article: expect.any(Object)
              })
            ])
          }
        }
      })

      const updatedNav = res.data?.updateNavigation
      expect(updatedNav.id).toBe(ids[0])
      expect(updatedNav.name).toBe('Updated Navigation Name')
    })

    test('can be deleted', async () => {
      const res = await testServerPrivate.executeOperation({
        query: DeleteNavigation,
        variables: {
          id: ids[0]
        }
      })

      expect(res).toMatchSnapshot({
        data: {
          deleteNavigation: expect.any(Object)
        }
      })

      expect(res.data?.deleteNavigation.id).toBe(ids[0])
      ids.shift()
    })
  })
})
