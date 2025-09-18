import { EventStatus } from '@prisma/client';
import { isBefore, startOfDay } from 'date-fns';
import { htmlToSlate } from 'slate-serializers';
import xml2js from 'xml2js';
import { EventFromSource } from './events-import.model';
import { XMLEventType } from './xmlTypes';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class KulturagendaParser {
  constructor(private httpClient: HttpService) {}

  async fetchAndParseKulturagenda(
    urlToQuery: string,
    source: string
  ): Promise<EventFromSource[]> {
    const eventsParsedXML = await this.getXMLfromURL(urlToQuery);
    const events =
      eventsParsedXML['kdz:exportActivities']?.Activities[0]?.Activity;

    // only take events that take time in the future
    const upcomingEvents = events.filter((event: XMLEventType) =>
      this.upcomingOnly(event)
    );

    // parse their structure to ours
    const importedEvents = upcomingEvents?.map((a: XMLEventType) => {
      return this.parseXMLEventToWpEvent(a, source);
    });

    return importedEvents;
  }

  upcomingOnly(XMLEvent: XMLEventType) {
    const today = startOfDay(new Date());

    const startDate =
      XMLEvent &&
      XMLEvent.ActivityDates &&
      typeof XMLEvent.ActivityDates[0] !== 'string' &&
      XMLEvent.ActivityDates[0]?.ActivityDate &&
      XMLEvent.ActivityDates[0]?.ActivityDate[0]?.['$'] &&
      XMLEvent.ActivityDates[0]?.ActivityDate[0]?.['$'].startDate;

    if (!startDate || isBefore(new Date(startDate), today)) {
      return;
    }

    return XMLEvent;
  }

  private getFallbackDesc(source: string) {
    return `<p>Event imported from ${source}</p>`;
  }

  private async getXMLfromURL(url: string) {
    const parser = new xml2js.Parser();

    try {
      const content = (await lastValueFrom(this.httpClient.get(url))).data;
      const data = await parser.parseStringPromise(content);

      return data;
    } catch (e) {
      throw Error('Unable to get any data from the provided xml.');
    }
  }

  private getImageUrl(event: XMLEventType) {
    return (
      (event?.ActivityMultimedia?.length &&
        event?.ActivityMultimedia[0]?.Images.length &&
        event?.ActivityMultimedia[0]?.Images[0]?.Image?.length &&
        event?.ActivityMultimedia[0]?.Images[0]?.Image[0].$?.url) ||
      null
    );
  }

  private parseXMLEventToWpEvent(XMLEvent: XMLEventType, source: string) {
    const activityDate =
      (XMLEvent &&
        XMLEvent.ActivityDates &&
        typeof XMLEvent.ActivityDates[0] !== 'string' &&
        XMLEvent.ActivityDates[0]?.ActivityDate &&
        XMLEvent.ActivityDates[0]?.ActivityDate[0]?.['$'] &&
        XMLEvent.ActivityDates[0]?.ActivityDate[0]?.['$']) ||
      null;

    const startDate = activityDate?.startDate;
    const startTime = activityDate?.startTime;
    const endDate = activityDate?.endDate;
    const endTime = activityDate?.endTime;

    const start = `${startDate} ${startTime}`;
    const end = endDate ? `${endDate} ${endTime}` : null;

    const castInfo = XMLEvent.CastInformation[0].replace(/(<([^>]+)>)/gi, '');
    const longDescription = XMLEvent.LongDescription[0].replace(
      /(<([^>]+)>)/gi,
      ''
    );
    const shortDescription = XMLEvent.ShortDescription[0].replace(
      /(<([^>]+)>)/gi,
      ''
    );
    const fallbackDescription = this.getFallbackDesc(source);
    const parsedDescription = htmlToSlate(
      longDescription || shortDescription || castInfo || fallbackDescription
    );

    // we need to add type: 'paragraph' because that's how it was done in WP in the past
    parsedDescription[0] = {
      ...parsedDescription[0],
      type: 'paragraph',
    } as any;

    const parsedEvent = {
      id: XMLEvent['$'].originId,
      modifiedAt: new Date(XMLEvent['$'].lastUpdate || ''),
      name: XMLEvent.Title[0].replace(/(<([^>]+)>)/gi, ''),
      description: parsedDescription,
      status: EventStatus.Scheduled,
      imageUrl: this.getImageUrl(XMLEvent),
      externalSourceId: XMLEvent['$'].originId,
      externalSourceName: source,
      location:
        XMLEvent.Location[0]?.LocationAdress[0].replace(/(<([^>]+)>)/gi, '') ||
        '',
      startsAt: start ? new Date(start.trim()) : null,
      endsAt: end ? new Date(end.trim()) : null,
    };

    return parsedEvent;
  }
}
