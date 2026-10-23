import { EventRevisionDataloaderService } from './event-revisions.dataloader';
import {
  EventDatesDataloader,
  EventRatesDataloader,
  EventRevisionImagesDataloader,
} from './event-details.dataloader';

describe('EventRevisionDataloaderService', () => {
  it('maps every event to its draft, pending and published revision, in key order', async () => {
    const prisma = {
      event: {
        findMany: vi.fn(async () => [
          {
            id: 'b',
            draft: null,
            pending: { revision: { id: 'b-pending' } },
            published: { revision: { id: 'b-published' } },
          },
          {
            id: 'a',
            draft: { revision: { id: 'a-draft' } },
            pending: null,
            published: null,
          },
        ]),
      },
    };
    const loader = new EventRevisionDataloaderService(prisma as any);

    await expect(loader.loadMany(['a', 'b', 'missing'])).resolves.toEqual([
      { draft: { id: 'a-draft' }, pending: undefined, published: undefined },
      {
        draft: undefined,
        pending: { id: 'b-pending' },
        published: { id: 'b-published' },
      },
      { draft: undefined, pending: undefined, published: undefined },
    ]);
    expect(prisma.event.findMany).toHaveBeenCalledWith({
      relationLoadStrategy: 'join',
      where: { id: { in: ['a', 'b', 'missing'] } },
      select: {
        id: true,
        published: { select: { revision: true } },
        pending: { select: { revision: true } },
        draft: { select: { revision: true } },
      },
    });
  });
});

describe('event detail dataloaders', () => {
  it.each([
    ['EventDatesDataloader', EventDatesDataloader, 'eventDate', 'eventId'],
    ['EventRatesDataloader', EventRatesDataloader, 'rate', 'eventId'],
    [
      'EventRevisionImagesDataloader',
      EventRevisionImagesDataloader,
      'eventImage',
      'revisionId',
    ],
  ] as const)(
    '%s groups rows by their parent',
    async (_, Loader, model, key) => {
      const prisma = {
        [model]: {
          findMany: vi.fn(async () => [
            { id: 1, [key]: 'x' },
            { id: 2, [key]: 'y' },
            { id: 3, [key]: 'x' },
          ]),
        },
      };
      const loader = new Loader(prisma as any);

      await expect(loader.loadMany(['x', 'y', 'z'])).resolves.toEqual([
        [
          { id: 1, [key]: 'x' },
          { id: 3, [key]: 'x' },
        ],
        [{ id: 2, [key]: 'y' }],
        [],
      ]);
    }
  );
});
