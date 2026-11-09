import { gql, InMemoryCache } from '@apollo/client';
import { mergeDeepRight } from 'ramda';

import { flattenBlockTemplates } from './flatten-block-templates';
import { mergeBlockSelections } from './merge-block-selections';
import { omitSensitiveData } from './omit-sensitive-data';
import possibleTypes from './possible-types';

/**
 * An article teaser asks for `article.latest.blocks` but only selects fields
 * inside `... on PollBlock`, so every other block comes back as nothing but a
 * `__typename` (`schemas/block-content.graphql`, `FullArticleTeaser`).
 *
 * Apollo replaces an array of embedded objects rather than merging it, so that
 * shallow write lands on top of whatever the article route already read in
 * full. The next read of the article is then incomplete, `cache-first` falls
 * through to the network, and `libs/article/website/.../article.tsx` renders an
 * empty wrapper until the response arrives — the flash of no content.
 */
const makeCache = () =>
  new InMemoryCache({
    possibleTypes: possibleTypes.possibleTypes,
    typePolicies: mergeDeepRight(
      mergeDeepRight(flattenBlockTemplates, mergeBlockSelections),
      omitSensitiveData
    ) as never,
  });

const ARTICLE = gql`
  query Article($slug: String!) {
    article(slug: $slug) {
      id
      latest {
        id
        blocks {
          __typename
          ... on TitleBlock {
            blockStyle: blockStyleName
            title
            lead
          }
          ... on PollBlock {
            blockStyle: blockStyleName
          }
        }
      }
    }
  }
`;

/** The shape `FullArticleTeaser` writes. */
const TEASER = gql`
  query Teaser($slug: String!) {
    article(slug: $slug) {
      id
      latest {
        id
        blocks {
          __typename
          ... on PollBlock {
            blockStyle: blockStyleName
          }
        }
      }
    }
  }
`;

const variables = { slug: 'an-article' };

const fullData = {
  article: {
    __typename: 'Article',
    id: 'article-1',
    latest: {
      __typename: 'ArticleRevision',
      id: 'revision-1',
      blocks: [
        {
          __typename: 'TitleBlock',
          blockStyle: null,
          title: 'A title',
          lead: 'A lead',
        },
      ],
    },
  },
};

const teaserData = {
  article: {
    __typename: 'Article',
    id: 'article-1',
    latest: {
      __typename: 'ArticleRevision',
      id: 'revision-1',
      blocks: [{ __typename: 'TitleBlock' }],
    },
  },
};

describe('article blocks in the Apollo cache', () => {
  it('reads back complete after the article itself was written', () => {
    const cache = makeCache();
    cache.writeQuery({ query: ARTICLE, variables, data: fullData });

    expect(
      cache.diff({ query: ARTICLE, variables, optimistic: false }).complete
    ).toBe(true);
  });

  it('stays complete when a teaser for the same article is written afterwards', () => {
    const cache = makeCache();
    cache.writeQuery({ query: ARTICLE, variables, data: fullData });
    cache.writeQuery({ query: TEASER, variables, data: teaserData });

    expect(
      cache.diff({ query: ARTICLE, variables, optimistic: false }).complete
    ).toBe(true);
  });

  it('keeps the values the article wrote, not just the shape', () => {
    const cache = makeCache();
    cache.writeQuery({ query: ARTICLE, variables, data: fullData });
    cache.writeQuery({ query: TEASER, variables, data: teaserData });

    const read = cache.readQuery({
      query: ARTICLE,
      variables,
    }) as never as typeof fullData;

    expect(read.article.latest.blocks[0]).toMatchObject({
      title: 'A title',
      lead: 'A lead',
    });
  });

  it('lets a later full write update the block', () => {
    const cache = makeCache();
    cache.writeQuery({ query: ARTICLE, variables, data: fullData });
    cache.writeQuery({ query: TEASER, variables, data: teaserData });
    cache.writeQuery({
      query: ARTICLE,
      variables,
      data: {
        article: {
          ...fullData.article,
          latest: {
            ...fullData.article.latest,
            blocks: [
              {
                __typename: 'TitleBlock',
                blockStyle: null,
                title: 'An edited title',
                lead: 'A lead',
              },
            ],
          },
        },
      },
    });

    const read = cache.readQuery({
      query: ARTICLE,
      variables,
    }) as never as typeof fullData;

    expect(read.article.latest.blocks[0].title).toBe('An edited title');
  });

  it('takes the incoming list when the blocks themselves changed', () => {
    const cache = makeCache();
    cache.writeQuery({ query: ARTICLE, variables, data: fullData });
    cache.writeQuery({
      query: TEASER,
      variables,
      data: {
        article: {
          ...teaserData.article,
          latest: {
            ...teaserData.article.latest,
            blocks: [
              { __typename: 'PollBlock', blockStyle: null },
              { __typename: 'TitleBlock' },
            ],
          },
        },
      },
    });

    const read = cache.diff({ query: ARTICLE, variables, optimistic: false });

    expect(
      (read.result as never as typeof fullData).article.latest.blocks.length
    ).toBe(2);
  });
});
