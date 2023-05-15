import {CACHE_MANAGER} from '@nestjs/cache-manager'
import {Inject, Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import axios from 'Axios'
import {Cache} from 'cache-manager'
import moment from 'moment'
import fetch from 'node-fetch'
import {htmlToSlate} from 'slate-serializers'
import xml2js from 'xml2js'
import {
  CreateEventArgs,
  Event,
  ImportedEventFilter,
  ImportedEventsDocument,
  Providers,
  SingleEventFilter
} from './events-import.model'

import {ArrayBufferUpload, MediaAdapterService} from '@wepublish/image/api'
import {XMLEventType} from './xmlTypes'

const AGENDA_BASEL_URL = 'https://www.agendabasel.ch/xmlexport/kzexport-basel.xml'

const getFallbackDesc = (source: Providers) => `<p>Event imported from ${source}</p>`

interface ImportedEventsResolverParams {
  filter: ImportedEventFilter
  order: 1 | -1
  skip: number
  take: number
  sort: string
}

interface ImportedEventResolverParams {
  id: string
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
  cacheManager: Cache
}

interface CreateEventParams {
  id: string
  cacheManager: Cache
  prisma: PrismaClient
  mediaAdapter: MediaAdapterService
}

interface EventsProvider {
  name: Providers
  importedEvents({
    filter,
    order,
    skip,
    take,
    sort
  }: ImportedEventsResolverParams): Promise<ImportedEventsDocument>

  importedEvent({id}: ImportedEventResolverParams): Promise<Event>

  createEvent({id}: ImportedEventResolverParams): Promise<string>
}

export enum EventStatus {
  Cancelled = 'CANCELLED',
  Postponed = 'POSTPONED',
  Rescheduled = 'RESCHEDULED',
  Scheduled = 'SCHEDULED'
}

const parseAndCacheData = async (cacheManager: Cache, source: Providers): Promise<Event[]> => {
  const parser = new xml2js.Parser()
  const urlToQuery = AGENDA_BASEL_URL

  async function getXMLfromURL(url: string) {
    try {
      const response = await fetch(url)
      const content = await response.text()
      const data = await parser.parseStringPromise(content)

      return data
    } catch (e) {
      throw Error('Unable to get any data from the provided xml.')
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

const today = moment().startOf('day')
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
  if (moment(startDate).isBefore(today)) return
  return XMLEvent
}

const getImageUrl = (event: XMLEventType) => {
  return (
    (event?.ActivityMultimedia.length &&
      event?.ActivityMultimedia[0]?.Images.length &&
      event?.ActivityMultimedia[0]?.Images[0]?.Image?.length &&
      event?.ActivityMultimedia[0]?.Images[0]?.Image[0].$?.url) ||
    ''
  )
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
  const fallbackDescription = getFallbackDesc(source)
  const parsedDescription = htmlToSlate(
    longDescription || shortDescription || castInfo || fallbackDescription
  )

  // we need to add type: 'paragraph' because that's how it was done in WP in the past
  // parsedDescription[0] = {...parsedDescription[0], type: 'paragraph'}

  const parsedEvent = {
    id: XMLEvent['$'].originId,
    modifiedAt: new Date(XMLEvent['$'].lastUpdate || ''),
    name: XMLEvent.Title[0].replace(/(<([^>]+)>)/gi, ''),
    description: parsedDescription,
    status: EventStatus.Scheduled,
    imageUrl: getImageUrl(XMLEvent),
    externalSourceId: XMLEvent['$'].originId,
    externalSourceName: source,
    location: XMLEvent.Location[0]?.LocationAdress[0].replace(/(<([^>]+)>)/gi, '') || '',
    startsAt: start ? new Date(start.trim()) : null,
    endsAt: end ? new Date(end.trim()) : null
  }

  return parsedEvent
}

const fetchAndTransformImage = async (url: string): Promise<ArrayBufferUpload> => {
  try {
    const response = await axios.get(url, {responseType: 'arraybuffer'})
    const {data, headers} = response

    const filename = 'transformed-image.jpg'
    const mimetype = headers['content-type']
    const arrayBuffer = data

    const arrayBufferUpload = {
      filename,
      mimetype,
      arrayBuffer
    }

    return arrayBufferUpload
  } catch (error) {
    throw Error('Error fetching and transforming image')
  }
}

@Injectable()
export class EventsImportService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaClient,
    private mediaAdapter: MediaAdapterService
  ) {}

  async importedEvents({filter, order, skip, take, sort}: ImportedEventsResolverParams) {
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

  async createEvent(filter: CreateEventArgs) {
    const {id, source} = filter
    switch (source) {
      case Providers.AgendaBasel: {
        return new AgendaBasel().createEvent({
          id,
          cacheManager: this.cacheManager,
          prisma: this.prisma,
          mediaAdapter: this.mediaAdapter
        })
      }
    }
  }
}

class AgendaBasel implements EventsProvider {
  readonly name = Providers.AgendaBasel

  async importedEvents({
    skip = 0,
    take = 10,
    cacheManager
  }: ImportedEventsParams): Promise<ImportedEventsDocument> {
    let parsedEvents: Event[] | undefined = await cacheManager.get('parsedEvents')

    if (parsedEvents === undefined) {
      parsedEvents = await parseAndCacheData(cacheManager, Providers.AgendaBasel)
    }

    const sortedEvents = parsedEvents.sort((a: any, b: any) => {
      return a.startsAt - b.startsAt
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

  async importedEvent({id, cacheManager}: ImportedEventParams): Promise<Event> {
    let parsedEvents: Event[] | undefined = await cacheManager.get('parsedEvents')

    if (!parsedEvents) {
      parsedEvents = await parseAndCacheData(cacheManager, Providers.AgendaBasel)
    }

    const event = parsedEvents.find(e => e.id === id)

    if (!event) {
      throw Error(`Event with id ${id} not found.`)
    }

    return event
  }

  async createEvent({id, cacheManager, prisma, mediaAdapter}: CreateEventParams): Promise<string> {
    let parsedEvents: Event[] | undefined = await cacheManager.get('parsedEvents')
    let createdImageId = null

    if (!parsedEvents) {
      parsedEvents = await parseAndCacheData(cacheManager, Providers.AgendaBasel)
    }

    const event = parsedEvents?.find(e => e.id === id)

    if (!event) {
      throw Error(`Event with id ${id} not found.`)
    }

    if (event.imageUrl) {
      const file = fetchAndTransformImage(event.imageUrl)

      if (file) {
        const {id, ...image} = await mediaAdapter.uploadImageFromArrayBuffer(file)

        const createdImage = await prisma.image.create({
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
    }

    const eventInput = {
      name: event.name,
      description: event.description as unknown as any, // ehh
      location: event.location,
      startsAt: event.startsAt,
      imageId: createdImageId || '',
      endsAt: event.endsAt,
      externalSourceName: event.externalSourceName,
      externalSourceId: event.externalSourceId
    }

    const createdEvent = await prisma.event.create({data: eventInput})

    return createdEvent.id
  }
}

const providers = [new AgendaBasel()]
