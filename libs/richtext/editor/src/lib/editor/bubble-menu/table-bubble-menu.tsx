import {
  Editor,
  findParentNode,
  posToDOMRect,
  useEditorState,
} from '@tiptap/react';
import { BubbleMenu as TipTapBubbleMenu } from '@tiptap/react/menus';
import { equals } from 'ramda';

export function TableBubbleMenu({ editor }: { editor: Editor }) {
  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      return {
        canAddColumnBefore: editor.can().addColumnBefore(),
        canAddColumnAfter: editor.can().addColumnAfter(),
      };
    },
    equalityFn: equals,
  });

  return (
    <TipTapBubbleMenu
      editor={editor}
      shouldShow={() => editor.isActive('table')}
      getReferencedVirtualElement={() => {
        const parentNode = findParentNode(node => node.type.name === 'table')(
          editor.state.selection
        );

        if (parentNode) {
          const domRect = posToDOMRect(
            editor.view,
            parentNode.start,
            parentNode.start + parentNode.node.nodeSize
          );

          return {
            getBoundingClientRect: () => domRect,
            getClientRects: () => [domRect],
          };
        }
        return null;
      }}
      options={{ placement: 'top-start', offset: 8 }}
    >
      <button
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        disabled={!editorState.canAddColumnBefore}
      >
        Add column before
      </button>

      <button
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        disabled={!editorState.canAddColumnAfter}
      >
        Add column after
      </button>

      <button
        onClick={() => editor.chain().focus().deleteColumn().run()}
        disabled={!editor.can().deleteColumn()}
      >
        Delete column
      </button>

      <button
        onClick={() => editor.chain().focus().addRowBefore().run()}
        disabled={!editor.can().addRowBefore()}
      >
        Add row before
      </button>

      <button
        onClick={() => editor.chain().focus().addRowAfter().run()}
        disabled={!editor.can().addRowAfter()}
      >
        Add row after
      </button>

      <button
        onClick={() => editor.chain().focus().deleteRow().run()}
        disabled={!editor.can().deleteRow()}
      >
        Delete row
      </button>

      <button
        onClick={() => editor.chain().focus().mergeCells().run()}
        disabled={!editor.can().mergeCells()}
      >
        Merge cells
      </button>

      <button
        onClick={() => editor.chain().focus().splitCell().run()}
        disabled={!editor.can().splitCell()}
      >
        Split cell
      </button>

      <button
        onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
        disabled={!editor.can().toggleHeaderColumn()}
      >
        ToggleHeaderColumn
      </button>

      <button
        onClick={() => editor.chain().focus().toggleHeaderRow().run()}
        disabled={!editor.can().toggleHeaderRow()}
      >
        Toggle header row
      </button>

      <button
        onClick={() => editor.chain().focus().toggleHeaderCell().run()}
        disabled={!editor.can().toggleHeaderCell()}
      >
        Toggle header cell
      </button>

      <button
        onClick={() => editor.chain().focus().mergeOrSplit().run()}
        disabled={!editor.can().mergeOrSplit()}
      >
        Merge or split
      </button>
    </TipTapBubbleMenu>
  );
}
