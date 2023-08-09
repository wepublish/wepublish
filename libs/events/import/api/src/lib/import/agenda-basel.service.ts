import {CACHE_MANAGER} from '@nestjs/cache-manager'
import {Inject, Injectable} from '@nestjs/common'
import {Prisma, PrismaClient} from '@prisma/client'
import {ImageFetcherService, MediaAdapterService} from '@wepublish/image/api'
import {Cache} from 'cache-manager'
import {Event, ImportedEventsDocument} from './events-import.model'
import {
  CreateEventParams,
  EventsProvider,
  ImportedEventParams,
  ImportedEventsParams
} from './events-import.service'
import {fetchAndParseKulturagenda} from './kulturagenda-parser'

@Injectable()
export class AgendaBaselService implements EventsProvider {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaClient,
    private mediaAdapter: MediaAdapterService,
    private imageFetcher: ImageFetcherService
  ) {}

  readonly name = 'AgendaBasel'
  readonly url = 'https://www.agendabasel.ch/xmlexport/kzexport-basel.xml'

  private async getEvents() {
    const cachedEvents = await this.cacheManager.get<Event[]>('parsedEvents')

    if (cachedEvents) {
      return cachedEvents
    }

    const events = await fetchAndParseKulturagenda(this.url, this.name)
    const ttl = 8 * 60 * 60 * 1000 // 8 hours

    await this.cacheManager.set('parsedEvents', events, ttl)

    return events
  }

  async importedEvents({
    skip = 0,
    take = 10
  }: ImportedEventsParams): Promise<ImportedEventsDocument> {
    const parsedEvents = await this.getEvents()

    const sortedEvents = parsedEvents.sort((a, b) => {
      return +a.startsAt - +b.startsAt
    })

    const paginatedEvents = sortedEvents.slice(skip, skip + take)

    const firstEvent = parsedEvents[0]
    const lastEvent = parsedEvents[parsedEvents.length - 1]

    return {
      nodes: paginatedEvents,
      totalCount: parsedEvents.length,
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: false,
        startCursor: firstEvent?.id,
        endCursor: lastEvent?.id
      }
    }
  }

  async importedEvent({id}: ImportedEventParams): Promise<Event> {
    const parsedEvents = await this.getEvents()

    const event = parsedEvents.find(e => e.id === id)

    if (!event) {
      throw Error(`Event with id ${id} not found.`)
    }

    return event
  }

  async createEvent({id}: CreateEventParams): Promise<string> {
    const parsedEvents = await this.getEvents()
    let createdImageId = null

    const event = parsedEvents?.find(e => e.id === id)

    if (!event) {
      throw Error(`Event with id ${id} not found.`)
    }

    if (event.imageUrl) {
      const file = this.imageFetcher.fetch(event.imageUrl)
      const {id, ...image} = await this.mediaAdapter.uploadImageFromArrayBuffer(file)

      const createdImage = await this.prisma.image.create({
        data: {
          id,
          ...image,
          filename: image.filename
        },
        include: {
          focalPoint: true
        }
      })

      createdImageId = createdImage.id
    }

    const createdEvent = await this.prisma.event.create({
      data: {
        name: event.name,
        description: event.description as Prisma.InputJsonValue[],
        location: event.location,
        startsAt: event.startsAt,
        imageId: createdImageId || null,
        endsAt: event.endsAt,
        externalSourceName: event.externalSourceName,
        externalSourceId: event.externalSourceId
      }
    })

    return createdEvent.id
  }
}
