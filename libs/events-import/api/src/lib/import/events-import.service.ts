import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import fetch from 'node-fetch'
import xml2js from 'xml2js'
import {
  ImportedEventDocument,
  ImportedEventFilter /* , ImportedEventSort */
} from './events-import.model'

type XMLEventOrigin = {
  ownerid: string
  owner: string
  originId: string
  lastUpdate: string
  languageCode: string
}

type XMLEventLocation = {
  LocationId: string[]
  LocationName: string[]
  LocationAdress: string[]
}

type XMLEventActivityDate = {
  ActivityDate: string[]
}

type XMLEventMultimedia = {
  Images: string[]
  Videos: string[]
}

type XMLEventSettings = {
  Branches: string[]
  Genres: string[]
  EventTypes: string[]
}

type XMLEventType = {
  Title: string
  Subtitle: string
  ShortDescription: string
  LongDescription: string
  $: XMLEventOrigin
  CastInformation: string[] // I think it's rich text
  PriceInformation: string[]
  TicketInformation: string[]
  ExternalURL: string[]
  OriginURL: string[]
  Location: XMLEventLocation[]
  ActivityDates: XMLEventActivityDate[]
  ActivityMultimedia: XMLEventMultimedia[]
  ActivitySettings: XMLEventSettings[]
}

interface ImportedEventsParams {
  filter: ImportedEventFilter
  order: 1 | -1
  skip: number
  take: number
  sort: string
}

const upcomingOnly = (XMLEvent: XMLEventType) => {
  const startDate =
    XMLEvent &&
    XMLEvent.ActivityDates &&
    typeof XMLEvent.ActivityDates[0] !== 'string' &&
    XMLEvent.ActivityDates[0]?.ActivityDate &&
    XMLEvent.ActivityDates[0]?.ActivityDate[0]?.['$'] &&
    XMLEvent.ActivityDates[0]?.ActivityDate[0]?.['$'].startDate

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
    // startsAt: startDate ? startDate : '',
    startsAt: new Date(startDate),
    endsAt: endDate ? new Date(endDate) : null

    // tags TaggedEvents[]
  }

  return parsedEvent
}

@Injectable()
export class EventsImportService {
  constructor(private prisma: PrismaClient) {}

  async importedEvents({
    filter,
    order,
    skip = 0,
    take = 10,
    sort
  }: ImportedEventsParams): Promise<ImportedEventDocument> {
    const parser = new xml2js.Parser()
    const urlToQuery = 'https://www.agendabasel.ch/xmlexport/kzexport-basel.xml'

    // check out params
    console.log('filter', filter)
    console.log('order', order)
    console.log('skip', skip)
    console.log('take', take)
    console.log('sort', sort)
    // check out params

    async function getXMLfromURL(url) {
      try {
        const response = await fetch(url)
        const content = await response.text()
        const data = await parser.parseStringPromise(content)

        return data
      } catch (e) {
        console.log({e})
      }
    }

    const eventsParsedXML = await getXMLfromURL(urlToQuery)
    const totalCount = eventsParsedXML.length
    console.log('totalCount', totalCount)

    const events = eventsParsedXML['kdz:exportActivities']?.Activities[0]?.Activity

    // only take events that take time in the future
    const upcomingEvents = events.filter(event => upcomingOnly(event))

    const importedEvents = upcomingEvents
      ?.map(a => {
        // console.log('a events-import service', a)
        return parseXMLEventToWpEvent(a)
      })
      .sort((a, b) => {
        return a.startsAt - b.startsAt
      })
      .slice(skip, skip + take)

    // console.log('importedEvents.length', importedEvents.length)

    const firstEvent = importedEvents[0]
    const lastEvent = importedEvents[importedEvents.length - 1]

    return {
      nodes: importedEvents,
      totalCount: upcomingEvents.length,
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: false,
        startCursor: firstEvent?.id,
        endCursor: lastEvent?.id
      }
    }
  }
}
