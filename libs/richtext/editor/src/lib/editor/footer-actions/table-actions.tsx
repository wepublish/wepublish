import { ButtonGroup, IconButton } from '@mui/material';
import {
  EditorStateSnapshot,
  useCurrentEditor,
  useEditorState,
} from '@tiptap/react';
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
import { useTranslation } from 'react-i18next';

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
    <>
      <ButtonGroup aria-label={t('richtext.table.columns')}>
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

      <ButtonGroup aria-label={t('richtext.table.rows')}>
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

      <ButtonGroup aria-label={t('richtext.table.cells')}>
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
          aria-label={t('richtext.table.toggleHeader')}
          aria-pressed={editorState.isHeader}
          sx={{
            '&[aria-pressed="true"]': { backgroundColor: 'action.selected' },
          }}
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
