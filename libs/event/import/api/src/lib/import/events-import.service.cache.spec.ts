import { EventsImportService } from './events-import.service';

describe('EventsImportService cache', () => {
  it('clears cached answers after importing an event', async () => {
    const publicContentCache = {
      invalidate: vi.fn().mockResolvedValue(undefined),
    };
    const service = new EventsImportService(
      [
        {
          name: 'agenda-basel',
          createEvent: vi.fn().mockResolvedValue('event-1'),
        } as any,
      ],
      {} as any,
      publicContentCache as any
    );

    await expect(
      service.createEventFromSource({ id: '1', source: 'agenda-basel' })
    ).resolves.toBe('event-1');
    expect(publicContentCache.invalidate).toHaveBeenCalled();
  });
});
