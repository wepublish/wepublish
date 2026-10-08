import { SitemapHomepageQuery } from '@wepublish/website/api';
import { homepageLastmod } from './homepage-lastmod';

type Homepage = NonNullable<SitemapHomepageQuery['page']>;

const articleTeaser = (publishedAt: string | null) => ({
  __typename: 'ArticleTeaser',
  article: { id: publishedAt, latest: { publishedAt } },
});
const pageTeaser = (publishedAt: string) => ({
  __typename: 'PageTeaser',
  page: { id: publishedAt, latest: { publishedAt } },
});
const eventTeaser = (modifiedAt: string) => ({
  __typename: 'EventTeaser',
  event: { id: modifiedAt, modifiedAt },
});
const customTeaser = { __typename: 'CustomTeaser' };

const homepage = (publishedAt: string | null, blocks: unknown[]) =>
  ({ id: 'home', latest: { publishedAt, blocks } }) as unknown as Homepage;

describe('homepageLastmod', () => {
  it('takes the newest date of what the homepage teases', () => {
    expect(
      homepageLastmod(
        homepage('2026-01-01T00:00:00.000Z', [
          {
            __typename: 'TeaserGridBlock',
            teasers: [
              articleTeaser('2026-03-01T00:00:00.000Z'),
              pageTeaser('2026-02-01T00:00:00.000Z'),
            ],
          },
          {
            __typename: 'TeaserListBlock',
            teasers: [eventTeaser('2026-04-01T00:00:00.000Z')],
          },
        ])
      )
    ).toBe('2026-04-01T00:00:00.000Z');
  });

  it('falls back to the homepage itself when it teases nothing newer', () => {
    expect(
      homepageLastmod(
        homepage('2026-05-01T00:00:00.000Z', [
          {
            __typename: 'TeaserSlotsBlock',
            teasers: [articleTeaser('2026-03-01T00:00:00.000Z')],
          },
          { __typename: 'RichTextBlock' },
        ])
      )
    ).toBe('2026-05-01T00:00:00.000Z');
  });

  it('reads flex teasers', () => {
    expect(
      homepageLastmod(
        homepage(null, [
          {
            __typename: 'TeaserGridFlexBlock',
            flexTeasers: [
              { teaser: articleTeaser('2026-06-01T00:00:00.000Z') },
              { teaser: null },
            ],
          },
        ])
      )
    ).toBe('2026-06-01T00:00:00.000Z');
  });

  it('looks into flex blocks and block templates', () => {
    expect(
      homepageLastmod(
        homepage(null, [
          {
            __typename: 'FlexBlock',
            blocks: [
              {
                block: {
                  __typename: 'BlockTemplateBlock',
                  template: {
                    modifiedAt: '2026-01-01T00:00:00.000Z',
                    blocks: [
                      {
                        __typename: 'TeaserGridBlock',
                        teasers: [articleTeaser('2026-07-01T00:00:00.000Z')],
                      },
                    ],
                  },
                },
              },
              { block: null },
            ],
          },
        ])
      )
    ).toBe('2026-07-01T00:00:00.000Z');
  });

  it('counts a template change as a homepage change', () => {
    expect(
      homepageLastmod(
        homepage('2026-01-01T00:00:00.000Z', [
          {
            __typename: 'BlockTemplateBlock',
            template: { modifiedAt: '2026-08-01T00:00:00.000Z', blocks: [] },
          },
        ])
      )
    ).toBe('2026-08-01T00:00:00.000Z');
  });

  it('ignores custom, empty and unpublished teasers', () => {
    expect(
      homepageLastmod(
        homepage('2026-01-01T00:00:00.000Z', [
          {
            __typename: 'TeaserGridBlock',
            teasers: [
              customTeaser,
              null,
              articleTeaser(null),
              { __typename: 'ArticleTeaser', article: null },
            ],
          },
        ])
      )
    ).toBe('2026-01-01T00:00:00.000Z');
  });

  it('has no lastmod without a homepage', () => {
    expect(homepageLastmod(undefined)).toBeUndefined();
    expect(homepageLastmod(homepage(null, []))).toBeUndefined();
  });
});
