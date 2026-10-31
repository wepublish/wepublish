import { gql } from '@apollo/client';

import { getApiClient } from './client';

const query = gql`
  query PuckRevisions {
    page(id: "page-1") {
      id
      latest {
        id
        puckBlocks {
          id
          props
        }
      }
      published {
        id
        puckBlocks {
          id
          props
        }
      }
    }
  }
`;

const revision = (id: string, text: string) => ({
  __typename: 'PageRevision',
  id,
  puckBlocks: [{ __typename: 'PuckBlock', id: 'heading-1', props: { text } }],
});

describe('getApiClient', () => {
  it('keeps puck blocks apart that share an id across revisions', () => {
    const { cache } = getApiClient('http://localhost:4000', []);

    cache.writeQuery({
      query,
      data: {
        page: {
          __typename: 'Page',
          id: 'page-1',
          latest: revision('draft', 'Draft'),
          published: revision('live', 'Live'),
        },
      },
    });

    const { page } = cache.readQuery({ query }) as {
      page: Record<'latest' | 'published', { puckBlocks: { props: object }[] }>;
    };

    expect([
      page.latest.puckBlocks[0].props,
      page.published.puckBlocks[0].props,
    ]).toEqual([{ text: 'Draft' }, { text: 'Live' }]);
  });
});
