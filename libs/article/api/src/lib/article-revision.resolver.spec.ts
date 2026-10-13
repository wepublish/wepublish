import { ArticleRevisionResolver } from './article-revision.resolver';

describe('ArticleRevisionResolver content gate', () => {
  const article = {
    id: 'article-1',
    paywallId: null,
    contentGateDisabled: false,
  };
  const revision = {
    id: 'revision-1',
    articleId: 'article-1',
    blocks: ['a', 'b', 'c', 'd'],
  } as any;
  const session = { type: 'user' } as any;

  const slotTeasersLoader = {
    loadSlotTeasersIntoBlocks: vi.fn(async (blocks: unknown[]) => blocks),
  };
  const articleDataloader = { load: vi.fn() };
  const contentGateAccess = { previewBlocks: vi.fn() };

  const resolver = () =>
    new ArticleRevisionResolver(
      slotTeasersLoader as any,
      {} as any,
      {} as any,
      {} as any,
      articleDataloader as any,
      contentGateAccess as any
    );

  beforeEach(() => {
    slotTeasersLoader.loadSlotTeasersIntoBlocks.mockClear();
    articleDataloader.load.mockReset().mockResolvedValue(article);
    contentGateAccess.previewBlocks
      .mockReset()
      .mockImplementation(async (blocks: unknown[]) => ({
        blocks: blocks.slice(0, 2),
        gated: true,
      }));
  });

  it('only sends the preview blocks of a gated article', async () => {
    expect(await resolver().blocks(revision, false, session)).toEqual([
      'a',
      'b',
    ]);
    expect(contentGateAccess.previewBlocks).toHaveBeenCalledWith(
      revision.blocks,
      article,
      session
    );
  });

  it('sends every block once the website unlocked the gate', async () => {
    expect(await resolver().blocks(revision, true, session)).toEqual(
      revision.blocks
    );
    expect(contentGateAccess.previewBlocks).not.toHaveBeenCalled();
  });

  it('only loads slot teasers for blocks that are sent', async () => {
    await resolver().blocks(revision, false, session);

    expect(slotTeasersLoader.loadSlotTeasersIntoBlocks).toHaveBeenCalledWith([
      'a',
      'b',
    ]);
  });

  it('tells the website that blocks were left out', async () => {
    expect(await resolver().contentGated(revision, session)).toBe(true);
  });

  it('tells the website when nothing was left out', async () => {
    contentGateAccess.previewBlocks.mockResolvedValue({
      blocks: revision.blocks,
      gated: false,
    });

    expect(await resolver().contentGated(revision, session)).toBe(false);
  });

  it('sends every block when the article is gone', async () => {
    articleDataloader.load.mockResolvedValue(null);

    expect(await resolver().blocks(revision, false, session)).toEqual(
      revision.blocks
    );
  });
});
