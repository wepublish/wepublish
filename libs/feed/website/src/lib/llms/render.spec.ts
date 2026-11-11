import {
  FullNavigationFragment,
  LlmsArticleFragment,
  LlmsContentDocument,
  LlmsPageFragment,
} from '@wepublish/website/api';
import { renderLlmsTxt } from './render';
import { SitemapClient } from '../sitemap';

const siteUrl = 'https://example.com';
const now = new Date('2026-11-04T12:00:00.000Z');

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

type Link = FullNavigationFragment['links'][number];

const pageLink = (label: string, path: string): Link => ({
  __typename: 'PageNavigationLink',
  label,
  page: { __typename: 'Page', url: `${siteUrl}${path}` },
});

const externalLink = (label: string, url: string | null): Link => ({
  __typename: 'ExternalNavigationLink',
  label,
  url,
});

const navigation = (
  key: string,
  name: string,
  links: Link[]
): FullNavigationFragment => ({
  __typename: 'Navigation',
  id: key,
  key,
  name,
  links,
});

const clientWith = ({
  articles = [],
  pages = [],
  navigations = [],
}: {
  articles?: LlmsArticleFragment[];
  pages?: LlmsPageFragment[];
  navigations?: FullNavigationFragment[];
} = {}) =>
  ({
    query: vi.fn(async () => ({
      data: {
        articles: { nodes: articles },
        pages: { nodes: pages },
        navigations,
      },
    })),
  }) as unknown as SitemapClient & { query: ReturnType<typeof vi.fn> };

const render = (
  config: Parameters<typeof renderLlmsTxt>[0],
  client = clientWith()
) => renderLlmsTxt(config, { client, siteUrl, now });

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

  it('dates the file in its body', async () => {
    expect(await render({ title: 'Example' })).toContain(
      '\nLast updated: 2026-11-04\n'
    );
  });

  it('groups links by the navigations the site itself shows', async () => {
    const txt = await render(
      { title: 'Example' },
      clientWith({
        navigations: [
          navigation('main', 'Themen', [pageLink('Politik', '/politik')]),
          navigation('footer', 'Über uns', [
            pageLink('Impressum', '/impressum'),
            externalLink('Shop', 'https://shop.example.com'),
          ]),
        ],
        pages: [page('unlisted')],
      })
    );

    expect(txt).toContain(
      `## Themen\n\n- [Example](${siteUrl})\n- [Politik](${siteUrl}/politik)\n`
    );
    expect(txt).toContain(
      `## Über uns\n\n- [Impressum](${siteUrl}/impressum)\n- [Shop](https://shop.example.com)\n`
    );
    expect(txt).not.toContain('## Pages');
    expect(txt).not.toContain('unlisted');
  });

  it('lists every url once, under the first navigation that links it', async () => {
    const txt = await render(
      { title: 'Example' },
      clientWith({
        navigations: [
          navigation('main', 'Main', [pageLink('Politik', '/politik')]),
          navigation('footer', 'Footer', [
            pageLink('Politik again', '/politik'),
            pageLink('Home', '/'),
          ]),
        ],
      })
    );

    expect(txt.match(/\/politik\)/g)).toHaveLength(1);
    expect(txt).not.toContain('## Footer');
  });

  it('makes relative navigation links absolute and skips empty ones', async () => {
    const txt = await render(
      { title: 'Example' },
      clientWith({
        navigations: [
          navigation('main', 'Main', [
            externalLink('Agenda', '/event'),
            externalLink('Nowhere', null),
          ]),
        ],
      })
    );

    expect(txt).toContain(`- [Agenda](${siteUrl}/event)\n`);
    expect(txt).not.toContain('Nowhere');
  });

  it('leaves out pages behind a login', async () => {
    const txt = await render(
      { title: 'Example' },
      clientWith({
        navigations: [
          navigation('main', 'Main', [
            pageLink('Anmelden', '/login'),
            pageLink('Registrieren', '/signup'),
            pageLink('Konto', '/profile/subscription'),
            pageLink('Politik', '/politik'),
          ]),
        ],
      })
    );

    expect(txt).toContain('Politik');
    expect(txt).not.toMatch(/Anmelden|Registrieren|Konto/);
  });

  it('falls back to the published pages when the site has no navigation', async () => {
    const txt = await render(
      { title: 'Example' },
      clientWith({ pages: [page('about', { description: 'Who we are.' })] })
    );

    expect(txt).toContain(
      '## Pages\n\n' +
        `- [Example](${siteUrl})\n` +
        `- [Page about](${siteUrl}/about): Who we are.\n`
    );
  });

  it('lists the latest articles with their lead', async () => {
    const txt = await render(
      { title: 'Example' },
      clientWith({ articles: [article('one', { lead: 'What happened.' })] })
    );

    expect(txt).toContain(
      `## Latest articles\n\n- [Article one](${siteUrl}/a/one): What happened.\n`
    );
  });

  it('prefers the seo title and description over the editorial ones', async () => {
    const txt = await render(
      { title: 'Example' },
      clientWith({
        articles: [
          article('one', {
            seoTitle: 'SEO one',
            lead: 'Lead',
            seoDescription: 'SEO lead',
          }),
        ],
        pages: [
          page('about', { seoTitle: 'SEO about', seoDescription: 'SEO desc' }),
        ],
      })
    );

    expect(txt).toContain(`- [SEO one](${siteUrl}/a/one): SEO lead`);
    expect(txt).toContain(`- [SEO about](${siteUrl}/about): SEO desc`);
  });

  it('keeps every note to its first sentence, on one line', async () => {
    const txt = await render(
      { title: 'Example' },
      clientWith({
        articles: [
          article('one', {
            title: 'A [b] c',
            lead: 'First  part\nof it. Second sentence! Third?',
          }),
        ],
      })
    );

    expect(txt).toContain(
      `- [A \\[b\\] c](${siteUrl}/a/one): First part of it.\n`
    );
  });

  it('cuts a note without a sentence end at a word', async () => {
    const txt = await render(
      { title: 'Example' },
      clientWith({ articles: [article('one', { lead: 'word '.repeat(80) })] })
    );
    const note = txt.match(/\/a\/one\): (.*)\n/)?.[1] ?? '';

    expect(note.length).toBeLessThanOrEqual(161);
    expect(note).toMatch(/word…$/);
  });

  it('skips peered articles, untitled entries and the homepage page', async () => {
    const txt = await render(
      { title: 'Example', homepageSlug: 'home' },
      clientWith({
        articles: [
          article('own'),
          article('peered', {}, { peerId: 'peer' }),
          article('untitled', { title: null }),
        ],
        pages: [page('home'), page('about')],
      })
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
      clientWith({
        articles: [article('shown'), article('hidden')],
        pages: [page('about')],
      })
    );

    expect(txt).toContain(`(${siteUrl}/en/a/shown)`);
    expect(txt).not.toContain('hidden');
    expect(txt).toContain(`(${siteUrl}/en/about)`);
  });

  it('keeps the list curated: ten articles and twenty pages unless configured', async () => {
    const client = clientWith();
    await render({ title: 'Example' }, client);
    await render({ title: 'Example', llmsArticleCount: 5 }, client);

    expect(client.query).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        query: LlmsContentDocument,
        variables: { articleCount: 10, pageCount: 20 },
        fetchPolicy: 'no-cache',
      })
    );
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        variables: expect.objectContaining({ articleCount: 5 }),
      })
    );
  });

  it('leaves out the articles section when there are none', async () => {
    expect(await render({ title: 'Example' })).not.toContain('## Latest');
  });
});
