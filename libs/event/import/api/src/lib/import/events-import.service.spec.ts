import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { EventStatus, PrismaClient } from '@prisma/client';
import { SortOrder } from '@wepublish/utils/api';
import { Cache } from 'cache-manager';
import { AgendaBaselService } from './agenda-basel.service';
import { EventFromSource, ImportedEventSort } from './events-import.model';
import {
  EVENT_IMPORT_PROVIDER,
  EventsImportService,
} from './events-import.service';
import { KulturZueriService } from './kultur-zueri.service';

describe('EventsImportService', () => {
  let service: EventsImportService;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsImportService,
        {
          provide: EVENT_IMPORT_PROVIDER,
          useValue: [AgendaBaselService, KulturZueriService],
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: vi.fn(),
            set: vi.fn(),
          },
        },
        {
          provide: PrismaClient,
          useValue: {
            event: {
              create: vi.fn(),
            },
            image: {
              create: vi.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<EventsImportService>(EventsImportService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  const mockEvent: EventFromSource = {
    id: '1',
    createdAt: new Date(),
    modifiedAt: new Date(),
    name: 'Event 1',
    description: {
      type: 'doc',
      attrs: undefined,
      content: [],
    },
    status: EventStatus.Scheduled,
    location: '',
    externalSourceId: '',
    externalSourceName: '',
    startsAt: new Date(),
    endsAt: undefined,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('importedEvents method should return imported events from the cache if available', async () => {
    const mockEventsDocument = {
      nodes: [mockEvent],
      pageInfo: {
        endCursor: '1',
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: '1',
      },
      totalCount: 1,
    };
    vi.spyOn(cacheManager, 'get').mockResolvedValueOnce([mockEvent]);

    vi.spyOn(service, 'importedEvents').mockResolvedValueOnce(
      mockEventsDocument
    );
    const result = await service.importedEvents({
      filter: {} as any,
      order: SortOrder.Ascending,
      skip: 0,
      take: 10,
      sort: ImportedEventSort.CREATED_AT,
    });
    expect(result).toEqual(mockEventsDocument);
  });

  test('importedEvent should return the imported event by ID from AgendaBasel', async () => {
    const source = 'AgendaBasel';
    const id = '1';

    vi.spyOn(service, 'importedEvent').mockResolvedValueOnce(mockEvent);

    const result = await service.importedEvent({ id, source });

    expect(service.importedEvent).toHaveBeenCalledWith({
      source,
      id: '1',
    });
    expect(result).toEqual(mockEvent);
  });

  test('importedEvent should return the imported event by ID from KulturZueri', async () => {
    const source = 'KulturZueri';
    const id = '1';

    vi.spyOn(service, 'importedEvent').mockResolvedValueOnce(mockEvent);

    const result = await service.importedEvent({ id, source });

    expect(service.importedEvent).toHaveBeenCalledWith({
      source,
      id: '1',
    });
    expect(result).toEqual(mockEvent);
  });

  test('createEventFromSource method should create an event in the db', async () => {
    const event = { ...mockEvent, imageId: '123' } as any;
    vi.spyOn(cacheManager, 'get').mockResolvedValueOnce([event]);
    const createEvent = {
      id: '1',
      source: 'AgendaBasel',
    };

    vi.spyOn(service, 'createEventFromSource').mockResolvedValueOnce(event);

    const result = await service.createEventFromSource(createEvent);

    expect(service.createEventFromSource).toHaveBeenCalledWith({
      id: '1',
      source: 'AgendaBasel',
    });

    expect(result).toEqual(event);
  });
});
