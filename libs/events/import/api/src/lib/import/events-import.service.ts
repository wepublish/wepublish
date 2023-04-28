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
import {htmlToSlate} from 'slate-serializers'

import {XMLEventType} from './xmlTypes'

const parseAndCacheData = async (cacheManager: Cache, source: Providers) => {
  const parser = new xml2js.Parser()
  const urlToQuery = 'https://www.agendabasel.ch/xmlexport/kzexport-basel.xml'

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
  const events = eventsParsedXML['kdz:exportActivities']?.Activities[0]?.Activity

  // only take events that take time in the future
  const upcomingEvents = events.filter((event: XMLEventType) => upcomingOnly(event))

  // parse their structure to ours
  const importedEvents = upcomingEvents?.map((a: XMLEventType) => {
    return parseXMLEventToWpEvent(a, source)
  })

  // save in cache
  const ttl = 8 * 60 * 60 * 1000 // 8 hours
  await cacheManager.set('parsedEvents', importedEvents, ttl)
  return importedEvents
}

interface ImportedEventsParams {
  filter: ImportedEventFilter
  order: 1 | -1
  skip: number
  take: number
  sort: string
  cacheManager: Cache
  source: typeof Providers[keyof typeof Providers]
}

interface ImportedEventParams {
  id: string
  // source: typeof Providers[keyof typeof Providers]
  cacheManager: Cache
}

interface EventsProvider {
  name: Providers
  importedEvents({
    filter,
    order,
    skip,
    take,
    sort
  }: ImportedEventsParams): Promise<ImportedEventsDocument>

  importedEvent({id, source}: ImportedEventParams): Promise<Event>
}

export enum EventStatus {
  Cancelled = 'CANCELLED',
  Postponed = 'POSTPONED',
  Rescheduled = 'RESCHEDULED',
  Scheduled = 'SCHEDULED'
}

const today = new Date()
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

  if (new Date(startDate) < today) return
  return XMLEvent
}

const parseXMLEventToWpEvent = (XMLEvent: XMLEventType, source: Providers) => {
  const activityDate =
    (XMLEvent &&
      XMLEvent.ActivityDates &&
      typeof XMLEvent.ActivityDates[0] !== 'string' &&
      XMLEvent.ActivityDates[0]?.ActivityDate &&
      XMLEvent.ActivityDates[0]?.ActivityDate[0]?.['$'] &&
      XMLEvent.ActivityDates[0]?.ActivityDate[0]?.['$']) ||
    null

  const startDate = activityDate?.startDate
  const startTime = activityDate?.startTime
  const endDate = activityDate?.endDate
  const endTime = activityDate?.endTime

  const start = `${startDate} ${startTime}`
  const end = endDate ? `${endDate} ${endTime}` : null

  const castInfo = XMLEvent.CastInformation[0].replace(/(<([^>]+)>)/gi, '')
  const longDescription = XMLEvent.LongDescription[0].replace(/(<([^>]+)>)/gi, '')
  const shortDescription = XMLEvent.ShortDescription[0].replace(/(<([^>]+)>)/gi, '')
  const parsedDescription = htmlToSlate(longDescription || shortDescription || castInfo)

  // we need to add type: 'paragraph' because that's how it was done in WP in the past
  parsedDescription[0] = {...parsedDescription[0], type: 'paragraph'}

  const parsedEvent = {
    id: XMLEvent['$'].originId,
    modifiedAt: new Date(XMLEvent['$'].lastUpdate || ''),
    name: XMLEvent.Title[0].replace(/(<([^>]+)>)/gi, ''),
    description: parsedDescription,
    status: EventStatus.Scheduled,
    externalSourceId: XMLEvent['$'].originId,
    externalSourceName: source,
    location: XMLEvent.Location[0]?.LocationAdress[0].replace(/(<([^>]+)>)/gi, '') || '',
    startsAt: start ? new Date(start.trim()) : null,
    endsAt: end ? new Date(end.trim()) : null
  }

  return parsedEvent
}

@Injectable()
export class EventsImportService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache, private prisma: PrismaClient) {}

  async importedEvents({filter, order, skip, take, sort}: ImportedEventsParams) {
    const importableEvents = Promise.all(
      providers.map(provider =>
        provider.importedEvents({
          filter,
          order,
          skip,
          take,
          sort,
          cacheManager: this.cacheManager,
          source: provider.name
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
    switch (source) {
      case Providers.AgendaBasel: {
        return new AgendaBasel().importedEvent({id, cacheManager: this.cacheManager})
      }
    }
  }
}

class AgendaBasel implements EventsProvider {
  name = Providers.AgendaBasel
  async importedEvents({
    // filter,
    // order,
    // sort,
    skip = 0,
    take = 10,
    cacheManager,
    source
  }: ImportedEventsParams): Promise<ImportedEventsDocument> {
    let parsedEvents: Event[] = await cacheManager.get('parsedEvents')

    if (!parsedEvents) {
      parsedEvents = await parseAndCacheData(cacheManager, Providers.AgendaBasel)
    }

    // todo split into separate functions?
    const sortedEvents = parsedEvents.sort((a: any, b: any) => {
      return a.startsAt - b.startsAt
    })

    // todo split into separate functions?
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

  async importedEvent({id, cacheManager}: ImportedEventParams): Promise<Event> {
    let parsedEvents: Event[] = await cacheManager.get('parsedEvents')

    if (!parsedEvents) {
      parsedEvents = await parseAndCacheData(cacheManager, Providers.AgendaBasel)
    }

    const event = parsedEvents.find(e => e.id === id)

    if (!event) {
      throw Error(`Event with id ${id} not found.`)
    }

    return event
  }
}

const providers = [new AgendaBasel()]
