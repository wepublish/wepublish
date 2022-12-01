import {ApolloServerTestClient} from 'apollo-server-testing'
import {CreateEvent, CreateTag, TagType, DeleteEvent, Event, EventList} from '../api/private'

import {createGraphQLTestClientWithPrisma, generateRandomString} from '../utility'
import {UpdateEvent} from '../api/private/index'

let testClientPrivate: ApolloServerTestClient

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma()
    testClientPrivate = setupClient.testClientPrivate
  } catch (error) {
    console.log('Error', error)
    throw new Error('Error during test setup')
  }
})

describe('Events', () => {
  describe('create', () => {
    test('can be created', async () => {
      const {mutate} = testClientPrivate

      const tagRes = await mutate({
        mutation: CreateTag,
        variables: {
          tag: generateRandomString(),
          type: TagType.Event
        }
      })

      const res = await mutate({
        mutation: CreateEvent,
        variables: {
          name: 'Test Event',
          description: [
            {
              type: 'heading-one',
              children: [
                {
                  text: 'Event Bio Heading'
                }
              ]
            },
            {
              type: 'paragraph',
              children: [
                {
                  text: 'event bio text'
                }
              ]
            }
          ],
          location: `Foobar Street 5
  8015 Barfoo City`,
          startsAt: '2020-11-25T20:00:00.000Z',
          endsAt: '2020-11-25T22:00:00.000Z',
          tagIds: [tagRes.data.createTag.id]
        }
      })

      expect(res).toMatchSnapshot({
        data: {
          createEvent: {
            id: expect.any(String),
            tags: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                tag: expect.any(String)
              })
            ])
          }
        }
      })
    })

    test('can be created with bare minimum', async () => {
      const {mutate} = testClientPrivate

      const res = await mutate({
        mutation: CreateEvent,
        variables: {
          name: 'Test Event',
          startsAt: '2020-11-25T20:00:00.000Z'
        }
      })

      expect(res).toMatchSnapshot({
        data: {
          createEvent: {
            id: expect.any(String)
          }
        }
      })
    })
  })

  describe('update', () => {
    test('can be updated', async () => {
      const {mutate} = testClientPrivate

      const createRes = await mutate({
        mutation: CreateEvent,
        variables: {
          name: 'Test Event',
          startsAt: '2020-11-25T20:00:00.000Z'
        }
      })

      const res = await mutate({
        mutation: UpdateEvent,
        variables: {
          id: createRes.data.createEvent.id,
          name: 'Test Event2'
        }
      })

      expect(res.data.updateEvent.name).toEqual('Test Event2')
    })

    test('tagIds should not be updated if not specified', async () => {
      const {mutate} = testClientPrivate

      const tag1 = await mutate({
        mutation: CreateTag,
        variables: {
          tag: generateRandomString(),
          type: TagType.Event
        }
      })

      const createRes = await mutate({
        mutation: CreateEvent,
        variables: {
          name: 'Test Event',
          startsAt: '2020-11-25T20:00:00.000Z',
          tagIds: [tag1.data.createTag.id]
        }
      })

      const res = await mutate({
        mutation: UpdateEvent,
        variables: {
          id: createRes.data.createEvent.id,
          name: 'Test Event2'
        }
      })

      expect(res.data.updateEvent.tags).toHaveLength(1)
    })

    test('tagIds should be updated if specified', async () => {
      const {mutate} = testClientPrivate

      const [tag1, tag2, tag3, tag4] = await Promise.all([
        mutate({
          mutation: CreateTag,
          variables: {
            tag: generateRandomString(),
            type: TagType.Event
          }
        }),
        mutate({
          mutation: CreateTag,
          variables: {
            tag: generateRandomString(),
            type: TagType.Event
          }
        }),
        mutate({
          mutation: CreateTag,
          variables: {
            tag: generateRandomString(),
            type: TagType.Event
          }
        }),
        mutate({
          mutation: CreateTag,
          variables: {
            tag: generateRandomString(),
            type: TagType.Event
          }
        })
      ])

      const createRes = await mutate({
        mutation: CreateEvent,
        variables: {
          name: 'Test Event',
          startsAt: '2020-11-25T20:00:00.000Z',
          tagIds: [tag1.data.createTag.id, tag3.data.createTag.id]
        }
      })

      const res = await mutate({
        mutation: UpdateEvent,
        variables: {
          id: createRes.data.createEvent.id,
          name: 'Test Event2',
          tagIds: [tag2.data.createTag.id, tag3.data.createTag.id, tag4.data.createTag.id]
        }
      })

      expect(res.data.updateEvent.tags).toHaveLength(3)
    })
  })

  describe('delete', () => {
    test('can be deleted', async () => {
      const {mutate, query} = testClientPrivate

      const createRes = await mutate({
        mutation: CreateEvent,
        variables: {
          name: 'Test Event',
          startsAt: '2020-11-25T20:00:00.000Z'
        }
      })

      const deleteRes = await mutate({
        mutation: DeleteEvent,
        variables: {
          id: createRes.data.createEvent.id
        }
      })

      const res = await query({
        query: Event,
        variables: {
          id: createRes.data.createEvent.id
        }
      })

      expect(deleteRes.data.deleteEvent.id).toEqual(createRes.data.createEvent.id)
      expect(res.data.event).toBeNull()
    })
  })

  describe('query', () => {
    test('can query a single event', async () => {
      const {mutate, query} = testClientPrivate

      const createRes = await mutate({
        mutation: CreateEvent,
        variables: {
          name: 'Test Event',
          startsAt: '2020-11-25T20:00:00.000Z'
        }
      })

      const res = await query({
        query: Event,
        variables: {
          id: createRes.data.createEvent.id
        }
      })

      expect(res.data.event.id).toEqual(createRes.data.createEvent.id)
    })

    test('can query a list of events', async () => {
      const {mutate, query} = testClientPrivate

      await Promise.all([
        mutate({
          mutation: CreateEvent,
          variables: {
            name: 'Test Event',
            startsAt: '2020-11-25T20:00:00.000Z'
          }
        }),
        mutate({
          mutation: CreateEvent,
          variables: {
            name: 'Test Event',
            startsAt: '2020-11-25T20:00:00.000Z'
          }
        })
      ])

      const res = await query({
        query: EventList
      })

      expect(res.data.events.totalCount).toBeGreaterThanOrEqual(2)
    })

    test('can query a list of events with a specific tag', async () => {
      const {mutate, query} = testClientPrivate

      const tagRes = await mutate({
        mutation: CreateTag,
        variables: {
          tag: generateRandomString(),
          type: TagType.Event
        }
      })

      await Promise.all([
        mutate({
          mutation: CreateEvent,
          variables: {
            name: 'Test Event',
            startsAt: '2020-11-25T20:00:00.000Z'
          }
        }),
        mutate({
          mutation: CreateEvent,
          variables: {
            name: 'Test Event',
            startsAt: '2020-11-25T20:00:00.000Z',
            tagIds: [tagRes.data.createTag.id]
          }
        })
      ])

      const res = await query({
        query: EventList,
        variables: {
          filter: {
            tags: [tagRes.data.createTag.id]
          }
        }
      })

      expect(res.data.events.totalCount).toBe(1)
    })

    test('can query a list of events that are open', async () => {
      const {mutate, query} = testClientPrivate

      const tagRes = await mutate({
        mutation: CreateTag,
        variables: {
          tag: generateRandomString(),
          type: TagType.Event
        }
      })

      const today = new Date()
      const future = new Date(today)
      future.setDate(future.getDate() + 5000)
      const past = new Date(today)
      past.setDate(past.getDate() - 5000)

      await Promise.all([
        mutate({
          mutation: CreateEvent,
          variables: {
            name: 'Test Event',
            startsAt: future.toISOString(),
            tagIds: [tagRes.data.createTag.id]
          }
        }),
        mutate({
          mutation: CreateEvent,
          variables: {
            name: 'Test Event',
            startsAt: future.toISOString(),
            tagIds: [tagRes.data.createTag.id]
          }
        }),
        mutate({
          mutation: CreateEvent,
          variables: {
            name: 'Test Event',
            startsAt: past.toISOString(),
            tagIds: [tagRes.data.createTag.id]
          }
        })
      ])

      const res = await query({
        query: EventList,
        variables: {
          filter: {
            upcomingOnly: true,
            tags: [tagRes.data.createTag.id]
          }
        }
      })

      expect(res.data.events.totalCount).toBe(2)
    })
  })
})
