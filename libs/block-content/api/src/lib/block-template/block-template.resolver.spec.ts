import { Test } from '@nestjs/testing';
import { createMock } from '@wepublish/testing';
import { BlockTemplateResolver } from './block-template.resolver';
import { BlockTemplateService } from './block-template.service';
import { BlockTemplateDataloaderService } from './block-template-dataloader.service';
import { BlockTreeLoader } from '../block-tree/block-tree-loader';
import { BlockType } from '../block-type.model';
import type { BlockTemplate } from './block-template.model';
import { skipAnswerCache } from '@wepublish/public-content-cache/api';
import {
  CanGetArticle,
  CanGetPage,
  CanUpdateBlockTemplate,
} from '@wepublish/permissions';
import type { UserSession } from '@wepublish/authentication/api';

vi.mock('@wepublish/public-content-cache/api', async importOriginal => ({
  ...(await importOriginal<object>()),
  skipAnswerCache: vi.fn(),
}));

const userWith = (...permissionIDs: string[]) =>
  ({ roles: [{ id: 'role', permissionIDs }] }) as unknown as UserSession;

describe('BlockTemplateResolver', () => {
  let resolver: BlockTemplateResolver;

  const loaded = [{ type: BlockType.Title }];
  let loader: BlockTreeLoader;

  beforeEach(async () => {
    vi.clearAllMocks();
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
            loadTemplateBlocks: vi.fn(async () => loaded),
          },
        },
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
});
