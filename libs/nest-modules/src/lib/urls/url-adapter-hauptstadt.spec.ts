import { Article, PrismaClient } from '@prisma/client';
import { HauptstadtURLAdapter } from './url-adapter-hauptstadt';

const article = {
  id: 'article-id',
  slug: 'article-slug',
} as Article;

const row = (articleId: string, tag: string) => ({ articleId, tag: { tag } });

describe('HauptstadtURLAdapter', () => {
  let adapter: HauptstadtURLAdapter;
  let findManyMock: jest.Mock;

  beforeEach(() => {
    findManyMock = jest.fn().mockResolvedValue([]);
    adapter = new HauptstadtURLAdapter('https://example.com', {
      taggedArticles: { findMany: findManyMock },
    } as unknown as PrismaClient);
  });

  it('should return the default article url for untagged articles', async () => {
    expect(await adapter.getArticleUrl(article)).toEqual(
      'https://example.com/a/article-slug?articleId=article-id'
    );
  });

  it('should return the ausgang-in-bern url without params for unarchived nachtleben articles', async () => {
    findManyMock.mockResolvedValue([row('article-id', 'Nachtleben')]);

    expect(await adapter.getArticleUrl(article)).toEqual(
      'https://example.com/ausgang-in-bern'
    );
  });

  it('should return the archive url for archived articles', async () => {
    findManyMock.mockResolvedValue([row('article-id', 'archiviert')]);

    expect(await adapter.getArticleUrl(article)).toEqual(
      'https://example.com/archive/article-slug?articleId=article-id'
    );
  });

  it('should prefer the archive url for archived nachtleben articles', async () => {
    findManyMock.mockResolvedValue([
      row('article-id', 'Nachtleben'),
      row('article-id', 'archiviert'),
    ]);

    expect(await adapter.getArticleUrl(article)).toEqual(
      'https://example.com/archive/article-slug?articleId=article-id'
    );
  });

  it('should look up the tags case-insensitively', async () => {
    await adapter.getArticleUrl(article);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tag: {
            tag: { in: ['archiviert', 'nachtleben'], mode: 'insensitive' },
          },
        }),
      })
    );
  });

  it('should batch lookups of the same tick into one query', async () => {
    const otherArticle = { id: 'other-id', slug: 'other-slug' } as Article;
    findManyMock.mockResolvedValue([row('other-id', 'archiviert')]);

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

  it('should keep previews on the article route for nachtleben articles', async () => {
    findManyMock.mockResolvedValue([row('article-id', 'nachtleben')]);

    expect(await adapter.getArticlePreviewUrl(article)).toEqual(
      'https://example.com/a/article-slug?articleId=article-id&preview'
    );
  });

  it('should append preview to the archive url', async () => {
    findManyMock.mockResolvedValue([row('article-id', 'archiviert')]);

    expect(await adapter.getArticlePreviewUrl(article)).toEqual(
      'https://example.com/archive/article-slug?articleId=article-id&preview'
    );
  });
});
