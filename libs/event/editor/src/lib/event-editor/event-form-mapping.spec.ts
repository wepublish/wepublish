import {
  EditorBlockType,
  EventScheduleType,
  EventStatus,
  FullBlockFragment,
} from '@wepublish/editor/api';

import { EventFormValues } from '../event-form-schema';
import {
  changedAltTexts,
  changedFactInput,
  eventContentInput,
  eventCreateInput,
  eventFormFromEvent,
  isContentChanged,
} from './event-form-mapping';
import { testEvent, testImage } from './test-event';

const teaserGrid = {
  __typename: 'TeaserGridBlock',
  blockStyle: null,
  numColumns: 1,
  teasers: [],
} as unknown as FullBlockFragment;

const richText = {
  __typename: 'RichTextBlock',
  blockStyle: null,
  richText: { type: 'doc', content: [] },
} as unknown as FullBlockFragment;

const loaded = () => eventFormFromEvent(testEvent());

const edit = (
  values: EventFormValues,
  change: Partial<EventFormValues>
): EventFormValues => ({ ...values, ...change });

describe('eventFormFromEvent', () => {
  it('reads the latest content and the facts of the event', () => {
    const values = loaded();

    expect(values).toMatchObject({
      name: 'Qui-vive',
      printDescription: 'Dance by Equilibre',
      status: EventStatus.Confirmed,
      organization: { id: 'org-1', name: 'Equilibre' },
      owner: { id: 'user-1', name: 'Anna Muster' },
      place: { id: 'place-1', name: 'Nuithonie', zip: '1752' },
      tagIds: ['tag-1'],
      ticketingUrl: 'https://tickets.example.com',
      slug: 'qui-vive',
      seoTitle: '',
      specialRate: null,
    });
    expect(values.schedule.scheduleType).toBe(EventScheduleType.Weekly);
    expect(values.schedule.weekly).toMatchObject({
      dateFrom: '2028-04-01',
      timeFrom: '20:00',
      dateTo: '2028-06-30',
      timeTo: '22:00',
      openingTime: '19:30',
      weekDays: [4, 5, 6, 7],
    });
  });

  it('orders images and prices by their sort order and takes alt text from the image', () => {
    const values = loaded();

    expect(values.images.map(({ value }) => value)).toMatchObject([
      {
        image: { id: 'image-1', focalPointX: 0.3 },
        caption: '© Joana Magalhaes',
        altText: 'Dancers on a dark stage',
        isMain: true,
      },
      { image: { id: 'image-2' }, caption: '', altText: '', isMain: false },
    ]);
    expect(values.rates.map(({ value }) => value)).toEqual([
      { price: 'CHF 25', designation: '' },
      { price: 'CHF 15', designation: 'Reduced' },
    ]);
  });

  it('keeps every block on the canvas, teasers included', () => {
    const event = testEvent();
    const withTeasers = testEvent({
      latest: { ...event.latest!, blocks: [richText, teaserGrid] },
    });

    expect(
      eventFormFromEvent(withTeasers).blocks.map(({ type }) => type)
    ).toEqual([EditorBlockType.RichText, EditorBlockType.TeaserGrid1]);
  });
});

describe('changedFactInput', () => {
  it('sends nothing when no fact changed', () => {
    const values = loaded();

    expect(changedFactInput(values, edit(values, { name: 'Renamed' }))).toEqual(
      {}
    );
  });

  it('sends only the facts that changed', () => {
    const values = loaded();

    expect(
      changedFactInput(
        values,
        edit(values, {
          status: EventStatus.SoldOut,
          ticketingUrl: '  ',
          place: null,
        })
      )
    ).toEqual({
      status: EventStatus.SoldOut,
      ticketingUrl: null,
      placeId: null,
    });
  });

  it('sends the whole schedule when any part of it changed, and clears explicit dates outside that mode', () => {
    const values = loaded();
    const changed = edit(values, {
      schedule: {
        ...values.schedule,
        weekly: { ...values.schedule.weekly, weekDays: [5, 6] },
      },
    });

    expect(changedFactInput(values, changed)).toEqual({
      scheduleType: EventScheduleType.Weekly,
      dateFrom: '2028-04-01T18:00:00.000Z',
      dateTo: '2028-06-30T20:00:00.000Z',
      weekDays: [5, 6],
      openingTime: '19:30',
      dates: [],
    });
  });

  it('trims prices and turns an empty designation into null', () => {
    const values = loaded();

    expect(
      changedFactInput(
        values,
        edit(values, {
          rates: [{ id: 'r', value: { price: ' CHF 30 ', designation: ' ' } }],
        })
      )
    ).toEqual({ rates: [{ price: 'CHF 30', designation: null }] });
  });
});

describe('content', () => {
  it('builds the content input from name, print blurb, blocks and images', () => {
    expect(eventContentInput(loaded())).toEqual({
      name: 'Qui-vive',
      printDescription: 'Dance by Equilibre',
      blocks: [],
      images: [
        { imageId: 'image-1', caption: '© Joana Magalhaes', isMain: true },
        { imageId: 'image-2', caption: null, isMain: false },
      ],
    });
  });

  it('does not count an alt text change as a content change', () => {
    const values = loaded();
    const [first, second] = values.images;

    const changed = edit(values, {
      images: [
        { ...first, value: { ...first.value, altText: 'Two dancers' } },
        second,
      ],
    });

    expect(isContentChanged(values, changed)).toBe(false);
    expect(isContentChanged(values, edit(values, { name: 'New' }))).toBe(true);
  });
});

describe('changedAltTexts', () => {
  it('lists only the images whose alt text changed, with their focal point', () => {
    const values = loaded();
    const [first, second] = values.images;

    const changed = edit(values, {
      images: [
        first,
        { ...second, value: { ...second.value, altText: ' A poster ' } },
      ],
    });

    expect(changedAltTexts(values, changed)).toEqual([
      {
        id: 'image-2',
        description: 'A poster',
        focalPointX: 0.3,
        focalPointY: 0.6,
      },
    ]);
  });

  it('compares a newly added image with the alt text it came with', () => {
    const values = loaded();
    const added = testImage({ id: 'image-3', description: 'Old text' });

    const changed = edit(values, {
      images: [
        ...values.images,
        {
          id: 'row-3',
          value: {
            image: added,
            caption: '',
            altText: 'Old text',
            isMain: false,
          },
        },
      ],
    });

    expect(changedAltTexts(values, changed)).toEqual([]);
  });
});

describe('eventCreateInput', () => {
  it('lets the API pick organisation and owner when they are left empty', () => {
    const values = edit(loaded(), { organization: null, owner: null });

    const input = eventCreateInput(values);

    expect(input.organizationId).toBeUndefined();
    expect(input.ownerId).toBeUndefined();
    expect(input).toMatchObject({
      scheduleType: EventScheduleType.Weekly,
      tagIds: ['tag-1'],
      placeId: 'place-1',
      showInPrint: true,
    });
  });
});
