import { BadRequestException } from '@nestjs/common';
import { ImportPeerArticleService } from './import-peer-article.service';

const clients: Array<{ url: string; headers: Record<string, string> }> = [];
let respond: () => Promise<unknown>;

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
  remote: { ArticleDocument: 'query Article { article { id } }' },
}));
vi.mock('./peer-article.model', () => ({}));
vi.mock('graphql-request', () => ({
  ClientError: class ClientError extends Error {
    constructor(
      public response: { errors?: Array<{ message: string }>; status: number }
    ) {
      super('client error');
    }
  },
  GraphQLClient: class {
    constructor(url: string, options: { headers: Record<string, string> }) {
      clients.push({ url, headers: options.headers });
    }

    request() {
      return respond();
    }
  },
}));

const peer = {
  id: 'peer-1',
  name: 'Peer',
  hostURL: 'https://peer.example',
  token: 'peer-token',
};

const service = () => {
  const imports = new ImportPeerArticleService(
    {
      peer: {
        findUnique: vi.fn().mockResolvedValue(peer),
        findMany: vi.fn().mockResolvedValue([peer]),
      },
      article: { create: vi.fn().mockResolvedValue({ id: 'article-1' }) },
    } as any,
    {} as any,
    {} as any,
    { invalidate: vi.fn(), invalidateDraft: vi.fn() } as any
  );
  Object.assign(imports, {
    __DATALOADER__ArticleDataloaderService: { prime: vi.fn() },
  });
  vi.spyOn(imports as any, 'prepareBlocksForImport').mockResolvedValue([]);

  return imports;
};

describe('ImportPeerArticleService as a peer', () => {
  beforeEach(() => {
    clients.length = 0;
    respond = async () => ({
      article: {
        slug: 'imported',
        url: 'https://peer.example/a/imported',
        tags: [],
        published: { title: 'Imported', authors: [], blocks: [] },
      },
      articles: { nodes: [], totalCount: 0, pageInfo: {} },
    });
  });

  it('presents itself as a peer, so the remote sends the whole article', async () => {
    await service().importArticle('peer-1', 'remote-1', {
      importAuthors: false,
      importContentImages: false,
    } as any);
    await service().getArticles({} as any);

    expect(clients).toHaveLength(2);
    expect(clients.map(({ headers }) => headers['User-Agent'])).toEqual([
      'We.Publish/1.0 Peering',
      'We.Publish/1.0 Peering',
    ]);
  });

  it('says that the peer token is invalid when the remote refuses it', async () => {
    const { ClientError } = await import('graphql-request');
    respond = () =>
      Promise.reject(
        new (ClientError as any)({
          status: 401,
          errors: [{ message: 'Token is invalid' }],
        })
      );

    const importing = service().importArticle('peer-1', 'remote-1', {
      importAuthors: false,
      importContentImages: false,
    } as any);

    await expect(importing).rejects.toThrow(BadRequestException);
    await expect(
      service().importArticle('peer-1', 'remote-1', {} as any)
    ).rejects.toThrow(/token of the peer Peer is no longer valid/);
  });
});
