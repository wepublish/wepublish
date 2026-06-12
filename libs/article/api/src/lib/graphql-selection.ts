import {
  FieldNode,
  FragmentDefinitionNode,
  GraphQLResolveInfo,
  SelectionNode,
} from 'graphql';

export const resolveInfoSelectsField = (
  info: Pick<GraphQLResolveInfo, 'fieldNodes' | 'fragments'>,
  fieldName: string
): boolean =>
  info.fieldNodes.some(fieldNode =>
    selectionsSelectField(
      fieldNode.selectionSet?.selections ?? [],
      info.fragments,
      fieldName
    )
  );

const selectionsSelectField = (
  selections: readonly SelectionNode[],
  fragments: Record<string, FragmentDefinitionNode>,
  fieldName: string,
  visitedFragments = new Set<string>()
): boolean =>
  selections.some(selection => {
    if (selection.kind === 'Field') {
      return selection.name.value === fieldName;
    }

    if (selection.kind === 'InlineFragment') {
      return selectionsSelectField(
        selection.selectionSet.selections,
        fragments,
        fieldName,
        visitedFragments
      );
    }

    const fragmentName = selection.name.value;
    const fragment = fragments[fragmentName];

    if (!fragment || visitedFragments.has(fragmentName)) {
      return false;
    }

    visitedFragments.add(fragmentName);
    return selectionsSelectField(
      fragment.selectionSet.selections,
      fragments,
      fieldName,
      visitedFragments
    );
  });

export const findFieldNode = (
  queryFieldName: string,
  info: Pick<GraphQLResolveInfo, 'fieldNodes'>
): FieldNode | undefined =>
  info.fieldNodes.find(fieldNode => fieldNode.name.value === queryFieldName);
