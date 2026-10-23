import { EventStatus } from '@wepublish/editor/api';

import { EventFormValues } from '../event-form-schema';
import { eventFormFromEvent } from './event-form-mapping';
import { defaultsAfterSave, EventSaveMutations, saveEvent } from './event-save';
import { testEvent } from './test-event';

const mutations = (): EventSaveMutations & {
  [K in keyof EventSaveMutations]: ReturnType<typeof vi.fn>;
} => ({
  createEvent: vi.fn().mockResolvedValue('event-new'),
  updateEvent: vi.fn().mockResolvedValue(undefined),
  updateEventContent: vi.fn().mockResolvedValue(undefined),
  updateImageAltText: vi.fn().mockResolvedValue(undefined),
});

const loaded = () => eventFormFromEvent(testEvent());

const withAltText = (values: EventFormValues, index: number, alt: string) => ({
  ...values,
  images: values.images.map((row, position) =>
    position === index ? { ...row, value: { ...row.value, altText: alt } } : row
  ),
});

describe('saveEvent', () => {
  it('sends one updateEvent carrying only the changed facts', async () => {
    const api = mutations();
    const defaults = loaded();

    const result = await saveEvent({
      id: 'event-1',
      defaults,
      values: { ...defaults, status: EventStatus.Cancelled },
      mutations: api,
    });

    expect(api.updateEvent).toHaveBeenCalledTimes(1);
    expect(api.updateEvent).toHaveBeenCalledWith('event-1', {
      status: EventStatus.Cancelled,
    });
    expect(api.updateEventContent).not.toHaveBeenCalled();
    expect(api.updateImageAltText).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'event-1', saved: ['facts'], failed: [] });
  });

  it('sends one updateEventContent with name, print blurb, blocks and images', async () => {
    const api = mutations();
    const defaults = loaded();

    await saveEvent({
      id: 'event-1',
      defaults,
      values: { ...defaults, name: 'Qui-vive II' },
      mutations: api,
    });

    expect(api.updateEvent).not.toHaveBeenCalled();
    expect(api.updateEventContent).toHaveBeenCalledTimes(1);
    expect(api.updateEventContent).toHaveBeenCalledWith('event-1', {
      name: 'Qui-vive II',
      printDescription: 'Dance by Equilibre',
      blocks: [],
      images: [
        { imageId: 'image-1', caption: '© Joana Magalhaes', isMain: true },
        { imageId: 'image-2', caption: null, isMain: false },
      ],
    });
  });

  it('updates the alt text of the changed image only', async () => {
    const api = mutations();
    const defaults = loaded();

    const result = await saveEvent({
      id: 'event-1',
      defaults,
      values: withAltText(defaults, 1, 'The poster'),
      mutations: api,
    });

    expect(api.updateImageAltText).toHaveBeenCalledTimes(1);
    expect(api.updateImageAltText).toHaveBeenCalledWith({
      id: 'image-2',
      description: 'The poster',
      focalPointX: 0.3,
      focalPointY: 0.6,
    });
    expect(api.updateEvent).not.toHaveBeenCalled();
    expect(api.updateEventContent).not.toHaveBeenCalled();
    expect(result.saved).toEqual(['altText']);
  });

  it('names what was saved and what failed when the content fails after the facts', async () => {
    const api = mutations();
    api.updateEventContent.mockRejectedValue(new Error('Name too long'));
    const defaults = loaded();
    const values = {
      ...defaults,
      status: EventStatus.SoldOut,
      name: 'Changed',
    };

    const result = await saveEvent({
      id: 'event-1',
      defaults,
      values,
      mutations: api,
    });

    expect(result).toEqual({
      id: 'event-1',
      saved: ['facts'],
      failed: [{ group: 'content', message: 'Name too long' }],
    });

    const nextDefaults = defaultsAfterSave(defaults, values, result.saved);

    expect(nextDefaults.status).toBe(EventStatus.SoldOut);
    expect(nextDefaults.name).toBe('Qui-vive');
  });

  it('keeps a failed alt text as unsaved while the saved content moves on', () => {
    const defaults = loaded();
    const values = { ...withAltText(defaults, 0, 'New alt'), name: 'Changed' };

    const nextDefaults = defaultsAfterSave(defaults, values, ['content']);

    expect(nextDefaults.name).toBe('Changed');
    expect(nextDefaults.images[0].value.altText).toBe(
      'Dancers on a dark stage'
    );
  });

  it('creates the event with its facts and content, then the alt texts', async () => {
    const api = mutations();
    const defaults = loaded();
    const values = withAltText(defaults, 1, 'The poster');

    const result = await saveEvent({
      id: undefined,
      defaults,
      values,
      mutations: api,
    });

    expect(api.createEvent).toHaveBeenCalledTimes(1);
    const [input, content] = api.createEvent.mock.calls[0];
    expect(input).toMatchObject({
      status: EventStatus.Confirmed,
      tagIds: ['tag-1'],
      placeId: 'place-1',
    });
    expect(content).toMatchObject({ name: 'Qui-vive' });
    expect(api.updateEvent).not.toHaveBeenCalled();
    expect(api.updateEventContent).not.toHaveBeenCalled();
    expect(api.updateImageAltText).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'image-2', description: 'The poster' })
    );
    expect(result).toEqual({
      id: 'event-new',
      saved: ['facts', 'content', 'altText'],
      failed: [],
    });
  });

  it('saves nothing else when creating fails', async () => {
    const api = mutations();
    api.createEvent.mockRejectedValue(new Error('No venue'));
    const defaults = loaded();

    const result = await saveEvent({
      id: undefined,
      defaults,
      values: withAltText(defaults, 1, 'The poster'),
      mutations: api,
    });

    expect(api.updateImageAltText).not.toHaveBeenCalled();
    expect(result).toEqual({
      id: undefined,
      saved: [],
      failed: [
        { group: 'facts', message: 'No venue' },
        { group: 'content', message: 'No venue' },
      ],
    });
  });
});
