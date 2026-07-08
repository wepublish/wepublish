import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { equals } from 'ramda';

export function useHeadings() {
  const editor = useCurrentEditor().editor!;

  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      const headings: { id: string; text: string }[] = [];

      editor.state.doc.descendants(node => {
        if (node.type.name === 'heading' && node.attrs.id) {
          headings.push({ id: node.attrs.id, text: node.textContent });
        }
      });

      return {
        headings,
      };
    },
    equalityFn: equals,
  });

  return editorState.headings;
}
