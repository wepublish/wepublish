import { Test } from '@nestjs/testing';
import {
  limitAnswerCache,
  skipAnswerCache,
} from '@wepublish/public-content-cache/api';
import { CanGetPage } from '@wepublish/permissions';
import type { UserSession } from '@wepublish/authentication/api';
import { createMock } from '@wepublish/testing';
import { BlockTreeLoader } from '@wepublish/block-content/api';
import { ImageDataloaderService } from '@wepublish/image/api';
import { PageRevisionResolver } from './page-revision.resolver';
import type { PageRevision } from './page.model';
import type { ApiBlock } from '@wepublish/puck-content/api';

vi.mock('@wepublish/public-content-cache/api', async importOriginal => ({
  ...(await importOriginal<object>()),
  limitAnswerCache: vi.fn(),
  skipAnswerCache: vi.fn(),
}));

describe('PageRevisionResolver', () => {
  let resolver: PageRevisionResolver;
  let loader: BlockTreeLoader;

  const now = new Date('2026-01-05T09:00:00Z');
  const loaded = [{ type: 'title' }];

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PageRevisionResolver,
        {
          provide: BlockTreeLoader,
          useValue: {
            ...createMock(BlockTreeLoader),
            now,
            loadBlocks: vi.fn(async () => loaded),
            nextChange: vi.fn(async () => null),
          },
        },
        {
          provide: ImageDataloaderService,
          useValue: createMock(ImageDataloaderService),
        },
      ],
    }).compile();

    resolver = module.get(PageRevisionResolver);
    loader = module.get(BlockTreeLoader);
  });

  const revision = { blocks: [] } as unknown as PageRevision;

  const changesIn = (seconds: number) =>
    vi
      .mocked(loader.nextChange)
      .mockResolvedValue(new Date(now.getTime() + seconds * 1000));

  describe('blocksChangeAt', () => {
    it('asks the loader when the displayed blocks change next', async () => {
      changesIn(1800);

      expect(await resolver.blocksChangeAt(revision)).toEqual(
        new Date('2026-01-05T09:30:00Z')
      );
      expect(loader.nextChange).toHaveBeenCalledWith(revision.blocks);
    });
  });

  describe('blocks', () => {
    it('lets the answer cache expire when the blocks change next', async () => {
      changesIn(1800);
      const context = {};

      await resolver.blocks(revision, true, context, undefined);

      expect(limitAnswerCache).toHaveBeenCalledWith(
        context,
        new Date('2026-01-05T09:30:00Z')
      );
    });

    it('leaves the answer cache alone for untimed blocks', async () => {
      await resolver.blocks(revision, true, {}, undefined);

      expect(limitAnswerCache).not.toHaveBeenCalled();
    });

    const editor = {
      roles: [{ id: 'editor', permissionIDs: [CanGetPage.id] }],
    } as unknown as UserSession;

    it('omits blocks that should not display by default', async () => {
      expect(await resolver.blocks(revision, true, {}, undefined)).toBe(loaded);
      expect(loader.loadBlocks).toHaveBeenCalledWith(revision.blocks, {
        onlyDisplayed: true,
      });
      expect(skipAnswerCache).not.toHaveBeenCalled();
    });

    it('returns every block to a user allowed to edit them', async () => {
      const context = {};

      await resolver.blocks(revision, false, context, editor);

      expect(loader.loadBlocks).toHaveBeenLastCalledWith(revision.blocks, {
        onlyDisplayed: false,
      });
      expect(skipAnswerCache).toHaveBeenCalledWith(context);
    });

    it('never returns hidden blocks to anyone else', async () => {
      const context = {};

      await resolver.blocks(revision, false, context, undefined);

      expect(loader.loadBlocks).toHaveBeenLastCalledWith(revision.blocks, {
        onlyDisplayed: true,
      });
      expect(skipAnswerCache).toHaveBeenCalledWith(context);
    });
  });

  describe('puck blocks', () => {
    const puckBlocks: ApiBlock[] = [
      { id: 'shown', type: 'Heading', data: {} },
      {
        id: 'disabled',
        visibility: { disabled: true },
        type: 'Heading',
        data: {},
      },
      {
        id: 'later',
        visibility: { timings: { from: '2026-01-05T09:30:00Z' } },
        type: 'Heading',
        data: {},
      },
    ];

    const withPuckBlocks = {
      blocks: [],
      puckBlocks,
    } as unknown as PageRevision;

    const withoutPuckBlocks = {
      blocks: [],
      puckBlocks: null,
    } as unknown as PageRevision;

    const editor = {
      roles: [{ id: 'editor', permissionIDs: [CanGetPage.id] }],
    } as unknown as UserSession;

    const ids = (blocks: { id: string }[] | null) =>
      blocks?.map(block => block.id);

    describe('puckBlocks', () => {
      it('is null for a revision without puck blocks', () => {
        expect(
          resolver.puckBlocks(withoutPuckBlocks, true, {}, undefined)
        ).toBeNull();
      });

      it('omits puck blocks that should not display by default', () => {
        expect(
          ids(resolver.puckBlocks(withPuckBlocks, true, {}, undefined))
        ).toEqual(['shown']);
        expect(skipAnswerCache).not.toHaveBeenCalled();
      });

      it('returns every puck block to a user allowed to edit them', () => {
        const context = {};

        expect(
          ids(resolver.puckBlocks(withPuckBlocks, false, context, editor))
        ).toEqual(['shown', 'disabled', 'later']);
        expect(skipAnswerCache).toHaveBeenCalledWith(context);
      });

      it('resolves nested puck blocks as a flat list pointing at their parent slot', () => {
        const nested = {
          blocks: [],
          puckBlocks: [
            {
              id: 'grid',
              type: 'Grid',
              data: { items: [{ content: [] }] },
              children: [
                {
                  id: 'hidden',
                  type: 'Heading',
                  data: {},
                  slot: 'items[0].content',
                  visibility: { disabled: true },
                  children: [{ id: 'inner', type: 'Heading', data: {} }],
                },
                {
                  id: 'text',
                  type: 'Heading',
                  data: {},
                  slot: 'items[0].content',
                },
              ],
            },
          ],
        } as unknown as PageRevision;

        expect(
          resolver
            .puckBlocks(nested, true, {}, undefined)
            ?.map(({ id, parentId, slot, position }) => ({
              id,
              parentId,
              slot,
              position,
            }))
        ).toEqual([
          { id: 'grid', parentId: null, slot: null, position: 0 },
          {
            id: 'text',
            parentId: 'grid',
            slot: 'items[0].content',
            position: 0,
          },
        ]);
      });

      it('never returns hidden puck blocks to anyone else', () => {
        const context = {};

        expect(
          ids(resolver.puckBlocks(withPuckBlocks, false, context, undefined))
        ).toEqual(['shown']);
        expect(skipAnswerCache).toHaveBeenCalledWith(context);
      });

      it('lets the answer cache expire when the puck blocks change next', () => {
        const context = {};

        resolver.puckBlocks(withPuckBlocks, true, context, undefined);

        expect(limitAnswerCache).toHaveBeenCalledWith(
          context,
          new Date('2026-01-05T09:30:00Z')
        );
      });

      it('leaves the answer cache alone for untimed puck blocks', () => {
        resolver.puckBlocks(
          {
            blocks: [],
            puckBlocks: [puckBlocks[0]],
          } as unknown as PageRevision,
          true,
          {},
          undefined
        );

        expect(limitAnswerCache).not.toHaveBeenCalled();
      });
    });

    describe('puckBlocksChangeAt', () => {
      it('tells when the displayed puck blocks change next', () => {
        expect(resolver.puckBlocksChangeAt(withPuckBlocks)).toEqual(
          new Date('2026-01-05T09:30:00Z')
        );
      });

      it('is null for a revision without puck blocks', () => {
        expect(resolver.puckBlocksChangeAt(withoutPuckBlocks)).toBeNull();
      });
    });
  });
});
