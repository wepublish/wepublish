import { Checkbox, FormControlLabel, TextField } from '@mui/material';
import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { equals } from 'ramda';

export function LinkActions() {
  const editor = useCurrentEditor().editor!;

  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      return {
        isActive: editor.isActive('link'),
        id: editor.getAttributes('link').id,
        href: editor.getAttributes('link').href,
        target: editor.getAttributes('link').target,
        opensInNewTab: editor.isActive('link', { target: '_blank' }),
      };
    },
    equalityFn: equals,
  });

  if (!editorState.isActive) {
    return null;
  }

  return (
    <>
      <TextField
        defaultValue={editorState.id}
        onChange={event => {
          editor
            .chain()
            .extendMarkRange('link')
            .updateAttributes('link', {
              id: event.target.value,
            })
            .run();
        }}
        size="small"
      />

      <TextField
        defaultValue={editorState.href}
        onChange={event => {
          editor
            .chain()
            .extendMarkRange('link')
            .updateAttributes('link', {
              href: event.target.value,
            })
            .run();
        }}
        size="small"
      />

      <FormControlLabel
        sx={{ height: '100%' }}
        name="Open in new tab"
        control={
          <Checkbox
            size="small"
            checked={editorState.opensInNewTab}
            sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }}
          />
        }
        label="Open in new tab"
        onChange={() => {
          editor
            .chain()
            .extendMarkRange('link')
            .updateAttributes('link', {
              target: editorState.opensInNewTab ? '' : '_blank',
            })
            .run();
        }}
      />
    </>
  );
}
