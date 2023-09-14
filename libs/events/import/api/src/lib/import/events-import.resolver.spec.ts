import {Test, TestingModule} from '@nestjs/testing'
import * as crypto from 'crypto'
import {htmlToSlate} from 'slate-serializers'
import {EventsImportResolver} from './events-import.resolver'
import {EVENT_IMPORT_PROVIDER, EventsImportService} from './events-import.service'
import {Event, ImportedEventsDocument, EventStatus, ImportedEventSort} from './events-import.model'
import {CACHE_MANAGER} from '@nestjs/cache-manager'
import {PrismaClient} from '@prisma/client'
import {MediaAdapterService} from '@wepublish/image/api'
import {Node} from 'slate'

export const generateRandomString = () => crypto.randomBytes(20).toString('hex')

export const mockImportableEvents: Event[] = [
  {
    id: '123',
    createdAt: new Date(),
    modifiedAt: new Date(),
    name: 'some name',
    description: htmlToSlate('<p>some description</p>') as unknown as Node[],
    status: EventStatus.Scheduled,
    location: 'some location',
    imageUrl: 'some image url',
    externalSourceId: '123456',
    externalSourceName: 'ProviderName',
    startsAt: new Date(),
    endsAt: new Date()
  }
]

export const mockImportableEventsDocument: ImportedEventsDocument = {
  nodes: mockImportableEvents,
  totalCount: mockImportableEvents.length,
  pageInfo: {
    hasPreviousPage: false,
    hasNextPage: false,
    endCursor: '',
    startCursor: ''
  }
}

describe('EventsImportResolver', () => {
  let resolver: EventsImportResolver
  let service: EventsImportService

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsImportService,
        EventsImportResolver,
        {
          provide: EVENT_IMPORT_PROVIDER,
          useValue: jest.fn()
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
        },
        {
          provide: MediaAdapterService,
          useValue: {
            uploadImageFromArrayBuffer: jest.fn()
          }
        }
      ]
    }).compile()

    resolver = module.get<EventsImportResolver>(EventsImportResolver)
    service = module.get<EventsImportService>(EventsImportService)
  })

  test('importedEvents query should call importedEvents method of EventsImportService with the provided arguments', async () => {
    const filter = {}
    const order = 1
    const skip = 0
    const take = 10
    const sort = ImportedEventSort.CREATED_AT

    jest
      .spyOn(service, 'importedEvents')
      .mockReturnValueOnce(Promise.resolve(mockImportableEventsDocument))

    expect(resolver.importedEvents(filter, order, skip, take, sort)).resolves.toEqual(
      mockImportableEventsDocument
    )
    expect(service.importedEvents).toHaveBeenCalledWith({filter, order, skip, take, sort})
  })

  test('importedEvent query should call importedEvent method of EventsImportService with the provided filter', async () => {
    const filter = {id: 'some-id', source: 'AgendaBasel'}

    jest
      .spyOn(service, 'importedEvent')
      .mockReturnValueOnce(Promise.resolve(mockImportableEvents[0]))

    expect(resolver.importedEvent(filter)).resolves.toEqual(mockImportableEvents[0])
    expect(service.importedEvent).toHaveBeenCalledWith(filter)
  })

  test('importedEventsIds query should call importedEvent method of EventsImportService', async () => {
    jest
      .spyOn(service, 'importedEventsIds')
      .mockReturnValueOnce(Promise.resolve([mockImportableEvents[0].externalSourceId]))

    expect(resolver.importedEventsIds()).resolves.toEqual([
      mockImportableEvents[0].externalSourceId
    ])
    expect(service.importedEventsIds).toHaveBeenCalledWith()
  })

  test('createEventFromSource mutation should call createEventFromSource method of EventsImportService with the provided filter', () => {
    const filter = {id: 'some-id', source: 'AgendaBasel'}

    jest.spyOn(service, 'createEventFromSource').mockReturnValueOnce(Promise.resolve('some-id'))

    expect(resolver.createEventFromSource(filter)).resolves.toEqual('some-id')
    expect(service.createEventFromSource).toHaveBeenCalledWith(filter)
  })
})
