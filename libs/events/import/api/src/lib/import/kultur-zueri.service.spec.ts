import {Test, TestingModule} from '@nestjs/testing'
import {CACHE_MANAGER} from '@nestjs/cache-manager'
import {PrismaClient} from '@prisma/client'
import {EVENT_IMPORT_PROVIDER} from './events-import.service'
import {KulturZueriService} from './kultur-zueri.service'
import {Cache} from 'cache-manager'
import {HttpService} from '@nestjs/axios'
import {ImageFetcherService, MediaAdapterService} from '@wepublish/image/api'

describe('KulturZueriService', () => {
  let service: KulturZueriService
  let prismaClient: PrismaClient
  let cacheManager: Cache
  let httpClient: HttpService

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KulturZueriService,
        {
          provide: EVENT_IMPORT_PROVIDER,
          useValue: [KulturZueriService]
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn()
          }
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn()
          }
        },
        {
          provide: PrismaClient,
          useValue: {
            event: {
              create: jest.fn().mockResolvedValue({
                id: 'created-event-id'
              })
            },
            image: {
              create: async (id: any) =>
                await {
                  id
                }
            }
          }
        },
        {
          provide: ImageFetcherService,
          useValue: {
            fetch: jest.fn()
          }
        },
        {
          provide: MediaAdapterService,
          useValue: {
            uploadImageFromArrayBuffer: jest.fn().mockResolvedValue({
              id: 'bar'
            })
          }
        }
      ]
    }).compile()

    service = module.get<KulturZueriService>(KulturZueriService)
    cacheManager = module.get<Cache>(CACHE_MANAGER)
    prismaClient = module.get<PrismaClient>(PrismaClient)
    httpClient = module.get<HttpService>(HttpService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('KulturZueriService', () => {
    test('importedEvents() method returns the correct paginated events.', async () => {
      const importedEvents = await service.importedEvents()

      expect(importedEvents).not.toBeNull()
    })

    test('importedEvent() method returns not found error when searching for a non-existing id', async () => {
      const importedEventParams = {
        id: 'non-existing-event-id'
      }

      await expect(service.importedEvent(importedEventParams)).rejects.toThrowError(
        `Event with id ${importedEventParams.id} not found.`
      )
    })

    test('createEvent() method successfully creates an event and returns the ID.', async () => {
      const importedEvents = await service.importedEvents()

      const createEventParams = {
        id: importedEvents[0].id
      }

      const createdEventId = await service.createEvent(createEventParams)

      expect(createdEventId).toBe('created-event-id')
      expect(prismaClient.event.create).toHaveBeenCalledWith(expect.any(Object))
    })

    test('createEvent() method throws an error when an event with the provided ID is not found.', async () => {
      const createEventParams = {
        id: 'non-existent-event-id'
      }

      await expect(service.createEvent(createEventParams)).rejects.toThrowError(
        `Event with id ${createEventParams.id} not found.`
      )
    })
  })
})
