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
});
