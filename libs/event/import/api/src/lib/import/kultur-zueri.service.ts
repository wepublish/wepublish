import {CACHE_MANAGER} from '@nestjs/cache-manager'
import {Inject, Injectable} from '@nestjs/common'
import {Prisma, PrismaClient} from '@prisma/client'
import {ImageFetcherService, MediaAdapterService} from '@wepublish/image/api'
import {Cache} from 'cache-manager'
import {Event} from './events-import.model'
import {CreateEventParams, EventsProvider, ImportedEventParams} from './events-import.service'
import {fetchAndParseKulturzueri} from './kulturzueri-parser'

@Injectable()
export class KulturZueriService implements EventsProvider {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaClient,
    private mediaAdapter: MediaAdapterService,
    private imageFetcher: ImageFetcherService
  ) {}

  readonly name = 'KulturZueri'
  readonly url = 'https://www.kulturzueri.ch/xmlexport/kzexport.xml'

  private async getEvents() {
    const cachedEvents = await this.cacheManager.get<Event[]>('kultur-zueri-events')

    if (cachedEvents) {
      return cachedEvents
    }

    const events = await fetchAndParseKulturzueri(this.url, this.name)
    const ttl = 8 * 60 * 60 * 1000 // 8 hours

    await this.cacheManager.set('kultur-zueri-events', events, ttl)

    return events
  }

  async importedEvents(): Promise<Event[]> {
    const parsedEvents = await this.getEvents()
    return parsedEvents
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
