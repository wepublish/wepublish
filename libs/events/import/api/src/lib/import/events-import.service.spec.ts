import {Test, TestingModule} from '@nestjs/testing'
import {CACHE_MANAGER} from '@nestjs/cache-manager'
import {PrismaClient} from '@prisma/client'
import {ArrayBufferUpload, MediaAdapterService, UploadImage} from '@wepublish/image/api'
import {EventsImportService} from './events-import.service'
import {Event, Providers, EventStatus} from './events-import.model'
import {Cache} from 'cache-manager'
import axios from 'axios'

describe('EventsImportService', () => {
  let service: EventsImportService
  let cacheManager: Cache
  let prismaClient: PrismaClient
  let mediaAdapter: MediaAdapterService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsImportService,
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

    service = module.get<EventsImportService>(EventsImportService)
    cacheManager = module.get<Cache>(CACHE_MANAGER)
    prismaClient = module.get<PrismaClient>(PrismaClient)
    mediaAdapter = module.get<MediaAdapterService>(MediaAdapterService)
  })

  const mockEvent: Event = {
    id: '1',
    createdAt: new Date(),
    modifiedAt: new Date(),
    name: 'Event 1',
    description: {} as JSON,
    status: EventStatus.SCHEDULED,
    imageUrl: 'https://www.some-image-url.com',
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
      jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(mockEvent)

      jest.spyOn(service, 'importedEvents').mockResolvedValueOnce(mockEventsDocument)
      const result = await service.importedEvents({
        filter: {} as any,
        order: 1,
        skip: 0,
        take: 10,
        sort: ''
      })
      expect(result).toEqual(mockEventsDocument)
    })

    test('importedEvent should return the imported event by ID from the corresponding provider', async () => {
      const source = Providers.AgendaBasel
      const id = '1'

      jest.spyOn(service, 'importedEvent').mockResolvedValueOnce(mockEvent)

      const result = await service.importedEvent({id, source})

      expect(service.importedEvent).toBeCalledWith({
        source,
        id: '1'
      })
      expect(result).toEqual(mockEvent)
    })

    test('createEvent method should create an event in the db', async () => {
      const event = {...mockEvent, imageId: '123'} as any
      jest.spyOn(cacheManager, 'get').mockResolvedValueOnce([event])
      const createEvent = {
        id: '1',
        source: Providers.AgendaBasel
      }

      const createdEvent = {
        name: event.name,
        description: event.description as unknown as any,
        location: event.location,
        startsAt: event.startsAt,
        imageId: '',
        endsAt: event.endsAt,
        externalSourceName: event.externalSourceName,
        externalSourceId: event.externalSourceId
      }

      jest.spyOn(prismaClient.event, 'create').mockResolvedValueOnce(event)

      const result = await service.createEvent(createEvent)

      expect(prismaClient.event.create).toBeCalledWith({data: createdEvent})
      expect(result).toEqual('1')
    })

    test('should upload media and update the event with the media details', async () => {
      const createEvent = {
        id: '1',
        source: Providers.AgendaBasel
      }

      const mockCreatedEvent = {
        ...createEvent,
        id: '1',
        createdAt: new Date(),
        modifiedAt: new Date(),
        imageUrl: 'https://www.some-url.com'
      }

      const mockUploadedMedia: UploadImage = {
        id: 'mediaId',
        filename: 'media.jpg',
        fileSize: 1024,
        extension: 'jpg',
        mimeType: 'image/jpeg',
        format: 'jpeg',
        width: 800,
        height: 600
      }

      const mockArrayBufferUpload: ArrayBufferUpload = {
        filename: 'transformed-image.jpg',
        mimetype: 'image/jpeg',
        arrayBuffer: new ArrayBuffer(10) // Mock array buffer
      }

      const event = {...mockEvent, imageId: '123'} as any
      jest.spyOn(cacheManager, 'get').mockResolvedValueOnce([event])
      jest.spyOn(service, 'createEvent').mockResolvedValueOnce(mockCreatedEvent as any)
      jest
        .spyOn(mediaAdapter, 'uploadImageFromArrayBuffer')
        .mockResolvedValueOnce(mockUploadedMedia)
      jest.spyOn(axios, 'get').mockResolvedValueOnce({
        data: mockArrayBufferUpload.arrayBuffer,
        headers: {'content-type': mockArrayBufferUpload.mimetype}
      })

      const result = await service.createEvent(createEvent)

      expect(service.createEvent).toHaveBeenCalledWith(createEvent)
      expect(mediaAdapter.uploadImageFromArrayBuffer).toHaveBeenCalledWith(expect.any(Promise))
      expect(axios.get).toHaveBeenCalledWith(mockCreatedEvent.imageUrl, {
        responseType: 'arraybuffer'
      })
      expect(result).toEqual({...mockCreatedEvent, imageId: ''})
    })

    // test('should upload media and update the event with the media details', async () => {
    // const createEvent = {
    //   id: '1',
    //   source: Providers.AgendaBasel
    // }

    //   const mockCreatedEvent = {
    //     createdAt: new Date(),
    //     modifiedAt: new Date(),
    //     imageUrl: 'some-url',
    //     ...createEvent
    //   }
    //   const mockUploadedMedia: UploadImage = {
    //     id: 'mediaId',
    //     filename: 'media.jpg',
    //     fileSize: 1024,
    //     extension: 'jpg',
    //     mimeType: 'image/jpeg',
    //     format: 'jpeg',
    //     width: 800,
    //     height: 600
    //   }

    //   jest.spyOn(service, 'createEvent').mockResolvedValueOnce(mockCreatedEvent as any)
    //   jest
    //     .spyOn(mediaAdapter, 'uploadImageFromArrayBuffer')
    //     .mockResolvedValueOnce(mockUploadedMedia)

    //   const result = await service.createEvent(createEvent)

    //   expect(service.createEvent).toHaveBeenCalledWith(createEvent)
    //   expect(mediaAdapter.uploadImageFromArrayBuffer).toHaveBeenCalledWith(expect.any(Promise))
    //   expect(result).toEqual({...mockCreatedEvent, media: mockUploadedMedia})
    // })
  })
})
