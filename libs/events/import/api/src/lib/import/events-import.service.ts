import {Inject, Injectable} from '@nestjs/common'

import {
  CreateEventArgs,
  Event,
  ImportedEventFilter,
  ImportedEventSort,
  ImportedEventsDocument,
  SingleEventFilter
} from './events-import.model'
import {PrismaClient} from '@prisma/client'

export interface ImportedEventsResolverParams {
  filter: ImportedEventFilter
  order: 1 | -1
  skip: number
  take: number
  sort: ImportedEventSort
}

export interface ImportedEventResolverParams {
  id: string
}

export interface ImportedEventsParams {
  filter: ImportedEventFilter
  order: 1 | -1
  skip: number
  take: number
  sort: string
}

export interface ImportedEventParams {
  id: string
}

export interface CreateEventParams {
  id: string
}

export interface EventsProvider {
  name: string
  importedEvents({
    filter,
    order,
    skip,
    take,
    sort
  }: ImportedEventsResolverParams): Promise<ImportedEventsDocument>

  importedEvent({id}: ImportedEventResolverParams): Promise<Event>

  createEvent({id}: CreateEventParams): Promise<string>
}

export const EVENT_IMPORT_PROVIDER = Symbol('Event Import Provider')

@Injectable()
export class EventsImportService {
  constructor(
    @Inject(EVENT_IMPORT_PROVIDER) private providers: EventsProvider[],
    private prisma: PrismaClient
  ) {}

  async importedEvents({filter, order, skip, take, sort}: ImportedEventsResolverParams) {
    const importableEvents = Promise.all(
      this.providers.map(provider =>
        provider.importedEvents({
          filter,
          order,
          skip,
          take,
          sort
        })
      )
    )

    try {
      const values = await importableEvents
      // for now we have only one provider, to be extended in the future when needed
      return values[0]
    } catch (e) {
      console.error(e)
    }
  }

  async importedEvent(filter: SingleEventFilter) {
    const {id, source} = filter
    return this.providers.find(p => p.name === source)?.importedEvent({id})
  }

  async createEventFromSource({id, source}: CreateEventArgs) {
    return this.providers.find(p => p.name === source)?.createEvent({id})
  }

  async importedEventsIds() {
    const externalEventsIds = this.prisma.event
      .findMany({
        where: {
          externalSourceId: {
            not: null
          }
        }
      })
      .then(res => res.map(single => single.externalSourceId))

    return externalEventsIds
  }
}
