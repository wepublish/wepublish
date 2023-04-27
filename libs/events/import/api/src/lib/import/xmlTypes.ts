type XMLEventOrigin = {
  ownerid: string
  owner: string
  originId: string
  lastUpdate: string
  languageCode: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
}

type XMLEventLocation = {
  LocationId: string[]
  LocationName: string[]
  LocationAdress: string[]
}

type XMLEventActivityDate = {
  ActivityDate: XMLEventMisc[]
}

type XMLEventMisc = {
  $: XMLEventOrigin
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

export {XMLEventType}
