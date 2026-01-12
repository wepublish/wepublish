import { TextField } from '@mui/material';
import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { equals } from 'ramda';

export function HeadingActions() {
  const editor = useCurrentEditor().editor!;

  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      return {
        isActive: editor.isActive('heading'),
        id: editor.getAttributes('heading').id,
      };
    },
    equalityFn: equals,
  });

  if (!editorState.isActive) {
    return null;
  }

  return (
    <TextField
      defaultValue={editorState.id}
      onChange={event => {
        editor
          .chain()
          .extendMarkRange('heading')
          .updateAttributes('heading', {
            id: event.target.value,
          })
          .run();
      }}
      size="small"
    />
  );
}
