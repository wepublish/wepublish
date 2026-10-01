import { EventService } from './event.service';

describe('EventService cache', () => {
  const publicContentCache = { invalidate: jest.fn() };
  const event = {
    id: 'event-1',
    startsAt: new Date('2030-01-01T10:00:00.000Z'),
    endsAt: new Date('2030-01-01T12:00:00.000Z'),
  };
  const service = new EventService(
    {
      event: {
        findUnique: jest.fn().mockResolvedValue(event),
        create: jest.fn().mockResolvedValue(event),
        update: jest.fn().mockResolvedValue(event),
        delete: jest.fn().mockResolvedValue(event),
      },
    } as any,
    publicContentCache as any
  );

  beforeEach(() => {
    Object.assign(service, {
      __DATALOADER__EventDataloaderService: { prime: jest.fn() },
    });
    publicContentCache.invalidate.mockReset().mockResolvedValue(undefined);
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
});
