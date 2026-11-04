import {
  LlmsArticleFragment,
  LlmsContentDocument,
  LlmsPageFragment,
} from '@wepublish/website/api';
import { renderLlmsTxt } from './render';
import { SitemapClient } from '../sitemap';

const siteUrl = 'https://example.com';

const article = (
  id: string,
  latest: Partial<LlmsArticleFragment['latest']> = {},
  extra: Partial<LlmsArticleFragment> = {}
): LlmsArticleFragment => ({
  __typename: 'Article',
  id,
  slug: id,
  url: `${siteUrl}/a/${id}`,
  peerId: null,
  publishedAt: '2026-10-01T00:00:00.000Z',
  tags: [],
  latest: {
    __typename: 'ArticleRevision',
    publishedAt: '2026-10-01T00:00:00.000Z',
    title: `Article ${id}`,
    seoTitle: null,
    socialMediaTitle: null,
    lead: null,
    seoDescription: null,
    ...latest,
  },
  ...extra,
});

const page = (
  slug: string,
  latest: Partial<LlmsPageFragment['latest']> = {}
): LlmsPageFragment => ({
  __typename: 'Page',
  id: slug,
  slug,
  url: `${siteUrl}/${slug}`,
  publishedAt: '2026-10-01T00:00:00.000Z',
  latest: {
    __typename: 'PageRevision',
    publishedAt: '2026-10-01T00:00:00.000Z',
    title: `Page ${slug}`,
    description: null,
    seoTitle: null,
    seoDescription: null,
    ...latest,
  },
});

const clientWith = (
  articles: LlmsArticleFragment[] = [],
  pages: LlmsPageFragment[] = []
) =>
  ({
    query: vi.fn(async () => ({
      data: { articles: { nodes: articles }, pages: { nodes: pages } },
    })),
  }) as unknown as SitemapClient & { query: ReturnType<typeof vi.fn> };

const render = (
  config: Parameters<typeof renderLlmsTxt>[0],
  client = clientWith()
) => renderLlmsTxt(config, { client, siteUrl });

describe('renderLlmsTxt', () => {
  it('opens with the site title as the only h1', async () => {
    const txt = await render({ title: 'Example' });

    expect(txt.startsWith('# Example\n')).toBe(true);
    expect(txt.match(/^# /gm)).toHaveLength(1);
  });

  it('quotes the description as the summary when there is one', async () => {
    expect(
      await render({ title: 'Example', description: 'News from Example.' })
    ).toContain('\n> News from Example.\n');
    expect(await render({ title: 'Example' })).not.toContain('>');
  });

  it('lists pages and articles as markdown links with their summary', async () => {
    const txt = await render(
      { title: 'Example' },
      clientWith(
        [article('one', { lead: 'What happened.' })],
        [page('about', { description: 'Who we are.' })]
      )
    );

    expect(txt).toContain(
      '## Pages\n\n' +
        `- [Example](${siteUrl})\n` +
        `- [Page about](${siteUrl}/about): Who we are.\n`
    );
    expect(txt).toContain(
      `## Articles\n\n- [Article one](${siteUrl}/a/one): What happened.\n`
    );
  });

  it('prefers the seo title and description over the editorial ones', async () => {
    const txt = await render(
      { title: 'Example' },
      clientWith(
        [
          article('one', {
            seoTitle: 'SEO one',
            lead: 'Lead',
            seoDescription: 'SEO lead',
          }),
        ],
        [page('about', { seoTitle: 'SEO about', seoDescription: 'SEO desc' })]
      )
    );

    expect(txt).toContain(`- [SEO one](${siteUrl}/a/one): SEO lead`);
    expect(txt).toContain(`- [SEO about](${siteUrl}/about): SEO desc`);
  });

  it('keeps every entry on one line and its brackets from closing the link', async () => {
    const txt = await render(
      { title: 'Example' },
      clientWith([
        article('one', { title: 'A [b] c', lead: 'First\n\nsecond  line' }),
      ])
    );

    expect(txt).toContain(
      `- [A \\[b\\] c](${siteUrl}/a/one): First second line\n`
    );
  });

  it('skips peered articles, untitled entries and the homepage page', async () => {
    const txt = await render(
      { title: 'Example', homepageSlug: 'home' },
      clientWith(
        [
          article('own'),
          article('peered', {}, { peerId: 'peer' }),
          article('untitled', { title: null }),
        ],
        [page('home'), page('about')]
      )
    );

    expect(txt).toContain('/a/own');
    expect(txt).not.toContain('/a/peered');
    expect(txt).not.toContain('/a/untitled');
    expect(txt).not.toContain('Page home');
    expect(txt).toContain('Page about');
  });

  it('applies the same article filter and url overrides as the sitemap', async () => {
    const txt = await render(
      {
        title: 'Example',
        filterArticle: ({ id }) => id !== 'hidden',
        articleUrl: ({ slug }, url) => `${url}/en/a/${slug}`,
        pageUrl: ({ slug }, url) => `${url}/en/${slug}`,
      },
      clientWith([article('shown'), article('hidden')], [page('about')])
    );

    expect(txt).toContain(`(${siteUrl}/en/a/shown)`);
    expect(txt).not.toContain('hidden');
    expect(txt).toContain(`(${siteUrl}/en/about)`);
  });

  it('asks the API for as many articles as configured, uncached', async () => {
    const client = clientWith();
    await render({ title: 'Example', llmsArticleCount: 5 }, client);

    expect(client.query).toHaveBeenCalledWith(
      expect.objectContaining({
        query: LlmsContentDocument,
        variables: expect.objectContaining({ articleCount: 5 }),
        fetchPolicy: 'no-cache',
      })
    );
  });

  it('leaves out the articles section when there are none', async () => {
    expect(await render({ title: 'Example' })).not.toContain('## Articles');
  });
});
