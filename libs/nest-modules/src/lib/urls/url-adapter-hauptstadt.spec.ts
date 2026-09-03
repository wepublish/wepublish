import { Article, PrismaClient } from '@prisma/client';
import { HauptstadtURLAdapter } from './url-adapter-hauptstadt';

const article = {
  id: 'article-id',
  slug: 'article-slug',
} as Article;

describe('HauptstadtURLAdapter', () => {
  let adapter: HauptstadtURLAdapter;
  let findManyMock: jest.Mock;

  beforeEach(() => {
    findManyMock = jest.fn().mockResolvedValue([]);
    adapter = new HauptstadtURLAdapter('https://example.com', {
      taggedArticles: { findMany: findManyMock },
    } as unknown as PrismaClient);
  });

  it('should return the default article url for unarchived articles', async () => {
    expect(await adapter.getArticleUrl(article)).toEqual(
      'https://example.com/a/article-slug?articleId=article-id'
    );
  });

  it('should return the archive url for archived articles', async () => {
    findManyMock.mockResolvedValue([{ articleId: 'article-id' }]);

    expect(await adapter.getArticleUrl(article)).toEqual(
      'https://example.com/archive/article-slug?articleId=article-id'
    );
  });

  it('should look up the archived tag case-insensitively', async () => {
    await adapter.getArticleUrl(article);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tag: {
            tag: { equals: 'archiviert', mode: 'insensitive' },
          },
        }),
      })
    );
  });

  it('should batch lookups of the same tick into one query', async () => {
    const otherArticle = { id: 'other-id', slug: 'other-slug' } as Article;
    findManyMock.mockResolvedValue([{ articleId: 'other-id' }]);

    const [url, otherUrl] = await Promise.all([
      adapter.getArticleUrl(article),
      adapter.getArticleUrl(otherArticle),
    ]);

    expect(findManyMock).toHaveBeenCalledTimes(1);
    expect(url).toEqual(
      'https://example.com/a/article-slug?articleId=article-id'
    );
    expect(otherUrl).toEqual(
      'https://example.com/archive/other-slug?articleId=other-id'
    );
  });

  it('should append preview to the archive url', async () => {
    findManyMock.mockResolvedValue([{ articleId: 'article-id' }]);

    expect(await adapter.getArticlePreviewUrl(article)).toEqual(
      'https://example.com/archive/article-slug?articleId=article-id&preview'
    );
  });
});
