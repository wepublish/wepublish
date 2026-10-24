import '@wepublish/event/api';
import { Test } from '@nestjs/testing';
import { EventService } from '@wepublish/event/api';
import { EventBlockResolver } from './event-block.resolver';
import { EventBlock } from './event-block.model';

describe('EventBlockResolver', () => {
  const setup = async (events: unknown[] = []) => {
    const eventService = {
      getPublicEventsForBlock: vi.fn().mockResolvedValue(events),
    };

    const module = await Test.createTestingModule({
      providers: [
        EventBlockResolver,
        { provide: EventService, useValue: eventService },
      ],
    }).compile();

    return { resolver: await module.resolve(EventBlockResolver), eventService };
  };

  it('resolves its dependencies when the event library is loaded first, as at boot', async () => {
    const { resolver } = await setup();

    expect(resolver).toBeInstanceOf(EventBlockResolver);
  });

  it('asks the event service for the public events the block selects', async () => {
    const { resolver, eventService } = await setup([{ id: 'event-1' }]);
    const filter = { tags: ['tag-1'], events: ['event-2', 'event-1'] };

    await expect(
      resolver.events({ filter } as unknown as EventBlock)
    ).resolves.toEqual([{ id: 'event-1' }]);
    expect(eventService.getPublicEventsForBlock).toHaveBeenCalledWith(filter);
  });

  it('renders nothing for a block that only points at deleted events', async () => {
    const { resolver } = await setup([]);

    await expect(
      resolver.events({
        filter: { tags: [], events: ['old-event'] },
      } as unknown as EventBlock)
    ).resolves.toEqual([]);
  });

  it('copes with a block stored without a filter', async () => {
    const { resolver, eventService } = await setup([]);

    await resolver.events({} as unknown as EventBlock);

    expect(eventService.getPublicEventsForBlock).toHaveBeenCalledWith({});
  });
});
