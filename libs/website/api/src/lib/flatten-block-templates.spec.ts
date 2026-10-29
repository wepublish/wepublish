import { gql, InMemoryCache } from '@apollo/client';

import { flattenBlockTemplates } from './flatten-block-templates';

const query = gql`
  query {
    page {
      id
      latest {
        id
        blocks {
          __typename
          ... on TitleBlock {
            title
          }
          ... on BlockTemplateBlock {
            template {
              id
              blocks {
                __typename
                ... on TitleBlock {
                  title
                }
              }
            }
          }
        }
      }
    }
  }
`;

const title = (title: string) => ({
  __typename: 'TitleBlock',
  title,
});

const templateBlock = (id: string, blocks: unknown[]) => ({
  __typename: 'BlockTemplateBlock',
  template: { __typename: 'BlockTemplate', id, blocks },
});

const write = (blocks: unknown[]) => {
  const cache = new InMemoryCache({
    typePolicies: flattenBlockTemplates,
  });

  cache.writeQuery({
    query,
    data: {
      page: {
        __typename: 'Page',
        id: 'page-1',
        latest: { __typename: 'PageRevision', id: 'revision-1', blocks },
      },
    },
  });

  return (cache.readQuery({ query }) as any).page.latest.blocks;
};

describe('flattenBlockTemplates', () => {
  it('expands a block template into the blocks it references', () => {
    const blocks = write([
      title('Before'),
      templateBlock('template-1', [title('Inside A'), title('Inside B')]),
      title('After'),
    ]);

    expect(blocks.map((block: any) => block.title)).toEqual([
      'Before',
      'Inside A',
      'Inside B',
      'After',
    ]);
    expect(
      blocks.some((block: any) => block.__typename === 'BlockTemplateBlock')
    ).toBe(false);
  });

  it('expands a template that the api already emptied out', () => {
    const blocks = write([templateBlock('template-1', []), title('Only')]);

    expect(blocks.map((block: any) => block.title)).toEqual(['Only']);
  });
});
