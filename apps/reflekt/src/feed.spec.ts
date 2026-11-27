import {
  mockArticle,
  mockArticleRevision,
  mockPaywall,
  mockRichTextBlock,
  mockRichTextParagraph,
} from '@wepublish/mocks/website';
import {
  FeedArticleListDocument,
  SettingDocument,
} from '@wepublish/website/api';

import { getFeed } from './feed';

const { query } = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('@wepublish/website/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/website/api')>()),
  getApiClient: () => ({ query }),
}));

const article = (
  text: string,
  paywall: ReturnType<typeof mockPaywall> | null
) =>
  mockArticle({
    paywall,
    latest: mockArticleRevision({
      lead: `${text} lead`,
      blocks: [mockRichTextBlock({ richText: mockRichTextParagraph(text) })],
    }),
  });

const respondWith = (feedPaywalledContent: unknown) =>
  query.mockImplementation(async ({ query: document }) =>
    document === SettingDocument ?
      {
        data: {
          setting: {
            id: '1',
            name: 'feedPaywalledContent',
            value: feedPaywalledContent,
          },
        },
      }
    : {
        data: {
          articles: {
            nodes: [
              article('Mandian Tuan', null),
              article('Behind the wall', mockPaywall({ active: true })),
            ],
          },
        },
      }
  );

const feed = () =>
  getFeed('https://reflekt.test/rss.xml', 'https://reflekt.test');

describe('reflekt feed', () => {
  beforeEach(() => {
    query.mockReset();
  });

  it('queries the full-text feed document and the paywall choice', async () => {
    respondWith('lead');

    await feed();

    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({ query: FeedArticleListDocument })
    );
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        query: SettingDocument,
        variables: { name: 'feedPaywalledContent' },
      })
    );
  });

  it('publishes the body of a free article', async () => {
    respondWith('lead');

    expect((await feed()).rss2()).toContain('<p>Mandian Tuan</p>');
  });

  it('follows the paywall choice of the medium', async () => {
    respondWith('full');

    expect((await feed()).rss2()).toContain('<p>Behind the wall</p>');
  });

  it('keeps paywalled articles to their lead when the choice cannot be read', async () => {
    query.mockImplementation(async ({ query: document }) => {
      if (document === SettingDocument) {
        throw new Error('setting unavailable');
      }

      return {
        data: {
          articles: {
            nodes: [article('Behind the wall', mockPaywall({ active: true }))],
          },
        },
      };
    });

    const rss = (await feed()).rss2();

    expect(rss).not.toContain('<p>Behind the wall</p>');
    expect(rss).toContain('Behind the wall lead');
  });
});
