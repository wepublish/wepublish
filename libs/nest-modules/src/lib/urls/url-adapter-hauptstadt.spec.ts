import { Article, Tag } from '@prisma/client';
import { HauptstadtURLAdapter } from './url-adapter-hauptstadt';

const article = {
  id: 'article-id',
  slug: 'article-slug',
} as Article;

const tag = (name: string) => ({ tag: name }) as Tag;

describe('HauptstadtURLAdapter', () => {
  let adapter: HauptstadtURLAdapter;

  beforeEach(() => {
    adapter = new HauptstadtURLAdapter('https://example.com');
  });

  it('should return the default article url without tags', async () => {
    expect(await adapter.getArticleUrl(article)).toEqual(
      'https://example.com/a/article-slug?articleId=article-id'
    );
  });

  it('should return the default article url for unarchived articles', async () => {
    expect(
      await adapter.getArticleUrl(article, [tag('nachtleben'), tag('kultur')])
    ).toEqual('https://example.com/a/article-slug?articleId=article-id');
  });

  it('should return the archive url for archived articles', async () => {
    expect(
      await adapter.getArticleUrl(article, [
        tag('nachtleben'),
        tag('archiviert'),
      ])
    ).toEqual('https://example.com/arch/article-slug?articleId=article-id');
  });

  it('should match the archived tag case-insensitively', async () => {
    expect(await adapter.getArticleUrl(article, [tag('Archiviert')])).toEqual(
      'https://example.com/arch/article-slug?articleId=article-id'
    );
  });

  it('should append preview to the archive url', async () => {
    expect(
      await adapter.getArticlePreviewUrl(article, [tag('archiviert')])
    ).toEqual(
      'https://example.com/arch/article-slug?articleId=article-id&preview'
    );
  });
});
