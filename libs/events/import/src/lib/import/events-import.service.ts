import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
// import {DashboardInvoice} from './dashboard-invoice.model'
import fetch from 'node-fetch'
import xml2js from 'xml2js'

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
  OriginURL: ['https://www.theater-basel.ch/de/streit']
  Location: XMLEventLocation[]
  ActivityDates: XMLEventActivityDate[]
  ActivityMultimedia: XMLEventMultimedia[]
  ActivitySettings: XMLEventSettings[]
}

const parseXMLEventToWpEvent = (XMLEvent: XMLEventType) => {
  const parsedEvent = {
    id: XMLEvent['$'].originId,
    createdAt: '',
    modifiedAt: XMLEvent['$'].lastUpdate,
    name: XMLEvent.Title[0],
    description: XMLEvent.CastInformation[0],
    status: 'Scheduled',

    // imageId String?
    // image   Image?  @relation(fields: [imageId], references: [id])

    location: XMLEvent.Location[0].LocationAdress[0],
    startsAt: XMLEvent.ActivityDates[0].ActivityDate[0],
    endsAt: 'dupa'

    // tags TaggedEvents[]
  }

  return parsedEvent
}

@Injectable()
export class EventsImportService {
  constructor(private prisma: PrismaClient) {}

  async importedEvents(): Promise<PrismaClient['event'][]> {
    const parser = new xml2js.Parser()
    const urlToQuery = 'https://www.agendabasel.ch/xmlexport/kzexport-basel.xml'

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
    // console.log('eventsParsedXML1', eventsParsedXML)
    // console.log('eventsParsedXML2', eventsParsedXML["kdz:exportActivities"])
    // console.log('eventsParsedXML2', eventsParsedXML['kdz:exportActivities'].Activities[0].Activity)
    // console.log('eventsParsedXML3', eventsParsedXML['kdz:exportActivities'].Activities[0].Activity[0])

    // console.log('events', eventsXML)

    const importedEvents = eventsParsedXML['kdz:exportActivities']?.Activities[0]?.Activity?.map(
      a => {
        console.log('a dupa', a)
        return parseXMLEventToWpEvent(a)
      }
    )

    console.log('importedEvents', importedEvents)

    console.log('here dupa')

    return []
  }
}
