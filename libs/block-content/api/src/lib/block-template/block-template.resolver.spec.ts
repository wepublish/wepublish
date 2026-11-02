import { Test } from '@nestjs/testing';
import { createMock } from '@wepublish/testing';
import { BlockTemplateResolver } from './block-template.resolver';
import { BlockTemplateService } from './block-template.service';
import { BlockTemplateDataloaderService } from './block-template-dataloader.service';
import { BlockTreeLoader } from '../block-tree/block-tree-loader';
import { BlockType } from '../block-type.model';
import type { BlockTemplate } from './block-template.model';
import {
  limitAnswerCache,
  skipAnswerCache,
} from '@wepublish/public-content-cache/api';
import { Logger } from '@nestjs/common';
import { ApiBlock, flattenPuckBlocks } from '@wepublish/puck-content/api';
import { PuckBlockDataLoader } from '../puck/puck-block-data.loader';
import {
  CanGetArticle,
  CanGetPage,
  CanUpdateBlockTemplate,
} from '@wepublish/permissions';
import type { UserSession } from '@wepublish/authentication/api';

vi.mock('@wepublish/public-content-cache/api', async importOriginal => ({
  ...(await importOriginal<object>()),
  limitAnswerCache: vi.fn(),
  skipAnswerCache: vi.fn(),
}));

const userWith = (...permissionIDs: string[]) =>
  ({ roles: [{ id: 'role', permissionIDs }] }) as unknown as UserSession;

describe('BlockTemplateResolver', () => {
  let resolver: BlockTemplateResolver;

  const loaded = [{ type: BlockType.Title }];
  const now = new Date('2026-01-05T09:00:00Z');
  const puckBlockData = {
    flatten: vi.fn(flattenPuckBlocks),
  } as unknown as PuckBlockDataLoader;
  let loader: BlockTreeLoader;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        BlockTemplateResolver,
        {
          provide: BlockTemplateService,
          useValue: createMock(BlockTemplateService),
        },
        {
          provide: BlockTemplateDataloaderService,
          useValue: createMock(BlockTemplateDataloaderService),
        },
        {
          provide: BlockTreeLoader,
          useValue: {
            ...createMock(BlockTreeLoader),
            now,
            loadTemplateBlocks: vi.fn(async () => loaded),
          },
        },
        { provide: PuckBlockDataLoader, useValue: puckBlockData },
      ],
    }).compile();

    resolver = module.get(BlockTemplateResolver);
    loader = module.get(BlockTreeLoader);
  });

  const template = { id: 'tpl', blocks: [] } as unknown as BlockTemplate;

  describe('blocks', () => {
    it('omits blocks that should not display by default', async () => {
      expect(await resolver.blocks(template, true, {}, undefined)).toBe(loaded);
      expect(loader.loadTemplateBlocks).toHaveBeenCalledWith(template, {
        onlyDisplayed: true,
      });
      expect(skipAnswerCache).not.toHaveBeenCalled();
    });

    it('returns every block to users who edit content', async () => {
      for (const permission of [
        CanUpdateBlockTemplate,
        CanGetArticle,
        CanGetPage,
      ]) {
        const context = {};

        await resolver.blocks(
          template,
          false,
          context,
          userWith(permission.id)
        );

        expect(loader.loadTemplateBlocks).toHaveBeenLastCalledWith(template, {
          onlyDisplayed: false,
        });
        expect(skipAnswerCache).toHaveBeenLastCalledWith(context);
      }
    });

    it('never returns hidden blocks to anyone else', async () => {
      const context = {};

      await resolver.blocks(template, false, context, undefined);

      expect(loader.loadTemplateBlocks).toHaveBeenLastCalledWith(template, {
        onlyDisplayed: true,
      });
      expect(skipAnswerCache).toHaveBeenCalledWith(context);
    });
  });
  describe('linked template ids', () => {
    it('lists the templates the template links, directly or indirectly', async () => {
      const service = (
        resolver as unknown as {
          blockTemplateService: BlockTemplateService;
        }
      ).blockTemplateService;
      const template = { id: 't', blocks: [], puckBlocks: [] } as never;

      vi.mocked(service.linkedTemplateIds).mockResolvedValue(['a', 'b']);

      await expect(resolver.linkedTemplateIds(template)).resolves.toEqual([
        'a',
        'b',
      ]);
      expect(service.linkedTemplateIds).toHaveBeenCalledWith(template);
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
      id: 'tpl',
      blocks: [],
      puckBlocks,
    } as unknown as BlockTemplate;

    const ids = (blocks: { id: string }[] | null) =>
      blocks?.map(block => block.id);

    it('is null for a template without puck blocks', () => {
      expect(
        resolver.puckBlocks(
          { ...withPuckBlocks, puckBlocks: null },
          true,
          {},
          undefined
        )
      ).toBeNull();
    });

    it('omits puck blocks that should not display by default', () => {
      expect(
        ids(resolver.puckBlocks(withPuckBlocks, true, {}, undefined))
      ).toEqual(['shown']);
      expect(puckBlockData.flatten).toHaveBeenCalledWith([puckBlocks[0]], {
        pruned: true,
        now,
        preview: false,
      });
      expect(skipAnswerCache).not.toHaveBeenCalled();
    });

    it('returns every puck block to users who edit templates or content', () => {
      for (const permission of [
        CanUpdateBlockTemplate,
        CanGetArticle,
        CanGetPage,
      ]) {
        const context = {};

        expect(
          ids(
            resolver.puckBlocks(
              withPuckBlocks,
              false,
              context,
              userWith(permission.id)
            )
          )
        ).toEqual(['shown', 'disabled', 'later']);
        expect(skipAnswerCache).toHaveBeenLastCalledWith(context);
      }
    });

    it('never returns hidden puck blocks to anyone else', () => {
      expect(
        ids(resolver.puckBlocks(withPuckBlocks, false, {}, undefined))
      ).toEqual(['shown']);
    });

    it('lets the answer cache expire when the puck blocks change next', () => {
      const context = {};

      resolver.puckBlocks(withPuckBlocks, true, context, undefined);

      expect(limitAnswerCache).toHaveBeenCalledWith(
        context,
        new Date('2026-01-05T09:30:00Z')
      );
    });

    it('reads stored puck blocks it cannot parse as none and logs them', () => {
      const warn = vi
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);

      expect(
        resolver.puckBlocks(
          {
            ...withPuckBlocks,
            puckBlocks: [{ id: 'old', type: 'Heading', data: {} }],
          } as unknown as BlockTemplate,
          false,
          {},
          userWith(CanGetArticle.id)
        )
      ).toBeNull();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('tpl'));
    });

    it('returns the stored registry, without null entries', () => {
      const puckRegistry = {
        components: { HeroBanner: { html: '<section></section>' } },
      };

      expect(
        resolver.puckRegistry({
          ...withPuckBlocks,
          puckRegistry: { ...puckRegistry, styles: null },
        } as unknown as BlockTemplate)
      ).toEqual(puckRegistry);
    });

    it('is null for a template without a registry', () => {
      expect(
        resolver.puckRegistry({ ...withPuckBlocks, puckRegistry: null })
      ).toBeNull();
    });
  });
});
