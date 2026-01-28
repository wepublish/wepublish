import { Test, TestingModule } from '@nestjs/testing';
import { KulturagendaParser } from './kulturagenda-parser';
import { XMLEventType } from './xmlTypes';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

const XMLEventMock: XMLEventType = {
  Title: ['Event 1'],
  Subtitle: [''],
  ShortDescription: [''],
  LongDescription: [''],
  $: {
    ownerid: '',
    owner: '',
    originId: '',
    lastUpdate: '',
    languageCode: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  },
  CastInformation: ['Cast info 1'],
  PriceInformation: [''],
  TicketInformation: [''],
  ExternalURL: [''],
  OriginURL: [''],
  Location: [
    {
      LocationId: [''],
      LocationName: [''],
      LocationAdress: [''],
    },
  ],
  ActivityDates: [
    {
      ActivityDate: [
        {
          $: {
            ownerid: '',
            owner: '',
            originId: '',
            lastUpdate: '',
            languageCode: '',
            startDate: '',
            startTime: '',
            endDate: '',
            endTime: '',
          },
        },
      ],
    },
  ],
  ActivityMultimedia: [
    {
      Images: [],
      Videos: [''],
    },
  ],
  ActivitySettings: [
    {
      Branches: [''],
      Genres: [''],
      EventTypes: [''],
    },
  ],
};

// Mocked XML data for testing
const mockedXMLData = {
  'kdz:exportActivities': {
    Activities: [
      {
        Activity: [
          {
            ...XMLEventMock,
            Title: ['Event 1'],
          },
          {
            ...XMLEventMock,
            Title: ['Event 2'],
            ActivityDates: [
              {
                ActivityDate: [
                  {
                    $: {
                      startDate: '2030-06-29',
                      startTime: '14:00:00',
                      endDate: '2030-06-29',
                      endTime: '16:00:00',
                    },
                  },
                ],
              },
            ],
          },
          {
            ...XMLEventMock,
            Title: ['Event 3'],
            ActivityDates: [
              {
                ActivityDate: [
                  {
                    $: {
                      startDate: '2030-06-30',
                      startTime: '18:00:00',
                      endDate: '2030-06-30',
                      endTime: '20:00:00',
                    },
                  },
                ],
              },
            ],
          },
          {
            ...XMLEventMock,
            Title: ['Past Event'],
            ActivityDates: [
              {
                ActivityDate: [
                  {
                    $: {
                      startDate: '2022-06-25',
                      startTime: '10:00:00',
                      endDate: '2022-06-25',
                      endTime: '12:00:00',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

jest.mock('xml2js', () => ({
  Parser: jest.fn().mockImplementation(() => ({
    parseStringPromise: jest.fn(() => Promise.resolve(mockedXMLData)),
  })),
}));

describe('fetchAndParseKulturagenda', () => {
  let parser: KulturagendaParser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KulturagendaParser,
        {
          provide: HttpService,
          useValue: {
            get: () => of({ data: mockedXMLData }),
          },
        },
      ],
    }).compile();

    parser = module.get<KulturagendaParser>(KulturagendaParser);
  });

  it('should fetch XML data and parse upcoming events correctly', async () => {
    const url = 'https://example.com/events.xml';
    const source = 'Kulturagenda';

    const events = await parser.fetchAndParseKulturagenda(url, source);

    expect(events).toHaveLength(2);

    expect(events[0].name).toBe('Event 2');
    expect(events[0].startsAt).toEqual(new Date('2030-06-29T14:00:00.000Z'));
    expect(events[0].endsAt).toEqual(new Date('2030-06-29T16:00:00'));

    expect(events[1].name).toBe('Event 3');
    expect(events[1].startsAt).toEqual(new Date('2030-06-30T18:00:00'));
    expect(events[1].endsAt).toEqual(new Date('2030-06-30T20:00:00'));
  });

  it('should return undefined if the event has a past start date', () => {
    const XMLEvent = {
      ...XMLEventMock,
      Title: ['Past Event'],
      ActivityDates: [
        {
          ActivityDate: [
            {
              $: {
                startDate: '2022-06-25',
                startTime: '10:00:00',
                endDate: '2022-06-25',
                endTime: '12:00:00',
              },
            },
          ],
        },
      ],
    };

    const result = parser.upcomingOnly(XMLEvent as XMLEventType);
    expect(result).toBeUndefined();
  });
});
