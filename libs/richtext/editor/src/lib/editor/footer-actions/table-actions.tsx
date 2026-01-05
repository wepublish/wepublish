import { ButtonGroup, IconButton } from '@mui/material';
import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { equals } from 'ramda';
import {
  TbColumnInsertLeft,
  TbColumnInsertRight,
  TbColumnRemove,
  TbRowInsertBottom,
  TbRowInsertTop,
  TbRowRemove,
} from 'react-icons/tb';

import {
  LuHeading,
  LuTableCellsMerge,
  LuTableCellsSplit,
} from 'react-icons/lu';

export function TableActions() {
  const editor = useCurrentEditor().editor!;

  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      return {
        isActive: editor.isActive('table'),
        isHeader: editor.isActive('tableHeader'),
      };
    },
    equalityFn: equals,
  });

  if (!editorState.isActive) {
    return null;
  }

  return (
    <>
      <ButtonGroup>
        <IconButton
          size="small"
          onClick={() => editor.commands.addColumnBefore()}
          onMouseDown={e => e.preventDefault()}
        >
          <TbColumnInsertLeft size={18} />
        </IconButton>

        <IconButton
          size="small"
          onClick={() => editor.commands.addColumnAfter()}
          onMouseDown={e => e.preventDefault()}
        >
          <TbColumnInsertRight size={18} />
        </IconButton>

        <IconButton
          size="small"
          onClick={() => editor.commands.deleteColumn()}
          onMouseDown={e => e.preventDefault()}
        >
          <TbColumnRemove size={18} />
        </IconButton>
      </ButtonGroup>

      <ButtonGroup>
        <IconButton
          size="small"
          onClick={() => editor.commands.addRowBefore()}
          onMouseDown={e => e.preventDefault()}
        >
          <TbRowInsertTop size={18} />
        </IconButton>

        <IconButton
          size="small"
          onClick={() => editor.commands.addRowAfter()}
          onMouseDown={e => e.preventDefault()}
        >
          <TbRowInsertBottom size={18} />
        </IconButton>

        <IconButton
          size="small"
          onClick={() => editor.commands.deleteRow()}
          onMouseDown={e => e.preventDefault()}
        >
          <TbRowRemove size={18} />
        </IconButton>
      </ButtonGroup>

      <ButtonGroup>
        <IconButton
          size="small"
          onClick={() => editor.commands.mergeCells()}
          onMouseDown={e => e.preventDefault()}
        >
          <LuTableCellsMerge size={18} />
        </IconButton>

        <IconButton
          size="small"
          onClick={() => editor.commands.splitCell()}
          onMouseDown={e => e.preventDefault()}
        >
          <LuTableCellsSplit size={18} />
        </IconButton>
      </ButtonGroup>

      <ButtonGroup>
        <IconButton
          size="small"
          color={editorState.isHeader ? 'primary' : undefined}
          onClick={() => editor.commands.toggleHeaderCell()}
          onMouseDown={e => e.preventDefault()}
        >
          <LuHeading size={18} />
        </IconButton>
      </ButtonGroup>
    </>
  );
}
