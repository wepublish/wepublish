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

export enum EventStatus {
  Cancelled = 'CANCELLED',
  Postponed = 'POSTPONED',
  Rescheduled = 'RESCHEDULED',
  Scheduled = 'SCHEDULED'
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

// const testingHtml = `<div id="intertext1">
// <p class="lead">Świat mobilnego gamingu przywita niebawem kolejnego gracza! ASUS ROG Ally potwierdził termin debiutu na scenie. W oczekiwaniu na premierę sprawdź specyfikację konsoli, która powalczy z rywalami takimi jak Steam Deck czy Nintendo Switch.<span id="more-1403321"></span></p>
// <ul>
// <li><strong>ASUS ROG Ally</strong> zmierza ku premierze.</li>
// <li>Producent oficjalnie potwierdził termin debiutu urządzenia.</li>
// <li>Przenośna konsola zdradziła sporo szczegółów na swój temat.</li>
// </ul>
// <h3>Przedpremierowa specyfikacja konsoli ASUS ROG Ally</h3>
// <p>Władze nad urządzeniem przejmie świeżo zaprezentowany <strong>AMD Ryzen Z1</strong> lub <strong>AMD Ryzen Z1 Extreme</strong>. Obydwa układy zbudowane są w <strong>4 nm</strong> procesie litograficznym jednak:</p>
// <ul>
// <li>Główna różnica pomiędzy nimi polega na ilości wykorzystanych rdzeni oraz wątków. Pierwszy z nich posiada<strong> 6 rdzeni</strong> i <strong>12 wątków</strong>, podczas gdy model z dopiskiem Extreme posiada <strong>8 rdzeni</strong> i <strong>16 wątków</strong>.</li>
// <li>Kolejna różnica to ilość jednostek obliczeniowych układu graficznego <strong>RDNA 3</strong> zaprojektowana przez AMD. Podstawowa wersja procesora posiada 4 jednostki obliczeniowe, a mocniejsza wersja ma ich aż 12.</li>
// </ul>
// <div id="attachment_1403383" style="width: 510px" class="wp-caption aligncenter"><a href="https://www.gsmmaniak.pl/1403321/asus-rog-ally-specyfikacja-data-premiery-wyglad/attachment/2-432/" title="Galeria dla Oto specyfikacja i data premiery konsoli ASUS ROG Ally, która poskromi Steam Deck"><img aria-describedby="caption-attachment-1403383" loading="lazy" class="size-medium wp-image-1403383" src="https://cdn2.techmaniak.pl/wp-content/uploads/gsmmaniak/2023/04/2-41-medium.jpg" alt="ASUS ROG Ally" width="500" height="277" srcset="https://cdn2.techmaniak.pl/wp-content/uploads/gsmmaniak/2023/04/2-41-medium.jpg 500w, https://cdn2.techmaniak.pl/wp-content/uploads/gsmmaniak/2023/04/2-41.jpg 728w" sizes="(max-width: 500px) 100vw, 500px" itemprop="image"></a><p></p>
// <p id="caption-attachment-1403383" class="wp-caption-text">AMD Ryzen Z1 oraz AMD Ryzen Z1 Extreme / fot. producenta via dexerto.com</p>
// </div>
// <p>Przedni panel konsoli (<strong>LCD</strong>) z przekątną<strong> 7″</strong> zaoferuje <strong>Full HD+</strong>. Za odświeżanie ekranu odpowiedzialna będzie częstotliwość <strong>120 Hz</strong>. Wyświetlacz zaadaptuje proporcje <strong>16:9</strong>, a o jego wytrzymałość zadba szkiełko <strong>Gorilla Glass Victus</strong>. Podobno pojawi się jasność rzędu<strong> 500 nitów</strong>.</p>
// <p>Obydwa warianty bez zależności od procesora doposażone zostaną w <strong>16 GB</strong> pamięci <strong>RAM</strong> LPDDR5 i <strong>512 GB</strong> pamięci <strong>SSD</strong> PCIe 4.0. Na pokładzie znajdzie się także <strong>gniazdo kart microSD</strong>.</p>
// <p>Zintegrowany z przyciskiem zasilania skaner linii papilarnych obsłuży Windows Hello, ponieważ <strong>ASUS ROG Ally</strong> będzie dostarczany z fabrycznie zainstalowanym systemem operacyjnym <strong>Windows 11</strong>.</p>
// <blockquote><p>Obecność tego systemu, pozwoli na korzystanie z platform takich jak np.: Steam, EA App, Epic Games Store oraz Xbox Game Pass.</p></blockquote>
// <div id="attachment_1403384" style="width: 510px" class="wp-caption aligncenter"><a href="https://www.gsmmaniak.pl/1403321/asus-rog-ally-specyfikacja-data-premiery-wyglad/attachment/1-1268/" title="Galeria dla Oto specyfikacja i data premiery konsoli ASUS ROG Ally, która poskromi Steam Deck"><img aria-describedby="caption-attachment-1403384" loading="lazy" class="size-medium wp-image-1403384" src="https://cdn2.techmaniak.pl/wp-content/uploads/gsmmaniak/2023/04/1-125-medium.jpg" alt="ASUS ROG Ally" width="500" height="711" srcset="https://cdn2.techmaniak.pl/wp-content/uploads/gsmmaniak/2023/04/1-125-medium.jpg 500w, https://cdn2.techmaniak.pl/wp-content/uploads/gsmmaniak/2023/04/1-125.jpg 542w" sizes="(max-width: 500px) 100vw, 500px"></a><p></p>
// <p id="caption-attachment-1403384" class="wp-caption-text">Specyfikacja ASUS ROG Ally / fot. via telegram.com</p>
// </div>
// <p>Jeśli chodzi o łączność, to urządzenia otrzyma <strong>Wi-Fi 6E</strong> i <strong>Bluetooth</strong>, ale zabraknie 5G/4G (LTE). Dokładny rozmiar baterii nie jest jeszcze znany, ale firma twierdzi, że sprzęt może wytrzymać do <strong>8 godzin na pełnym naładowaniu </strong>(szczerze wątpię). Waga wyniesie w granicach <strong>608 gramów</strong>.</p>
// <p>Ponadto pojawią się <strong>głośniki stereo</strong> ze wsparciem technologii <strong>Dolby Atmos</strong> oraz <strong>konfigurowalne przyciski</strong> makro „stylizowane” na układzie analogów znanym z padów Xbox.</p>
// <h3>Kiedy premiera urządzenia?</h3>
// <div class="twitter-tweet twitter-tweet-rendered" style="display: flex; max-width: 500px; width: 100%; margin-top: 10px; margin-bottom: 10px;"><iframe id="twitter-widget-1" scrolling="no" frameborder="0" allowtransparency="true" allowfullscreen="true" class="" style="position: static; visibility: visible; width: 500px; height: 698px; display: block; flex-grow: 1;" title="Twitter Tweet" src="https://platform.twitter.com/embed/Tweet.html?dnt=true&amp;embedId=twitter-widget-1&amp;features=eyJ0ZndfdGltZWxpbmVfbGlzdCI6eyJidWNrZXQiOltdLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X2ZvbGxvd2VyX2NvdW50X3N1bnNldCI6eyJidWNrZXQiOnRydWUsInZlcnNpb24iOm51bGx9LCJ0ZndfdHdlZXRfZWRpdF9iYWNrZW5kIjp7ImJ1Y2tldCI6Im9uIiwidmVyc2lvbiI6bnVsbH0sInRmd19yZWZzcmNfc2Vzc2lvbiI6eyJidWNrZXQiOiJvbiIsInZlcnNpb24iOm51bGx9LCJ0ZndfbWl4ZWRfbWVkaWFfMTU4OTciOnsiYnVja2V0IjoidHJlYXRtZW50IiwidmVyc2lvbiI6bnVsbH0sInRmd19leHBlcmltZW50c19jb29raWVfZXhwaXJhdGlvbiI6eyJidWNrZXQiOjEyMDk2MDAsInZlcnNpb24iOm51bGx9LCJ0ZndfZHVwbGljYXRlX3NjcmliZXNfdG9fc2V0dGluZ3MiOnsiYnVja2V0Ijoib24iLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X3ZpZGVvX2hsc19keW5hbWljX21hbmlmZXN0c18xNTA4MiI6eyJidWNrZXQiOiJ0cnVlX2JpdHJhdGUiLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X2xlZ2FjeV90aW1lbGluZV9zdW5zZXQiOnsiYnVja2V0Ijp0cnVlLCJ2ZXJzaW9uIjpudWxsfSwidGZ3X3R3ZWV0X2VkaXRfZnJvbnRlbmQiOnsiYnVja2V0Ijoib24iLCJ2ZXJzaW9uIjpudWxsfX0%3D&amp;frame=false&amp;hideCard=false&amp;hideThread=false&amp;id=1650862237505163264&amp;lang=pl&amp;origin=https%3A%2F%2Fwww.gsmmaniak.pl%2F1403321%2Fasus-rog-ally-specyfikacja-data-premiery-wyglad%2F&amp;sessionId=f13c377c4cfe5c0cbf5ce4e3f2e8b6d0f13be4b0&amp;siteScreenName=gsmManiaK.pl&amp;theme=light&amp;widgetsVersion=aaf4084522e3a%3A1674595607486&amp;width=500px" data-tweet-id="1650862237505163264"></iframe></div>
// <p><script async="" src="https://platform.twitter.com/widgets.js" charset="utf-8"></script></p>
// <p>Producent pochwalił się <strong>oficjalnym debiutem</strong>, który przypadnie na <strong>11 maja 2023 roku</strong>. Jak widzisz, czasu pozostało niewiele, a w oczekiwaniu na premierę zapraszam Cię do wpisu na temat globalnej wersji świetnie zapowiadającego się <a href="https://www.gsmmaniak.pl/1403025/poco-f5-pojawil-sie-w-benchmarku-geekbench/">POCO F5</a>.</p>
// <blockquote class="wp-embedded-content" data-secret="nwLtJkMcfG" style="display: none;"><p><a href="https://www.gsmmaniak.pl/1403025/poco-f5-pojawil-sie-w-benchmarku-geekbench/">Średniak wydajniejszy niż ex-flagowce? Tym zaskoczy Cię Xiaomi i globalny POCO F5</a></p></blockquote>
// <p><iframe class="wp-embedded-content" sandbox="allow-scripts" security="restricted" title="„Średniak wydajniejszy niż ex-flagowce? Tym zaskoczy Cię Xiaomi i globalny POCO F5” — gsmManiaK.pl" src="https://www.gsmmaniak.pl/1403025/poco-f5-pojawil-sie-w-benchmarku-geekbench/embed/#?secret=nwLtJkMcfG" data-secret="nwLtJkMcfG" width="500" height="527" frameborder="0" marginwidth="0" marginheight="0" scrolling="no"></iframe></p>
// <p><em>Źródła: <a href="https://www.dexerto.com/tech/asus-rog-ally-2102952/">1</a>, <a href="https://twitter.com/ASUS_ROG/status/1650862237505163264">2</a></em></p>
// </div>`

const parseXMLEventToWpEvent = (XMLEvent: XMLEventType) => {
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

  // console.log('XMLEvent', XMLEvent)
  // console.log('XMLEvent.ActivityMultimedia[0].Images', XMLEvent.ActivityMultimedia[0].Images)
  // console.log('XMLEvent.ActivityMultimedia[0].Videos', XMLEvent.ActivityMultimedia[0].Videos)
  // console.log('XMLEvent.Location[0].LocationAdress', XMLEvent.Location[0].LocationAdress)
  // console.log('XMLEvent.Location[0].LocationName', XMLEvent.Location[0].LocationName)
  // console.log('XMLEvent.Location[0].LocationId', XMLEvent.Location[0].LocationId)

  const parsedEvent = {
    id: XMLEvent['$'].originId,
    // createdAt: '',
    modifiedAt: new Date(XMLEvent['$'].lastUpdate || ''),
    name: XMLEvent.Title[0].replace(/(<([^>]+)>)/gi, ''),
    description:
      XMLEvent.CastInformation[0].replace(/(<([^>]+)>)/gi, '') ||
      XMLEvent.LongDescription[0].replace(/(<([^>]+)>)/gi, '') ||
      XMLEvent.ShortDescription[0].replace(/(<([^>]+)>)/gi, '') ||
      '',
    // description: testingHtml,
    status: EventStatus.Scheduled,

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
