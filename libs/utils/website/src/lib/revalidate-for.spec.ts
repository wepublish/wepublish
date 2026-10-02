import { revalidateFor } from './revalidate-for';

const article = (blocks: unknown[]) => ({
  __typename: 'Article',
  id: 'a1',
  latest: { __typename: 'ArticleRevision', blocks },
});

const poll = { __typename: 'PollBlock', poll: { id: 'p1', answers: [] } };
const crowdfunding = {
  __typename: 'CrowdfundingBlock',
  crowdfunding: { id: 'c1', revenue: 1200 },
};
const richText = { __typename: 'RichTextBlock', richText: { type: 'doc' } };

describe('revalidateFor', () => {
  it('re-renders an article with a poll every minute', () => {
    expect(revalidateFor(article([richText, poll]))).toBe(60);
  });

  it('re-renders an article with a crowdfunding inside a flex block every minute', () => {
    expect(
      revalidateFor(
        article([
          {
            __typename: 'FlexBlock',
            blocks: [{ alignment: { x: 0 }, block: crowdfunding }],
          },
        ])
      )
    ).toBe(60);
  });

  it('re-renders an article with a crowdfunding from a block template every minute', () => {
    expect(
      revalidateFor(
        article([
          {
            __typename: 'BlockTemplateBlock',
            template: { blocks: [crowdfunding] },
          },
        ])
      )
    ).toBe(60);
  });

  it('re-renders an article that teases an article with a poll every minute', () => {
    expect(
      revalidateFor(
        article([
          {
            __typename: 'TeaserListBlock',
            teasers: [
              {
                __typename: 'ArticleTeaser',
                article: { latest: { blocks: [poll] } },
              },
            ],
          },
        ])
      )
    ).toBe(60);
  });

  it('ignores a poll that is switched off', () => {
    expect(
      revalidateFor(article([{ ...poll, disabled: true }, richText]))
    ).toBe(3600);
  });

  it('keeps an article without live numbers for an hour', () => {
    expect(revalidateFor(article([richText]))).toBe(3600);
  });

  it('re-renders a page with a poll every minute', () => {
    expect(
      revalidateFor({
        __typename: 'Page',
        latest: { __typename: 'PageRevision', blocks: [poll] },
      })
    ).toBe(60);
  });

  it('re-renders a front page that teases an article with a crowdfunding every minute', () => {
    expect(
      revalidateFor({
        __typename: 'Page',
        latest: {
          blocks: [
            {
              __typename: 'TeaserGridFlexBlock',
              flexTeasers: [
                {
                  teaser: {
                    __typename: 'ArticleTeaser',
                    article: { latest: { blocks: [crowdfunding] } },
                  },
                },
              ],
            },
          ],
        },
      })
    ).toBe(60);
  });

  it('keeps a page without live numbers for an hour', () => {
    expect(
      revalidateFor({ __typename: 'Page', latest: { blocks: [richText] } })
    ).toBe(3600);
  });

  it('re-renders after a minute when there is no content', () => {
    expect(revalidateFor(undefined)).toBe(60);
    expect(revalidateFor(null)).toBe(60);
  });

  it('re-renders after a minute when the api answered with errors', () => {
    expect(
      revalidateFor(article([richText]), [{ message: 'Database timeout' }])
    ).toBe(60);
  });

  it('keeps an hour when the api answered without errors', () => {
    expect(revalidateFor(article([richText]), [])).toBe(3600);
    expect(revalidateFor(article([richText]), undefined)).toBe(3600);
  });
});
