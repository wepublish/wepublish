import {Inject, Injectable} from '@nestjs/common'
import {CACHE_MANAGER} from '@nestjs/cache-manager'
import {Cache} from 'cache-manager'
import {PrismaClient} from '@prisma/client'
import fetch from 'node-fetch'
import xml2js from 'xml2js'
import {
  ImportedEventsDocument,
  ImportedEventFilter,
  Event,
  Providers,
  SingleEventFilter
} from './events-import.model'

import {XMLEventType} from './xmlTypes'

interface ImportedEventsParams {
  filter: ImportedEventFilter
  order: 1 | -1
  skip: number
  take: number
  sort: string
  cacheManager?: Cache
}

interface ImportedEventParams {
  id: string
  source?: typeof Providers[keyof typeof Providers]
  cacheManager?: Cache
}

interface EventsProvider {
  importedEvents({
    filter,
    order,
    skip,
    take,
    sort
  }: ImportedEventsParams): Promise<ImportedEventsDocument>

  importedEvent({id, source}: ImportedEventParams): Promise<Event>
}

const upcomingOnly = (XMLEvent: XMLEventType) => {
  const startDate =
    XMLEvent &&
    XMLEvent.ActivityDates &&
    typeof XMLEvent.ActivityDates[0] !== 'string' &&
    XMLEvent.ActivityDates[0]?.ActivityDate &&
    XMLEvent.ActivityDates[0]?.ActivityDate[0]?.['$'] &&
    XMLEvent.ActivityDates[0]?.ActivityDate[0]?.['$'].startDate

  if (!startDate) {
    return
  }

  if (new Date(startDate) < new Date()) return
  return XMLEvent
}

const parseXMLEventToWpEvent = (XMLEvent: XMLEventType) => {
  const startDate =
    XMLEvent &&
    XMLEvent.ActivityDates &&
    typeof XMLEvent.ActivityDates[0] !== 'string' &&
    XMLEvent.ActivityDates[0]?.ActivityDate &&
    XMLEvent.ActivityDates[0]?.ActivityDate[0]?.['$'] &&
    XMLEvent.ActivityDates[0]?.ActivityDate[0]?.['$'].startDate

  const endDate =
    XMLEvent &&
    XMLEvent.ActivityDates &&
    typeof XMLEvent.ActivityDates[0] !== 'string' &&
    XMLEvent.ActivityDates[0]?.ActivityDate &&
    XMLEvent.ActivityDates[0]?.ActivityDate[0]?.['$'] &&
    XMLEvent.ActivityDates[0]?.ActivityDate[0]?.['$'].endDate

  const parsedEvent = {
    id: XMLEvent['$'].originId,
    // createdAt: '',
    modifiedAt: new Date(XMLEvent['$'].lastUpdate || ''),
    name: XMLEvent.Title[0] || '',
    description:
      XMLEvent.CastInformation[0] ||
      XMLEvent.LongDescription[0] ||
      XMLEvent.ShortDescription[0] ||
      '',
    status: 'Scheduled',

    location: XMLEvent.Location[0]?.LocationAdress[0] || '',
    startsAt: startDate ? new Date(startDate) : null,
    endsAt: endDate ? new Date(endDate) : null
  }

  return parsedEvent
}

@Injectable()
export class EventsImportService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache, private prisma: PrismaClient) {}

  async importedEvents({filter, order, skip, take, sort}: ImportedEventsParams) {
    const importableEvents = Promise.all(
      providers.map(provider =>
        provider.importedEvents({filter, order, skip, take, sort, cacheManager: this.cacheManager})
      )
    )

    try {
      const values = await importableEvents
      // for now we have only one provider, to be extended in the future when needed
      return values[0]
    } catch (e) {
      console.log(e)
    }
  }

  async importedEvent(filter: SingleEventFilter) {
    const {id, source} = filter
    switch (source) {
      case Providers.AgendaBasel: {
        return new AgendaBaselEventsProvider().importedEvent({id, cacheManager: this.cacheManager})
      }
    }
  }
}

class AgendaBaselEventsProvider implements EventsProvider {
  async importedEvents({
    filter,
    order,
    skip = 0,
    take = 10,
    sort,
    cacheManager
  }: ImportedEventsParams): Promise<ImportedEventsDocument> {
    // todo check for parsedEvents cache and only do all the logic below if record doesn't exist
    // const parsedEvents: Event[] = await cacheManager.get('parsedEvents')

    const parser = new xml2js.Parser()
    const urlToQuery = 'https://www.agendabasel.ch/xmlexport/kzexport-basel.xml'

    // todo remove
    await cacheManager.reset()

    async function getXMLfromURL(url: string) {
      try {
        const response = await fetch(url)
        const content = await response.text()
        const data = await parser.parseStringPromise(content)

        return data
      } catch (e) {
        console.error({e})
      }
    }

    const eventsParsedXML = await getXMLfromURL(urlToQuery)
    // todo save parsed json in cache

    const events = eventsParsedXML['kdz:exportActivities']?.Activities[0]?.Activity

    // only take events that take time in the future
    const upcomingEvents = events.filter((event: XMLEventType) => upcomingOnly(event))

    const importedEvents = upcomingEvents?.map((a: any) => {
      return parseXMLEventToWpEvent(a)
    })

    // save in cache
    const ttl = 8 * 60 * 60 * 1000 // 8 hours
    await cacheManager.set('parsedEvents', importedEvents, ttl)

    // split into separate functions
    const sortedEvents = importedEvents.sort((a: any, b: any) => {
      return a.startsAt - b.startsAt
    })

    // split into separate functions
    const paginatedEvents = sortedEvents.slice(skip, skip + take)

    const firstEvent = importedEvents[0]
    const lastEvent = importedEvents[importedEvents.length - 1]

    return {
      nodes: paginatedEvents,
      totalCount: upcomingEvents.length,
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: false,
        startCursor: firstEvent?.id,
        endCursor: lastEvent?.id
      }
    }
  }

  async importedEvent({id, cacheManager}: ImportedEventParams): Promise<Event> {
    const parsedEvents: Event[] = await cacheManager.get('parsedEvents')

    const event = parsedEvents.find(e => e.id === id)

    if (!event) {
      throw Error(`Event with id ${id} not found.`)
    }

    return event
  }
}

const providers = [new AgendaBaselEventsProvider()]
