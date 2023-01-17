import {CreateEvent, CreateTag, TagType, DeleteEvent, Event, EventList} from '../api/private'

import {createGraphQLTestClientWithPrisma, generateRandomString} from '../utility'
import {UpdateEvent} from '../api/private/index'
import {ApolloServer} from 'apollo-server-express'

let testClientPrivate: ApolloServer
let testClientPublic: ApolloServer

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma()
    testClientPrivate = setupClient.testServerPrivate
    testClientPublic = setupClient.testServerPublic
  } catch (error) {
    console.log('Error', error)
    throw new Error('Error during test setup')
  }
})

describe('Events', () => {
  describe('create', () => {
    test('can be created', async () => {
      const tagRes = await testClientPrivate.executeOperation({
        query: CreateTag,
        variables: {
          tag: generateRandomString(),
          type: TagType.Event
        }
      })

      const res = await testClientPrivate.executeOperation({
        query: CreateEvent,
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
      const res = await testClientPrivate.executeOperation({
        query: CreateEvent,
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

    test('can not be created with endsAt before startsAt', async () => {
      const res = await testClientPrivate.executeOperation({
        query: CreateEvent,
        variables: {
          name: 'Test Event',
          startsAt: '2020-11-25T20:00:00.000Z',
          endsAt: '2020-11-24T20:00:00.000Z'
        }
      })

      expect(res).toMatchSnapshot()
    })
  })

  describe('update', () => {
    test('can be updated', async () => {
      const createRes = await testClientPrivate.executeOperation({
        query: CreateEvent,
        variables: {
          name: 'Test Event',
          startsAt: '2020-11-25T20:00:00.000Z'
        }
      })

      const res = await testClientPrivate.executeOperation({
        query: UpdateEvent,
        variables: {
          id: createRes.data.createEvent.id,
          name: 'Test Event2'
        }
      })

      expect(res.data.updateEvent.name).toEqual('Test Event2')
    })

    test('tagIds should not be updated if not specified', async () => {
      const tag1 = await testClientPrivate.executeOperation({
        query: CreateTag,
        variables: {
          tag: generateRandomString(),
          type: TagType.Event
        }
      })

      const createRes = await testClientPrivate.executeOperation({
        query: CreateEvent,
        variables: {
          name: 'Test Event',
          startsAt: '2020-11-25T20:00:00.000Z',
          tagIds: [tag1.data.createTag.id]
        }
      })

      const res = await testClientPrivate.executeOperation({
        query: UpdateEvent,
        variables: {
          id: createRes.data.createEvent.id,
          name: 'Test Event2'
        }
      })

      expect(res.data.updateEvent.tags).toHaveLength(1)
    })

    test('tagIds should be updated if specified', async () => {
      const [tag1, tag2, tag3, tag4] = await Promise.all([
        testClientPrivate.executeOperation({
          query: CreateTag,
          variables: {
            tag: generateRandomString(),
            type: TagType.Event
          }
        }),
        testClientPrivate.executeOperation({
          query: CreateTag,
          variables: {
            tag: generateRandomString(),
            type: TagType.Event
          }
        }),
        testClientPrivate.executeOperation({
          query: CreateTag,
          variables: {
            tag: generateRandomString(),
            type: TagType.Event
          }
        }),
        testClientPrivate.executeOperation({
          query: CreateTag,
          variables: {
            tag: generateRandomString(),
            type: TagType.Event
          }
        })
      ])

      const createRes = await testClientPrivate.executeOperation({
        query: CreateEvent,
        variables: {
          name: 'Test Event',
          startsAt: '2020-11-25T20:00:00.000Z',
          tagIds: [tag1.data.createTag.id, tag3.data.createTag.id]
        }
      })

      const res = await testClientPrivate.executeOperation({
        query: UpdateEvent,
        variables: {
          id: createRes.data.createEvent.id,
          name: 'Test Event2',
          tagIds: [tag2.data.createTag.id, tag3.data.createTag.id, tag4.data.createTag.id]
        }
      })

      expect(res.data.updateEvent.tags).toHaveLength(3)
    })

    test('can not be updated with endsAt before startsAt', async () => {
      const createRes = await testClientPrivate.executeOperation({
        query: CreateEvent,
        variables: {
          name: 'Test Event',
          startsAt: '2020-11-25T20:00:00.000Z'
        }
      })

      const res = await testClientPrivate.executeOperation({
        query: UpdateEvent,
        variables: {
          id: createRes.data.createEvent.id,
          endsAt: '2020-11-24T20:00:00.000Z'
        }
      })

      const res2 = await testClientPrivate.executeOperation({
        query: UpdateEvent,
        variables: {
          id: createRes.data.createEvent.id,
          startsAt: '2020-11-27T20:00:00.000Z',
          endsAt: '2020-11-26T20:00:00.000Z'
        }
      })

      expect(res).toMatchSnapshot()
      expect(res2).toMatchSnapshot()
    })
  })

  describe('delete', () => {
    test('can be deleted', async () => {
      const createRes = await testClientPrivate.executeOperation({
        query: CreateEvent,
        variables: {
          name: 'Test Event',
          startsAt: '2020-11-25T20:00:00.000Z'
        }
      })

      const deleteRes = await testClientPrivate.executeOperation({
        query: DeleteEvent,
        variables: {
          id: createRes.data.createEvent.id
        }
      })

      const res = await testClientPrivate.executeOperation({
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
    describe('private', () => {
      test('can query a single event', async () => {
        const createRes = await testClientPrivate.executeOperation({
          query: CreateEvent,
          variables: {
            name: 'Test Event',
            startsAt: '2020-11-25T20:00:00.000Z'
          }
        })

        const res = await testClientPrivate.executeOperation({
          query: Event,
          variables: {
            id: createRes.data.createEvent.id
          }
        })

        expect(res.data.event.id).toEqual(createRes.data.createEvent.id)
      })

      test('can query a list of events', async () => {
        await Promise.all([
          testClientPrivate.executeOperation({
            query: CreateEvent,
            variables: {
              name: 'Test Event',
              startsAt: '2020-11-25T20:00:00.000Z'
            }
          }),
          testClientPrivate.executeOperation({
            query: CreateEvent,
            variables: {
              name: 'Test Event',
              startsAt: '2020-11-25T20:00:00.000Z'
            }
          })
        ])

        const res = await testClientPrivate.executeOperation({
          query: EventList
        })

        expect(res.data.events.totalCount).toBeGreaterThanOrEqual(2)
      })

      test('can query a list of events with a specific tag', async () => {
        const tagRes = await testClientPrivate.executeOperation({
          query: CreateTag,
          variables: {
            tag: generateRandomString(),
            type: TagType.Event
          }
        })

        await Promise.all([
          testClientPrivate.executeOperation({
            query: CreateEvent,
            variables: {
              name: 'Test Event',
              startsAt: '2020-11-25T20:00:00.000Z'
            }
          }),
          testClientPrivate.executeOperation({
            query: CreateEvent,
            variables: {
              name: 'Test Event',
              startsAt: '2020-11-25T20:00:00.000Z',
              tagIds: [tagRes.data.createTag.id]
            }
          })
        ])

        const res = await testClientPrivate.executeOperation({
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
        const tagRes = await testClientPrivate.executeOperation({
          query: CreateTag,
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
          testClientPrivate.executeOperation({
            query: CreateEvent,
            variables: {
              name: 'Test Event',
              startsAt: future.toISOString(),
              tagIds: [tagRes.data.createTag.id]
            }
          }),
          testClientPrivate.executeOperation({
            query: CreateEvent,
            variables: {
              name: 'Test Event',
              startsAt: future.toISOString(),
              tagIds: [tagRes.data.createTag.id]
            }
          }),
          testClientPrivate.executeOperation({
            query: CreateEvent,
            variables: {
              name: 'Test Event',
              startsAt: past.toISOString(),
              tagIds: [tagRes.data.createTag.id]
            }
          })
        ])

        const res = await testClientPrivate.executeOperation({
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

    describe('public', () => {
      test('can query a single event', async () => {
        const createRes = await testClientPrivate.executeOperation({
          query: CreateEvent,
          variables: {
            name: 'Test Event',
            startsAt: '2020-11-25T20:00:00.000Z'
          }
        })

        const res = await testClientPublic.executeOperation({
          query: Event,
          variables: {
            id: createRes.data.createEvent.id
          }
        })

        expect(res.data.event.id).toEqual(createRes.data.createEvent.id)
      })

      test('can query a list of events', async () => {
        await Promise.all([
          testClientPrivate.executeOperation({
            query: CreateEvent,
            variables: {
              name: 'Test Event',
              startsAt: '2020-11-25T20:00:00.000Z'
            }
          }),
          testClientPrivate.executeOperation({
            query: CreateEvent,
            variables: {
              name: 'Test Event',
              startsAt: '2020-11-25T20:00:00.000Z'
            }
          })
        ])

        const res = await testClientPublic.executeOperation({
          query: EventList
        })

        expect(res.data.events.totalCount).toBeGreaterThanOrEqual(2)
      })

      test('can query a list of events with a specific tag', async () => {
        const tagRes = await testClientPrivate.executeOperation({
          query: CreateTag,
          variables: {
            tag: generateRandomString(),
            type: TagType.Event
          }
        })

        await Promise.all([
          testClientPrivate.executeOperation({
            query: CreateEvent,
            variables: {
              name: 'Test Event',
              startsAt: '2020-11-25T20:00:00.000Z'
            }
          }),
          testClientPrivate.executeOperation({
            query: CreateEvent,
            variables: {
              name: 'Test Event',
              startsAt: '2020-11-25T20:00:00.000Z',
              tagIds: [tagRes.data.createTag.id]
            }
          })
        ])

        const res = await testClientPublic.executeOperation({
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
        const tagRes = await testClientPrivate.executeOperation({
          query: CreateTag,
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
          testClientPrivate.executeOperation({
            query: CreateEvent,
            variables: {
              name: 'Test Event',
              startsAt: future.toISOString(),
              tagIds: [tagRes.data.createTag.id]
            }
          }),
          testClientPrivate.executeOperation({
            query: CreateEvent,
            variables: {
              name: 'Test Event',
              startsAt: future.toISOString(),
              tagIds: [tagRes.data.createTag.id]
            }
          }),
          testClientPrivate.executeOperation({
            query: CreateEvent,
            variables: {
              name: 'Test Event',
              startsAt: past.toISOString(),
              tagIds: [tagRes.data.createTag.id]
            }
          })
        ])

        const res = await testClientPublic.executeOperation({
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
})
