import { Box, ButtonGroup, IconButton } from '@mui/material';
import {
  EditorStateSnapshot,
  useCurrentEditor,
  useEditorState,
} from '@tiptap/react';
import { equals } from 'ramda';
import { useTranslation } from 'react-i18next';
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

const selectTableState = ({ editor }: EditorStateSnapshot) => {
  if (!editor || editor.isDestroyed) {
    return { isActive: false, isHeader: false };
  }

  return {
    isActive: editor.isActive('table'),
    isHeader: editor.isActive('tableHeader'),
  };
};

export function TableActions() {
  const { t } = useTranslation();
  const editor = useCurrentEditor().editor!;

  const editorState = useEditorState({
    editor,
    selector: selectTableState,
    equalityFn: equals,
  });

  if (!editorState.isActive) {
    return null;
  }

  return (
    <Box
      role="toolbar"
      aria-label={t('richtext.table.label')}
      sx={{ display: 'contents' }}
    >
      <ButtonGroup>
        <IconButton
          size="small"
          aria-label={t('richtext.table.addColumnBefore')}
          onClick={() => editor.commands.addColumnBefore()}
          onMouseDown={e => e.preventDefault()}
        >
          <TbColumnInsertLeft size={18} />
        </IconButton>

        <IconButton
          size="small"
          aria-label={t('richtext.table.addColumnAfter')}
          onClick={() => editor.commands.addColumnAfter()}
          onMouseDown={e => e.preventDefault()}
        >
          <TbColumnInsertRight size={18} />
        </IconButton>

        <IconButton
          size="small"
          aria-label={t('richtext.table.deleteColumn')}
          onClick={() => editor.commands.deleteColumn()}
          onMouseDown={e => e.preventDefault()}
        >
          <TbColumnRemove size={18} />
        </IconButton>
      </ButtonGroup>

      <ButtonGroup>
        <IconButton
          size="small"
          aria-label={t('richtext.table.addRowBefore')}
          onClick={() => editor.commands.addRowBefore()}
          onMouseDown={e => e.preventDefault()}
        >
          <TbRowInsertTop size={18} />
        </IconButton>

        <IconButton
          size="small"
          aria-label={t('richtext.table.addRowAfter')}
          onClick={() => editor.commands.addRowAfter()}
          onMouseDown={e => e.preventDefault()}
        >
          <TbRowInsertBottom size={18} />
        </IconButton>

        <IconButton
          size="small"
          aria-label={t('richtext.table.deleteRow')}
          onClick={() => editor.commands.deleteRow()}
          onMouseDown={e => e.preventDefault()}
        >
          <TbRowRemove size={18} />
        </IconButton>
      </ButtonGroup>

      <ButtonGroup>
        <IconButton
          size="small"
          aria-label={t('richtext.table.mergeCells')}
          onClick={() => editor.commands.mergeCells()}
          onMouseDown={e => e.preventDefault()}
        >
          <LuTableCellsMerge size={18} />
        </IconButton>

        <IconButton
          size="small"
          aria-label={t('richtext.table.splitCell')}
          onClick={() => editor.commands.splitCell()}
          onMouseDown={e => e.preventDefault()}
        >
          <LuTableCellsSplit size={18} />
        </IconButton>
      </ButtonGroup>

      <ButtonGroup>
        <IconButton
          size="small"
          aria-label={t('richtext.table.headerCell')}
          aria-pressed={editorState.isHeader}
          color={editorState.isHeader ? 'primary' : undefined}
          onClick={() => editor.commands.toggleHeaderCell()}
          onMouseDown={e => e.preventDefault()}
        >
          <LuHeading size={18} />
        </IconButton>
      </ButtonGroup>
    </Box>
  );
}
