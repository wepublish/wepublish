import { EventService } from './event.service';

describe('EventService cache', () => {
  const publicContentCache = { invalidate: vi.fn(), invalidateAt: vi.fn() };
  const event = {
    id: 'event-1',
    startsAt: new Date('2030-01-01T10:00:00.000Z'),
    endsAt: new Date('2030-01-01T12:00:00.000Z'),
  };
  const service = new EventService(
    {
      event: {
        findUnique: vi.fn().mockResolvedValue(event),
        create: vi.fn().mockResolvedValue(event),
        update: vi.fn().mockResolvedValue(event),
        delete: vi.fn().mockResolvedValue(event),
      },
    } as any,
    publicContentCache as any
  );

  beforeEach(() => {
    Object.assign(service, {
      __DATALOADER__EventDataloaderService: { prime: vi.fn() },
    });
    publicContentCache.invalidate.mockReset().mockResolvedValue(undefined);
    publicContentCache.invalidateAt.mockReset();
  });

  it.each<[string, () => Promise<unknown>]>([
    [
      'creating',
      () =>
        service.createEvent({
          name: 'E',
          startsAt: event.startsAt,
          endsAt: event.endsAt,
        } as any),
    ],
    ['updating', () => service.updateEvent({ id: 'event-1' } as any)],
    ['deleting', () => service.deleteEvent('event-1')],
  ])('clears cached answers after %s an event', async (_, change) => {
    await change();

    expect(publicContentCache.invalidate).toHaveBeenCalled();
  });

  it.each<[string, () => Promise<unknown>]>([
    [
      'creating',
      () =>
        service.createEvent({
          name: 'E',
          startsAt: event.startsAt,
          endsAt: event.endsAt,
        } as any),
    ],
    ['updating', () => service.updateEvent({ id: 'event-1' } as any)],
  ])(
    'refreshes cached answers when the event starts and ends after %s it, even within the next minute',
    async (_, change) => {
      await change();

      expect(publicContentCache.invalidateAt.mock.calls).toEqual([
        [event.startsAt],
        [event.endsAt],
      ]);
    }
  );
});
