import {ApolloServer} from 'apollo-server-express'
import {
  Author,
  AuthorInput,
  AuthorList,
  CreateAuthor,
  DeleteAuthor,
  UpdateAuthor
} from '../api/private'

import {createGraphQLTestClientWithPrisma, generateRandomString} from '../utility'

let testServerPrivate: ApolloServer

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma()
    testServerPrivate = setupClient.testServerPrivate
  } catch (error) {
    console.log('Error', error)
    throw new Error('Error during test setup')
  }
})

describe('Authors', () => {
  describe('can be created/edited/deleted:', () => {
    const authorIds: string[] = []
    beforeAll(async () => {
      const authorInput: AuthorInput = {
        name: 'JRR Tolkien',
        slug: generateRandomString(),
        links: [
          {title: 'link 1', url: 'www.link1.ch'},
          {title: 'link 2', url: 'www.link2.ch'}
        ],
        bio: [
          {
            type: 'heading-one',
            children: [
              {
                text: 'Test Bio'
              }
            ]
          },
          {
            type: 'paragraph',
            children: [
              {
                text: 'bio text 😀'
              }
            ]
          }
        ]
      }
      const res = await testServerPrivate.executeOperation({
        query: CreateAuthor,
        variables: {
          input: authorInput
        }
      })
      authorIds.unshift(res.data?.createAuthor.id)
    })

    test('can be created', async () => {
      const authorInput: AuthorInput = {
        name: 'John Grisham',
        slug: generateRandomString(),
        links: [
          {title: 'link 1', url: 'www.link1.ch'},
          {title: 'link 2', url: 'www.link2.ch'}
        ],
        bio: [
          {
            type: 'heading-one',
            children: [
              {
                text: 'Author Bio Heading'
              }
            ]
          },
          {
            type: 'paragraph',
            children: [
              {
                text: 'author bio text'
              }
            ]
          }
        ]
      }
      const res = await testServerPrivate.executeOperation({
        query: CreateAuthor,
        variables: {
          input: authorInput
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          createAuthor: {
            id: expect.any(String),
            slug: expect.any(String)
          }
        }
      })
      authorIds.unshift(res.data?.createAuthor.id)
    })

    test('can be read in list', async () => {
      const res = await testServerPrivate.executeOperation({
        query: AuthorList,
        variables: {
          take: 100
        }
      })

      expect(res.data?.authors.nodes).not.toHaveLength(0)
    })

    test('can be filtered by case insenstivie name', async () => {
      const name = 'Foo'.toUpperCase()

      const authorInput: AuthorInput = {
        name,
        slug: generateRandomString()
      }

      await testServerPrivate.executeOperation({
        query: CreateAuthor,
        variables: {
          input: authorInput
        }
      })

      const res = await testServerPrivate.executeOperation({
        query: AuthorList,
        variables: {
          take: 1,
          name: name.toLocaleLowerCase()
        }
      })

      expect(res.data?.authors.nodes).toHaveLength(1)
    })

    test('can be filtered by partial name', async () => {
      const name = 'Foo Bar'

      const authorInput: AuthorInput = {
        name,
        slug: generateRandomString()
      }

      await testServerPrivate.executeOperation({
        query: CreateAuthor,
        variables: {
          input: authorInput
        }
      })

      const res = await testServerPrivate.executeOperation({
        query: AuthorList,
        variables: {
          take: 1,
          name: name.substring(0, name.length - 1)
        }
      })

      expect(res.data?.authors.nodes).toHaveLength(1)
    })

    test('can be read by id', async () => {
      const res = await testServerPrivate.executeOperation({
        query: Author,
        variables: {
          id: authorIds[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          author: {
            id: expect.any(String),
            slug: expect.any(String)
          }
        }
      })
    })

    test('can be updated', async () => {
      const res = await testServerPrivate.executeOperation({
        query: UpdateAuthor,
        variables: {
          input: {
            name: 'Jane Austen',
            slug: generateRandomString(),
            links: [{title: 'homepage', url: 'www.j-a.com'}]
          },
          id: authorIds[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          updateAuthor: {
            id: expect.any(String),
            slug: expect.any(String)
          }
        }
      })
    })

    test('can be deleted', async () => {
      const res = await testServerPrivate.executeOperation({
        query: DeleteAuthor,
        variables: {
          id: authorIds[0]
        }
      })
      expect(res).toMatchSnapshot({
        data: {
          deleteAuthor: expect.any(Object)
        }
      })
      expect(res.data?.deleteAuthor.id).toBe(authorIds[0])
      authorIds.shift()
    })
  })
})
