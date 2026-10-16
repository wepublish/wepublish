import { gql, InMemoryCache } from '@apollo/client';
import { mergeDeepRight } from 'ramda';

import { flattenBlockTemplates } from './flatten-block-templates';
import { omitDisabledBlocks } from './omit-disabled-blocks';

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
            disabled
          }
          ... on BlockTemplateBlock {
            disabled
            template {
              id
              blocks {
                __typename
                ... on TitleBlock {
                  title
                  disabled
                }
              }
            }
          }
        }
      }
    }
  }
`;

const title = (title: string, disabled = false) => ({
  __typename: 'TitleBlock',
  title,
  disabled,
});

const templateBlock = (id: string, blocks: unknown[], disabled = false) => ({
  __typename: 'BlockTemplateBlock',
  disabled,
  template: { __typename: 'BlockTemplate', id, blocks },
});

const write = (blocks: unknown[]) => {
  const cache = new InMemoryCache({
    typePolicies: mergeDeepRight(omitDisabledBlocks, flattenBlockTemplates),
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

const flexQuery = gql`
  query {
    page {
      id
      latest {
        id
        blocks {
          __typename
          ... on FlexBlock {
            blocks {
              alignment {
                i
              }
              block {
                __typename
                ... on TitleBlock {
                  title
                  disabled
                }
              }
            }
          }
        }
      }
    }
  }
`;

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

  it('omits disabled blocks inside and outside templates', () => {
    const blocks = write([
      title('Hidden', true),
      templateBlock('template-1', [title('Kept'), title('Dropped', true)]),
    ]);

    expect(blocks.map((block: any) => block.title)).toEqual(['Kept']);
  });

  it('omits a disabled block template entirely', () => {
    const blocks = write([
      templateBlock('template-1', [title('Inside')], true),
      title('Only'),
    ]);

    expect(blocks.map((block: any) => block.title)).toEqual(['Only']);
  });
});

describe('FlexBlock.blocks', () => {
  it('omits disabled blocks nested in a flex block', () => {
    const cache = new InMemoryCache({
      typePolicies: mergeDeepRight(omitDisabledBlocks, flattenBlockTemplates),
    });

    cache.writeQuery({
      query: flexQuery,
      data: {
        page: {
          __typename: 'Page',
          id: 'page-1',
          latest: {
            __typename: 'PageRevision',
            id: 'revision-1',
            blocks: [
              {
                __typename: 'FlexBlock',
                blocks: [
                  { alignment: { i: 'a' }, block: title('Kept') },
                  { alignment: { i: 'b' }, block: title('Dropped', true) },
                ],
              },
            ],
          },
        },
      },
    });

    const [flex] = (cache.readQuery({ query: flexQuery }) as any).page.latest
      .blocks;

    expect(flex.blocks.map((entry: any) => entry.block.title)).toEqual([
      'Kept',
    ]);
  });
});
