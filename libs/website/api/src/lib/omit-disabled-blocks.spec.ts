import { gql, InMemoryCache } from '@apollo/client';
import { omitDisabledBlocks } from './omit-disabled-blocks';

const query = gql`
  query {
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
`;

describe('omitDisabledBlocks', () => {
  it('should omit hidden blocks of block templates', () => {
    const cache = new InMemoryCache({ typePolicies: omitDisabledBlocks });

    cache.writeQuery({
      query,
      data: {
        template: {
          __typename: 'BlockTemplate',
          id: 'template-1',
          blocks: [
            { __typename: 'TitleBlock', title: 'Visible', disabled: false },
            { __typename: 'TitleBlock', title: 'Hidden', disabled: true },
          ],
        },
      },
    });

    expect(
      cache
        .readQuery<{ template: { blocks: { title: string }[] } }>({ query })
        ?.template.blocks.map(({ title }) => title)
    ).toEqual(['Visible']);
  });
});
