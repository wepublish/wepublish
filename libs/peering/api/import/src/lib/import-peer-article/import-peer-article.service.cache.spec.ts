import { ImportPeerArticleService } from './import-peer-article.service';

vi.mock('@wepublish/article/api', () => ({
  ArticleDataloaderService: class {},
  mapArticleRevisionAuthors: (authors: unknown) => authors,
}));
vi.mock('@wepublish/block-content/api', () => ({
  BlockType: { Listicle: 'listicle', ImageGallery: 'imageGallery' },
}));
vi.mock('@wepublish/image/api', () => ({
  ImageFetcherService: class {},
  MediaAdapter: class {},
}));
vi.mock('@wepublish/peering/api', () => ({
  createSafeHostUrl: (host: string, path: string) => `${host}/${path}`,
  remote: { Article: 'query Article { article { id } }' },
}));
vi.mock('./peer-article.model', () => ({}));
vi.mock('graphql-request', () => ({
  GraphQLClient: class {
    async request() {
      return {
        article: {
          slug: 'imported',
          url: 'https://peer.example/a/imported',
          tags: [],
          published: { title: 'Imported', authors: [], blocks: [] },
        },
      };
    }
  },
}));

describe('ImportPeerArticleService cache', () => {
  it('clears cached articles and authors after importing an article', async () => {
    const publicContentCache = {
      invalidate: vi.fn().mockResolvedValue(undefined),
      invalidateDraft: vi.fn().mockResolvedValue(undefined),
    };
    const service = new ImportPeerArticleService(
      {
        peer: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'peer-1',
            hostURL: 'https://peer.example',
            token: 'peer-token',
          }),
        },
        article: { create: vi.fn().mockResolvedValue({ id: 'article-1' }) },
      } as any,
      {} as any,
      {} as any,
      publicContentCache as any
    );
    Object.assign(service, {
      __DATALOADER__ArticleDataloaderService: { prime: vi.fn() },
    });
    vi.spyOn(service as any, 'prepareBlocksForImport').mockResolvedValue([]);

    await service.importArticle('peer-1', 'remote-1', {
      importAuthors: false,
      importContentImages: false,
    } as any);

    expect(publicContentCache.invalidateDraft).toHaveBeenCalledWith('articles');
    expect(publicContentCache.invalidate).toHaveBeenCalledWith('authors');
  });
});
