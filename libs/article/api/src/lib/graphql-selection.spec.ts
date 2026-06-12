import {
  FieldNode,
  FragmentDefinitionNode,
  GraphQLResolveInfo,
  OperationDefinitionNode,
  parse,
} from 'graphql';
import { resolveInfoSelectsField } from './graphql-selection';

const createResolveInfo = (
  query: string
): Pick<GraphQLResolveInfo, 'fieldNodes' | 'fragments'> => {
  const document = parse(query);
  const operation = document.definitions.find(
    (definition): definition is OperationDefinitionNode =>
      definition.kind === 'OperationDefinition'
  );

  if (!operation) {
    throw new Error('Test query must contain an operation definition.');
  }

  const fieldNodes = operation.selectionSet.selections.filter(
    (selection): selection is FieldNode => selection.kind === 'Field'
  );
  const fragments = Object.fromEntries(
    document.definitions
      .filter(
        (definition): definition is FragmentDefinitionNode =>
          definition.kind === 'FragmentDefinition'
      )
      .map(fragment => [fragment.name.value, fragment])
  );

  return { fieldNodes, fragments };
};

describe('resolveInfoSelectsField', () => {
  it('detects directly selected fields', () => {
    const info = createResolveInfo(`
      query {
        articles {
          nodes {
            id
          }
          totalCount
        }
      }
    `);

    expect(resolveInfoSelectsField(info, 'totalCount')).toBe(true);
  });

  it('ignores fields that are not selected', () => {
    const info = createResolveInfo(`
      query {
        articles {
          nodes {
            id
          }
        }
      }
    `);

    expect(resolveInfoSelectsField(info, 'totalCount')).toBe(false);
  });

  it('detects fields selected through fragments and inline fragments', () => {
    const info = createResolveInfo(`
      query {
        articles {
          ...ArticleListMeta
          ... on PaginatedArticles {
            pageInfo {
              hasNextPage
            }
          }
        }
      }

      fragment ArticleListMeta on PaginatedArticles {
        totalCount
      }
    `);

    expect(resolveInfoSelectsField(info, 'totalCount')).toBe(true);
    expect(resolveInfoSelectsField(info, 'pageInfo')).toBe(true);
  });
});
