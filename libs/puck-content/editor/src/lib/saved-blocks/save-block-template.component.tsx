import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { ActionBar, ComponentData, createUsePuck } from '@puckeditor/core';
import { FormEvent, KeyboardEvent, useId, useState } from 'react';
import { MdBookmarkAdd } from 'react-icons/md';

import { useEditorTranslation } from '../website-translations/editor-translation';
import { passwordManagerIgnore } from '../name-field/password-manager';
import { useSavedBlocks } from './saved-blocks.context';

const usePuck = createUsePuck();

const stopKeys = (event: KeyboardEvent) => event.stopPropagation();

export const SaveBlockTemplateDialog = ({
  block,
  open,
  onClose,
}: {
  block: ComponentData;
  open: boolean;
  onClose: () => void;
}) => {
  const { t } = useEditorTranslation();
  const saved = useSavedBlocks();
  const titleId = useId();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!saved || !name.trim()) {
      return;
    }

    setSaving(true);
    setFailed(false);

    try {
      await saved.save(name.trim(), block);
      setName('');
      onClose();
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      onKeyDown={stopKeys}
      aria-labelledby={titleId}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { component: 'form', onSubmit: submit } }}
    >
      <DialogTitle id={titleId}>{t('puck.savedBlocks.save')}</DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label={t('puck.savedBlocks.name')}
          value={name}
          onChange={event => setName(event.target.value)}
          slotProps={{ htmlInput: passwordManagerIgnore }}
        />

        {failed && (
          <Alert severity="error">{t('puck.savedBlocks.failed')}</Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('puck.savedBlocks.cancel')}</Button>
        <Button
          type="submit"
          variant="contained"
          disabled={saving || !name.trim()}
        >
          {t('puck.savedBlocks.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const SaveBlockTemplateAction = () => {
  const { t } = useEditorTranslation();
  const saved = useSavedBlocks();
  const selectedItem = usePuck(puck => puck.selectedItem);

  if (!saved?.canCreate || !selectedItem) {
    return null;
  }

  return (
    <ActionBar.Action
      label={t('puck.savedBlocks.save')}
      onClick={() => saved.requestSave(selectedItem)}
    >
      <MdBookmarkAdd size={16} />
    </ActionBar.Action>
  );
};
