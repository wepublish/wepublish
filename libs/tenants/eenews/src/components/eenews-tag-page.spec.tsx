import { screen } from '@testing-library/react';
import { mockTag, renderWithProviders } from '@wepublish/mocks/website';
import {
  NavigationListDocument,
  TagListDocument,
} from '@wepublish/website/api';
import { BuilderTagSEOProps } from '@wepublish/website/builder';

import { eenewsTenant } from '../eenews-tenant';
import { EenewsTagPage } from './eenews-tag-page';

const mocks = [
  {
    request: { query: NavigationListDocument },
    result: { data: { navigations: [] } },
  },
  {
    request: { query: TagListDocument, variables: { take: 100 } },
    result: {
      data: {
        tags: {
          __typename: 'TagConnection',
          nodes: [],
          totalCount: 0,
          pageInfo: {
            __typename: 'PageInfo',
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
        },
      },
    },
  },
];

const TagSEO = ({ tag, title }: BuilderTagSEOProps) => (
  <p>
    seo for {tag.tag}: {title}
  </p>
);

const articles = { data: undefined, loading: false } as never;

describe('EenewsTagPage', () => {
  /**
   * The shared Tag page renders TagSEO (title "<tag> — <site>", description,
   * canonical, og tags); ee-news's own page has to do the same, otherwise a
   * tag page only ever carries the bare site title.
   */
  it('renders the SEO tags for the tag with the ee-news title', async () => {
    renderWithProviders(
      <EenewsTagPage
        tag={
          {
            data: { tag: mockTag({ tag: 'wasser', main: true }) },
            loading: false,
          } as never
        }
        articles={articles}
        variables={{}}
        onVariablesChange={() => undefined}
      />,
      { tenant: eenewsTenant, builder: { TagSEO }, mocks }
    );

    expect(
      await screen.findByText('seo for wasser: ee-news - Thema «Wasser»')
    ).toBeDefined();
  });

  it('renders no tag SEO on the dossier index', async () => {
    renderWithProviders(
      <EenewsTagPage
        tag={{ data: undefined, loading: false } as never}
        articles={articles}
        variables={{}}
        onVariablesChange={() => undefined}
      />,
      { tenant: eenewsTenant, builder: { TagSEO }, mocks }
    );

    expect(await screen.findByText('Dossiers')).toBeDefined();
    expect(screen.queryByText(/seo for/)).toBeNull();
  });
});
