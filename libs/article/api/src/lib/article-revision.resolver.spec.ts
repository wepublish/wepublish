import { Test } from '@nestjs/testing';
import { limitAnswerCache } from '@wepublish/public-content-cache/api';
import { createMock } from '@wepublish/testing';
import { BlockTreeLoader } from '@wepublish/block-content/api';
import { ImageDataloaderService } from '@wepublish/image/api';
import { ArticleRevisionResolver } from './article-revision.resolver';
import {
  ArticleAuthorDataloader,
  ArticleSocialMediaAuthorDataloader,
} from '@wepublish/author/api';
import type { ArticleRevision } from './article.model';

vi.mock('@wepublish/public-content-cache/api', async importOriginal => ({
  ...(await importOriginal<object>()),
  limitAnswerCache: vi.fn(),
}));

describe('ArticleRevisionResolver', () => {
  let resolver: ArticleRevisionResolver;
  let loader: BlockTreeLoader;

  const now = new Date('2026-01-05T09:00:00Z');
  const loaded = [{ type: 'title' }];

  beforeEach(async () => {
    vi.clearAllMocks();
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

      await resolver.blocks(revision, true, context);

      expect(limitAnswerCache).toHaveBeenCalledWith(context, 1800);
    });

    it('leaves the answer cache alone for untimed blocks', async () => {
      await resolver.blocks(revision, true, {});

      expect(limitAnswerCache).not.toHaveBeenCalled();
    });

    it('passes on whether to omit blocks that should not display', async () => {
      expect(await resolver.blocks(revision, true, {})).toBe(loaded);
      expect(loader.loadBlocks).toHaveBeenCalledWith(revision.blocks, {
        onlyDisplayed: true,
      });

      await resolver.blocks(revision, false, {});

      expect(loader.loadBlocks).toHaveBeenLastCalledWith(revision.blocks, {
        onlyDisplayed: false,
      });
    });
  });
});
