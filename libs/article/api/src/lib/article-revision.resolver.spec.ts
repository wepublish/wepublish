import { Test } from '@nestjs/testing';
import {
  limitAnswerCache,
  skipAnswerCache,
} from '@wepublish/public-content-cache/api';
import { CanGetArticle } from '@wepublish/permissions';
import type { UserSession } from '@wepublish/authentication/api';
import { createMock } from '@wepublish/testing';
import {
  BlockTreeLoader,
  PuckBlockDataLoader,
} from '@wepublish/block-content/api';
import { ImageDataloaderService } from '@wepublish/image/api';
import { ArticleRevisionResolver } from './article-revision.resolver';
import {
  ArticleAuthorDataloader,
  ArticleSocialMediaAuthorDataloader,
} from '@wepublish/author/api';
import type { ArticleRevision } from './article.model';
import { Logger } from '@nestjs/common';
import { ApiBlock, flattenPuckBlocks } from '@wepublish/puck-content/api';

vi.mock('@wepublish/public-content-cache/api', async importOriginal => ({
  ...(await importOriginal<object>()),
  limitAnswerCache: vi.fn(),
  skipAnswerCache: vi.fn(),
}));

describe('ArticleRevisionResolver', () => {
  let resolver: ArticleRevisionResolver;
  let loader: BlockTreeLoader;
  const puckBlockData = {
    flatten: vi.fn(flattenPuckBlocks),
  } as unknown as PuckBlockDataLoader;

  const now = new Date('2026-01-05T09:00:00Z');
  const loaded = [{ type: 'title' }];

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ArticleRevisionResolver,
        {
          provide: BlockTreeLoader,
          useValue: {
            ...createMock(BlockTreeLoader),
            now,
            loadBlocks: vi.fn(async () => loaded),
            nextChange: vi.fn(async () => null),
          },
        },
        { provide: PuckBlockDataLoader, useValue: puckBlockData },
        {
          provide: ArticleAuthorDataloader,
          useValue: createMock(ArticleAuthorDataloader),
        },
        {
          provide: ArticleSocialMediaAuthorDataloader,
          useValue: createMock(ArticleSocialMediaAuthorDataloader),
        },
        {
          provide: ImageDataloaderService,
          useValue: createMock(ImageDataloaderService),
        },
      ],
    }).compile();

    resolver = module.get(ArticleRevisionResolver);
    loader = module.get(BlockTreeLoader);
  });

  const revision = { blocks: [] } as unknown as ArticleRevision;

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
      roles: [{ id: 'editor', permissionIDs: [CanGetArticle.id] }],
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
      { id: 'shown', kind: 'puck', type: 'Heading', props: {} },
      {
        id: 'disabled',
        visibility: { disabled: true },
        kind: 'puck',
        type: 'Heading',
        props: {},
      },
      {
        id: 'later',
        visibility: { timings: { from: '2026-01-05T09:30:00.000Z' } },
        kind: 'puck',
        type: 'Heading',
        props: {},
      },
    ];

    const withPuckBlocks = {
      blocks: [],
      puckBlocks,
    } as unknown as ArticleRevision;

    const withoutPuckBlocks = {
      blocks: [],
      puckBlocks: null,
    } as unknown as ArticleRevision;

    const withOldPuckBlocks = {
      id: 'revision-1',
      blocks: [],
      puckBlocks: [{ id: 'old', type: 'Heading', data: { text: 'Hi' } }],
    } as unknown as ArticleRevision;

    const editor = {
      roles: [{ id: 'editor', permissionIDs: [CanGetArticle.id] }],
    } as unknown as UserSession;

    const ids = (blocks: { id: string }[] | null) =>
      blocks?.map(block => block.id);

    describe('puckBlocks', () => {
      it('is null for a revision without puck blocks', () => {
        expect(
          resolver.puckBlocks(withoutPuckBlocks, true, {}, undefined, false)
        ).toBeNull();
      });

      it('omits puck blocks that should not display by default', () => {
        expect(
          ids(resolver.puckBlocks(withPuckBlocks, true, {}, undefined, false))
        ).toEqual(['shown']);
        expect(skipAnswerCache).not.toHaveBeenCalled();
      });

      it('lets the data loader resolve the displayed blocks for readers', () => {
        resolver.puckBlocks(withPuckBlocks, true, {}, undefined, false);

        expect(puckBlockData.flatten).toHaveBeenCalledWith([puckBlocks[0]], {
          pruned: true,
          now,
          preview: false,
        });
      });

      it('returns every puck block to a user allowed to edit them', () => {
        const context = {};

        expect(
          ids(
            resolver.puckBlocks(withPuckBlocks, false, context, editor, false)
          )
        ).toEqual(['shown', 'disabled', 'later']);
        expect(skipAnswerCache).toHaveBeenCalledWith(context);
        expect(puckBlockData.flatten).toHaveBeenCalledWith(puckBlocks, {
          pruned: false,
          now,
          preview: false,
        });
      });

      it('lets the data of a preview request include unpublished records', () => {
        resolver.puckBlocks(withPuckBlocks, true, {}, editor, true);

        expect(puckBlockData.flatten).toHaveBeenCalledWith([puckBlocks[0]], {
          pruned: true,
          now,
          preview: true,
        });
      });

      it('resolves nested puck blocks as a flat list pointing at their parent slot', () => {
        const nested = {
          blocks: [],
          puckBlocks: [
            {
              id: 'grid',
              kind: 'puck',
              type: 'Grid',
              props: { items: [{ content: [] }] },
              children: [
                {
                  id: 'hidden',
                  kind: 'puck',
                  type: 'Heading',
                  props: {},
                  puckSlot: 'items[0].content',
                  visibility: { disabled: true },
                  children: [
                    { id: 'inner', kind: 'puck', type: 'Heading', props: {} },
                  ],
                },
                {
                  id: 'text',
                  kind: 'puck',
                  type: 'Heading',
                  props: {},
                  puckSlot: 'items[0].content',
                },
              ],
            },
          ],
        } as unknown as ArticleRevision;

        expect(
          resolver
            .puckBlocks(nested, true, {}, undefined, false)
            ?.map(({ id, parentId, puckSlot, position }) => ({
              id,
              parentId,
              puckSlot,
              position,
            }))
        ).toEqual([
          { id: 'grid', parentId: null, puckSlot: null, position: 0 },
          {
            id: 'text',
            parentId: 'grid',
            puckSlot: 'items[0].content',
            position: 0,
          },
        ]);
      });

      it('never returns hidden puck blocks to anyone else', () => {
        const context = {};

        expect(
          ids(
            resolver.puckBlocks(
              withPuckBlocks,
              false,
              context,
              undefined,
              false
            )
          )
        ).toEqual(['shown']);
        expect(skipAnswerCache).toHaveBeenCalledWith(context);
      });

      it('lets the answer cache expire when the puck blocks change next', () => {
        const context = {};

        resolver.puckBlocks(withPuckBlocks, true, context, undefined, false);

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
          } as unknown as ArticleRevision,
          true,
          {},
          undefined,
          false
        );

        expect(limitAnswerCache).not.toHaveBeenCalled();
      });

      it('reads stored puck blocks normalised like a fresh save', () => {
        resolver.puckBlocks(
          {
            blocks: [],
            puckBlocks: [{ ...puckBlocks[0], locked: null, children: null }],
          } as unknown as ArticleRevision,
          false,
          {},
          editor,
          false
        );

        expect(puckBlockData.flatten).toHaveBeenCalledWith([puckBlocks[0]], {
          pruned: false,
          now,
          preview: false,
        });
      });

      it('reads stored puck blocks it cannot parse as none and logs them', () => {
        const warn = vi
          .spyOn(Logger.prototype, 'warn')
          .mockImplementation(() => undefined);

        expect(
          resolver.puckBlocks(withOldPuckBlocks, false, {}, editor, false)
        ).toBeNull();
        expect(puckBlockData.flatten).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledWith(
          expect.stringContaining('revision-1')
        );
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

      it('is null for stored puck blocks it cannot parse', () => {
        vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

        expect(resolver.puckBlocksChangeAt(withOldPuckBlocks)).toBeNull();
      });
    });

    describe('puckRegistry', () => {
      const puckRegistry = {
        components: { HeroBanner: { html: '<section></section>' } },
        script: 'boot()',
      };

      it('returns the stored registry, without null entries', () => {
        expect(
          resolver.puckRegistry({
            puckRegistry: { ...puckRegistry, styles: null },
          } as unknown as ArticleRevision)
        ).toEqual(puckRegistry);
      });

      it('is null for a revision without a registry', () => {
        expect(
          resolver.puckRegistry({
            puckRegistry: null,
          } as unknown as ArticleRevision)
        ).toBeNull();
      });

      it('reads a stored registry it cannot parse as none and logs it', () => {
        const warn = vi
          .spyOn(Logger.prototype, 'warn')
          .mockImplementation(() => undefined);

        expect(
          resolver.puckRegistry({
            id: 'revision-2',
            puckRegistry: { components: [{ name: 'HeroBanner' }] },
          } as unknown as ArticleRevision)
        ).toBeNull();
        expect(warn).toHaveBeenCalledWith(
          expect.stringContaining('revision-2')
        );
      });
    });
  });
});
