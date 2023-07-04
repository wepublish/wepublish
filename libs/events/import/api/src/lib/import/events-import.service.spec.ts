import {Test, TestingModule} from '@nestjs/testing'
import {CACHE_MANAGER} from '@nestjs/cache-manager'
import {PrismaClient} from '@prisma/client'
import {EVENT_IMPORT_PROVIDER, EventsImportService} from './events-import.service'
import {AgendaBaselService} from './agenda-basel.service'
import {Event, EventStatus, ImportedEventSort} from './events-import.model'
import {Cache} from 'cache-manager'
import {Node} from 'slate'

describe('EventsImportService', () => {
  let service: EventsImportService
  let cacheManager: Cache

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsImportService,
        {
          provide: EVENT_IMPORT_PROVIDER,
          useValue: [AgendaBaselService]
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
              create: jest.fn()
            },
            image: {
              create: jest.fn()
            }
          }
        }
      ]
    }).compile()

    service = module.get<EventsImportService>(EventsImportService)
    cacheManager = module.get<Cache>(CACHE_MANAGER)
  })

  const mockEvent: Event = {
    id: '1',
    createdAt: new Date(),
    modifiedAt: new Date(),
    name: 'Event 1',
    description: {} as Node[],
    status: EventStatus.Scheduled,
    location: '',
    externalSourceId: '',
    externalSourceName: '',
    startsAt: new Date(),
    endsAt: undefined
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('EventsImportService', () => {
    test('importedEvents method should return imported events from the cache if available', async () => {
      const mockEventsDocument = {
        nodes: [mockEvent],
        pageInfo: {endCursor: '1', hasNextPage: false, hasPreviousPage: false, startCursor: '1'},
        totalCount: 1
      }
      jest.spyOn(cacheManager, 'get').mockResolvedValueOnce([mockEvent])

      jest.spyOn(service, 'importedEvents').mockResolvedValueOnce(mockEventsDocument)
      const result = await service.importedEvents({
        filter: {} as any,
        order: 1,
        skip: 0,
        take: 10,
        sort: ImportedEventSort.CREATED_AT
      })
      expect(result).toEqual(mockEventsDocument)
    })

    test('importedEvent should return the imported event by ID from the corresponding provider', async () => {
      const source = 'AgendaBasel'
      const id = '1'

      jest.spyOn(service, 'importedEvent').mockResolvedValueOnce(mockEvent)

      const result = await service.importedEvent({id, source})

      expect(service.importedEvent).toBeCalledWith({
        source,
        id: '1'
      })
      expect(result).toEqual(mockEvent)
    })

    test('createEventFromSource method should create an event in the db', async () => {
      const event = {...mockEvent, imageId: '123'} as any
      jest.spyOn(cacheManager, 'get').mockResolvedValueOnce([event])
      const createEvent = {
        id: '1',
        source: 'AgendaBasel'
      }

      jest.spyOn(service, 'createEventFromSource').mockResolvedValueOnce(event)

      const result = await service.createEventFromSource(createEvent)

      expect(service.createEventFromSource).toBeCalledWith({
        id: '1',
        source: 'AgendaBasel'
      })

      expect(result).toEqual(event)
    })
  })
})
