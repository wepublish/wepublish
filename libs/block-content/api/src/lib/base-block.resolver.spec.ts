import { Test } from '@nestjs/testing';
import { createMock } from '@wepublish/testing';
import { BaseBlockResolver } from './base-block.resolver';
import { BlockStylesDataloaderService } from './block-styles/block-styles-dataloader.service';
import { BlockType } from './block-type.model';
import type { BaseBlock } from './base-block.model';

describe('BaseBlockResolver', () => {
  let resolver: BaseBlockResolver;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BaseBlockResolver,
        {
          provide: BlockStylesDataloaderService,
          useValue: createMock(BlockStylesDataloaderService),
        },
      ],
    }).compile();

    resolver = module.get(BaseBlockResolver);
  });

  const block = (overrides: Partial<BaseBlock<BlockType>> = {}) =>
    ({ type: BlockType.Title, ...overrides }) as BaseBlock<BlockType>;

  describe('shouldDisplay', () => {
    it('is true for an untimed, enabled block', () => {
      expect(resolver.shouldDisplay(block())).toBe(true);
    });

    it('is false for a disabled block', () => {
      expect(resolver.shouldDisplay(block({ disabled: true }))).toBe(false);
    });

    it('is false while the block is outside its timing', () => {
      vi.useFakeTimers().setSystemTime(new Date('2026-01-05T09:00:00Z'));

      expect(
        resolver.shouldDisplay(
          block({ timing: { from: new Date('2026-02-01T00:00:00Z') } })
        )
      ).toBe(false);

      vi.useRealTimers();
    });

    it('is true while the block is inside its timing', () => {
      vi.useFakeTimers().setSystemTime(new Date('2026-01-05T09:00:00Z'));

      expect(
        resolver.shouldDisplay(
          block({ timing: { from: new Date('2026-01-01T00:00:00Z') } })
        )
      ).toBe(true);

      vi.useRealTimers();
    });
  });
});
