import {
  DocumentNode,
  FragmentDefinitionNode,
  Kind,
  SelectionSetNode,
} from 'graphql';
import { BlockTemplateDocument, FullBlockFragmentDoc } from '../graphql';

type BlockSelection = Record<string, string[]>;

const fragmentsOf = (document: DocumentNode) =>
  new Map<string, FragmentDefinitionNode>(
    document.definitions
      .filter(
        (definition): definition is FragmentDefinitionNode =>
          definition.kind === Kind.FRAGMENT_DEFINITION
      )
      .map(fragment => [fragment.name.value, fragment])
  );

const blockSelections = (document: DocumentNode) => {
  const fragments = fragmentsOf(document);

  const fieldsOf = (selectionSet: SelectionSetNode): string[] =>
    selectionSet.selections.flatMap(selection => {
      switch (selection.kind) {
        case Kind.FIELD:
          return [selection.name.value];

        case Kind.FRAGMENT_SPREAD: {
          const fragment = fragments.get(selection.name.value);

          return fragment ? fieldsOf(fragment.selectionSet) : [];
        }

        case Kind.INLINE_FRAGMENT:
          return selection.typeCondition ?
              []
            : fieldsOf(selection.selectionSet);
      }
    });

  const blockSelection = (selectionSet: SelectionSetNode) => {
    const selection: BlockSelection = {};

    const collect = (currentSet: SelectionSetNode) =>
      currentSet.selections.forEach(current => {
        switch (current.kind) {
          case Kind.FRAGMENT_SPREAD: {
            const fragment = fragments.get(current.name.value);

            if (fragment) {
              collect(fragment.selectionSet);
            }
            break;
          }

          case Kind.INLINE_FRAGMENT: {
            const type = current.typeCondition?.name.value;

            if (!type) {
              collect(current.selectionSet);
              break;
            }

            selection[type] = [
              ...(selection[type] ?? []),
              ...fieldsOf(current.selectionSet),
            ];
            break;
          }
        }
      });

    collect(selectionSet);

    return selection;
  };

  const selections: Record<string, BlockSelection> = {};

  const visit = (selectionSet: SelectionSetNode, path: string) => {
    const selection = blockSelection(selectionSet);

    if (Object.keys(selection).length) {
      selections[path] = selection;
    }

    selectionSet.selections.forEach(current => {
      switch (current.kind) {
        case Kind.FIELD:
          if (current.selectionSet) {
            visit(current.selectionSet, `${path}.${current.name.value}`);
          }
          break;

        case Kind.FRAGMENT_SPREAD: {
          const fragment = fragments.get(current.name.value);

          if (fragment && !(current.name.value in selections)) {
            visit(fragment.selectionSet, current.name.value);
          }
          break;
        }

        case Kind.INLINE_FRAGMENT:
          visit(
            current.selectionSet,
            `${path}.${current.typeCondition?.name.value ?? ''}`
          );
          break;
      }
    });
  };

  document.definitions.forEach(definition => {
    if ('selectionSet' in definition && definition.selectionSet) {
      visit(
        definition.selectionSet,
        definition.kind === Kind.FRAGMENT_DEFINITION ?
          definition.name.value
        : 'root'
      );
    }
  });

  return selections;
};

const blockTemplateSelections = blockSelections(BlockTemplateDocument);
const contentSelections = blockSelections({
  ...FullBlockFragmentDoc,
  kind: Kind.DOCUMENT,
} as DocumentNode);

const TEMPLATE_BLOCKS = 'BlockTemplateContent';
const TEMPLATE_FLEX_BLOCKS = 'BlockTemplateContent.FlexBlock.blocks.block';
const CONTENT_BLOCKS = 'FullBlock';
const CONTENT_FLEX_BLOCKS = 'FullBlock.FlexBlock.blocks.block';

const sorted = (selection: BlockSelection) =>
  Object.fromEntries(
    Object.entries(selection).map(([type, fields]) => [
      type,
      [...new Set(fields)].sort(),
    ])
  );

describe('block template fragments', () => {
  it('should read the reference of nested block templates', () => {
    [
      blockTemplateSelections[TEMPLATE_BLOCKS],
      blockTemplateSelections[TEMPLATE_FLEX_BLOCKS],
      contentSelections[CONTENT_BLOCKS],
      contentSelections[CONTENT_FLEX_BLOCKS],
    ].forEach(selection =>
      expect(selection?.['BlockTemplateBlock']).toEqual(
        expect.arrayContaining(['templateID', 'template'])
      )
    );
  });

  it.each([
    ['blocks', TEMPLATE_BLOCKS, CONTENT_BLOCKS],
    ['flex blocks', TEMPLATE_FLEX_BLOCKS, CONTENT_FLEX_BLOCKS],
  ])(
    'should read the %s of a block template like the ones of an article or page',
    (_name, templatePath, contentPath) => {
      const template = sorted(blockTemplateSelections[templatePath] ?? {});
      const content = sorted(contentSelections[contentPath] ?? {});

      delete template['BlockTemplateBlock'];
      delete content['BlockTemplateBlock'];

      expect(template).toEqual(content);
    }
  );
});
