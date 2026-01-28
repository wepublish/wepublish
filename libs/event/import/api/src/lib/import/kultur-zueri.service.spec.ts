import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { EventStatus, PrismaClient } from '@prisma/client';
import { ImageFetcherService, MediaAdapter } from '@wepublish/image/api';
import { KulturZueriService } from './kultur-zueri.service';
import { KulturagendaParser } from './kulturagenda-parser';
import { EventFromSource } from './events-import.model';

const mockedEvent: EventFromSource = {
  id: '1234',
  createdAt: new Date('2023-01-01'),
  modifiedAt: new Date('2023-01-01'),
  name: 'Foobar',
  startsAt: new Date('2023-01-01'),
  status: EventStatus.Scheduled,
  description: [],
  externalSourceId: '123',
  externalSourceName: 'KulturZueri',
};

describe('KulturZueriService', () => {
  let service: KulturZueriService;
  let prismaClient: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KulturZueriService,
        {
          provide: KulturagendaParser,
          useValue: {
            fetchAndParseKulturagenda: async () => [mockedEvent],
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: PrismaClient,
          useValue: {
            event: {
              create: jest.fn().mockResolvedValue({
                id: 'created-event-id',
              }),
            },
            image: {
              create: async (id: any) =>
                await {
                  id,
                },
            },
          },
        },
        {
          provide: ImageFetcherService,
          useValue: {
            fetch: jest.fn(),
          },
        },
        {
          provide: MediaAdapter,
          useValue: {
            uploadImageFromArrayBuffer: jest.fn().mockResolvedValue({
              id: 'bar',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<KulturZueriService>(KulturZueriService);
    prismaClient = module.get<PrismaClient>(PrismaClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('KulturZueriService', () => {
    test('importedEvents() method returns the correct paginated events.', async () => {
      const importedEvents = await service.importedEvents();

      expect(importedEvents).not.toBeNull();
    });

    test('importedEvent() method returns not found error when searching for a non-existing id', async () => {
      const importedEventParams = {
        id: 'non-existing-event-id',
      };

      await expect(
        service.importedEvent(importedEventParams)
      ).rejects.toThrowError(
        `Event with id ${importedEventParams.id} not found.`
      );
    });

    test('createEvent() method successfully creates an event and returns the ID.', async () => {
      const importedEvents = await service.importedEvents();

      const createEventParams = {
        id: importedEvents[0].id,
      };

      const createdEventId = await service.createEvent(createEventParams);

      expect(createdEventId).toBe('created-event-id');
      expect(prismaClient.event.create).toHaveBeenCalledWith(
        expect.any(Object)
      );
    });

    test('createEvent() method throws an error when an event with the provided ID is not found.', async () => {
      const createEventParams = {
        id: 'non-existent-event-id',
      };

      await expect(service.createEvent(createEventParams)).rejects.toThrowError(
        `Event with id ${createEventParams.id} not found.`
      );
    });
  });
});
