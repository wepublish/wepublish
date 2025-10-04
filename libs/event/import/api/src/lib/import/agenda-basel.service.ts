import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ImageFetcherService, MediaAdapter } from '@wepublish/image/api';
import { Cache } from 'cache-manager';
import { EventFromSource } from './events-import.model';
import {
  CreateEventParams,
  EventsProvider,
  ImportedEventParams,
} from './events-import.service';
import { KulturagendaParser } from './kulturagenda-parser';

@Injectable()
export class AgendaBaselService implements EventsProvider {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaClient,
    private mediaAdapter: MediaAdapter,
    private imageFetcher: ImageFetcherService,
    private parser: KulturagendaParser
  ) {}

  readonly name = 'AgendaBasel';
  readonly url = 'https://www.agendabasel.ch/xmlexport/kzexport-basel.xml';

  private async getEvents() {
    const cachedEvents = await this.cacheManager.get<EventFromSource[]>(
      'agenda-basel-events'
    );

    if (cachedEvents) {
      return cachedEvents;
    }

    const events = await this.parser.fetchAndParseKulturagenda(
      this.url,
      this.name
    );
    const ttl = 8 * 60 * 60 * 1000; // 8 hours

    await this.cacheManager.set('agenda-basel-events', events, ttl);

    return events;
  }

  async importedEvents(): Promise<EventFromSource[]> {
    const parsedEvents = await this.getEvents();
    return parsedEvents;
  }

  async importedEvent({ id }: ImportedEventParams): Promise<EventFromSource> {
    const parsedEvents = await this.getEvents();

    const event = parsedEvents.find(e => e.id === id);

    if (!event) {
      throw Error(`Event with id ${id} not found.`);
    }

    return event;
  }

  async createEvent({ id }: CreateEventParams): Promise<string> {
    const parsedEvents = await this.getEvents();
    let createdImageId = null;

    const event = parsedEvents?.find(e => e.id === id);

    if (!event) {
      throw Error(`Event with id ${id} not found.`);
    }

    if (event.imageUrl) {
      const file = this.imageFetcher.fetch(event.imageUrl);
      const image = await this.mediaAdapter.uploadImageFromArrayBuffer(file);

      const createdImage = await this.prisma.image.create({
        data: image,
      });

      createdImageId = createdImage.id;
    }

    const createdEvent = await this.prisma.event.create({
      data: {
        name: event.name,
        description: event.description as any[],
        location: event.location,
        startsAt: event.startsAt,
        imageId: createdImageId || null,
        endsAt: event.endsAt,
        externalSourceName: event.externalSourceName,
        externalSourceId: event.externalSourceId,
      },
    });

    return createdEvent.id;
  }
}
