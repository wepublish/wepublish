import { FullArticleFragment } from '@wepublish/website/api';
import { generateFeed } from './feed-generator';
import {
  mockArticle,
  mockArticleRevision,
  mockArticleRevisionAuthor,
  mockAuthor,
  mockImage,
  mockPaywall,
  mockRichTextBlock,
  mockRichTextParagraph,
  mockTitleBlock,
} from '@wepublish/mocks/website';
import type { Feed } from 'feed';
import { faker } from '@faker-js/faker';

const author = mockAuthor();

const generate = generateFeed({
  id: 'https://wepublish.ch',
  copyright: 'We.Publish',
  title: 'We.Publish Feed',
  categories: ['foo', 'bar'],
  author: {
    name: author.name,
    link: author.url,
  },
  updated: new Date('2023-01-01'),
});

faker.seed(1);

it('should setup the feed', async () => {
  const articles = [
    mockArticle({ id: '1' }),
    mockArticle({ id: '2' }),
  ] as FullArticleFragment[];

  expect(await generate(articles)).toMatchSnapshot();
});

it('should generate the RSS feed', async () => {
  const articles = [
    mockArticle({ id: '1' }),
    mockArticle({ id: '2' }),
  ] as FullArticleFragment[];

  expect((await generate(articles)).rss2()).toMatchSnapshot();
});

it('should generate the atom feed', async () => {
  const articles = [
    mockArticle({ id: '1' }),
    mockArticle({ id: '2' }),
  ] as FullArticleFragment[];

  expect((await generate(articles)).atom1()).toMatchSnapshot();
});

it('should generate the json feed', async () => {
  const articles = [
    mockArticle({ id: '1' }),
    mockArticle({ id: '2' }),
  ] as FullArticleFragment[];

  expect((await generate(articles)).json1()).toMatchSnapshot();
});

it('should generate the json feed for articles with no authors', async () => {
  const articles = [
    mockArticle({
      id: '1',
      latest: {
        __typename: 'ArticleRevision',
        id: '1',
        publishedAt: new Date('2023-01-01').toISOString(),
        createdAt: new Date('2023-01-01').toISOString(),
        blocks: [],
        authors: [],
        properties: [],
        image: undefined,
        lead: 'Test lead',
        title: 'Test title',
        preTitle: null,
        socialMediaDescription: null,
        socialMediaImage: null,
        socialMediaTitle: null,
        canonicalUrl: null,
      },
    }),
  ] as FullArticleFragment[];

  expect(() => generate(articles).then(f => f.json1())).not.toThrow();
});

it('should escape ampersands in image URLs for RSS feed', async () => {
  const imageWithSignature = mockImage();
  imageWithSignature.url =
    'https://example.com/image.jpg?quality=52&sig=7Qm1DF&format=webp';

  const articles = [
    mockArticle({
      id: '1',
      latest: {
        __typename: 'ArticleRevision',
        id: '1',
        publishedAt: new Date('2023-01-01').toISOString(),
        createdAt: new Date('2023-01-01').toISOString(),
        blocks: [],
        authors: [mockArticleRevisionAuthor()],
        properties: [],
        image: imageWithSignature,
        lead: 'Test lead',
        title: 'Test title',
        preTitle: 'Test pretitle',
        socialMediaDescription: 'Test social media description',
        socialMediaImage: imageWithSignature,
        socialMediaTitle: 'Test social media title',
        canonicalUrl: 'https://example.com',
      },
    }),
  ] as FullArticleFragment[];

  const rss = (await generate(articles)).rss2();

  expect(rss).toContain('&amp;sig=');
  expect(rss).toContain('&amp;format=');
});

describe('the item content', () => {
  const body = () => [
    mockTitleBlock({ title: 'Headline', lead: null }),
    mockRichTextBlock({ richText: mockRichTextParagraph('First body') }),
    mockRichTextBlock({ richText: mockRichTextParagraph('Second body') }),
  ];
  const fullBody = '<h2>Headline</h2><p>First body</p><p>Second body</p>';

  const article = (overrides: Partial<FullArticleFragment> = {}) =>
    mockArticle({
      id: '1',
      latest: mockArticleRevision({ lead: 'Only the lead', blocks: body() }),
      ...overrides,
    });

  const paywalled = () =>
    article({ paywall: mockPaywall({ active: true, hideContentAfter: 2 }) });

  const contentOf = (feed: Feed) =>
    JSON.parse(feed.json1()).items[0].content_html;

  it('publishes the article body in every format', async () => {
    const feed = await generate([article()]);

    expect(feed.rss2()).toContain(
      `<content:encoded><![CDATA[${fullBody}]]></content:encoded>`
    );
    expect(feed.atom1()).toContain(fullBody);
    expect(contentOf(feed)).toBe(fullBody);
  });

  it('falls back to the lead when no block can be serialised', async () => {
    const feed = await generate([
      article({
        latest: mockArticleRevision({
          lead: 'Only the lead',
          blocks: [mockTitleBlock({ title: null, lead: null })],
        }),
      }),
    ]);

    expect(contentOf(feed)).toBe('Only the lead');
  });

  it('keeps a paywalled article to its lead by default', async () => {
    const feed = await generate([paywalled()]);

    expect(contentOf(feed)).toBe('Only the lead');
    expect(feed.rss2()).not.toContain('First body');
  });

  it('keeps a paywalled article to its lead when the medium chose lead', async () => {
    expect(
      contentOf(await generate([paywalled()], { paywalledContent: 'lead' }))
    ).toBe('Only the lead');
  });

  it('publishes the blocks shown before the paywall when the medium chose visible', async () => {
    expect(
      contentOf(await generate([paywalled()], { paywalledContent: 'visible' }))
    ).toBe('<h2>Headline</h2><p>First body</p>');
  });

  it('publishes a paywalled article in full when the medium chose full', async () => {
    expect(
      contentOf(await generate([paywalled()], { paywalledContent: 'full' }))
    ).toBe(fullBody);
  });

  it('publishes an article in full once its paywall is switched off', async () => {
    expect(
      contentOf(
        await generate([article({ paywall: mockPaywall({ active: false }) })])
      )
    ).toBe(fullBody);
  });

  it('never republishes the body of an article from a peer', async () => {
    expect(
      contentOf(
        await generate([article({ peerId: 'peer-1' })], {
          paywalledContent: 'full',
        })
      )
    ).toBe('Only the lead');
  });

  it('describes the item with the SEO description', async () => {
    const feed = await generate([
      article({
        latest: mockArticleRevision({
          lead: 'Only the lead',
          seoDescription: 'The SEO description',
          blocks: body(),
        }),
      }),
    ]);

    expect(JSON.parse(feed.json1()).items[0].summary).toBe(
      'The SEO description'
    );
  });
});
