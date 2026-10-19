import { Test } from '@nestjs/testing';
import { createMock } from '@wepublish/testing';
import { BlockTemplateResolver } from './block-template.resolver';
import { BlockTemplateService } from './block-template.service';
import { BlockTemplateDataloaderService } from './block-template-dataloader.service';
import { BlockTreeLoader } from '../block-tree/block-tree-loader';
import { BlockType } from '../block-type.model';
import type { BlockTemplate } from './block-template.model';

describe('BlockTemplateResolver', () => {
  let resolver: BlockTemplateResolver;

  const loaded = [{ type: BlockType.Title }];
  let loader: BlockTreeLoader;

  beforeEach(async () => {
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
    it('passes on whether to omit blocks that should not display', async () => {
      expect(await resolver.blocks(template, true)).toBe(loaded);
      expect(loader.loadTemplateBlocks).toHaveBeenCalledWith(template, {
        onlyDisplayed: true,
      });

      await resolver.blocks(template, false);

      expect(loader.loadTemplateBlocks).toHaveBeenLastCalledWith(template, {
        onlyDisplayed: false,
      });
    });
  });
});
