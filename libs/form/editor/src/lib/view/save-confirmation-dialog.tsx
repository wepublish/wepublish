import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { useFormStatus } from '@wepublish/form/core';
import { DescriptionList, DescriptionListItem } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdArrowForward } from 'react-icons/md';

import { useFormViewContext } from './form-view-context';
import {
  After,
  Before,
  ChangeArrow,
  ConfirmDescription,
} from './form-view-layout';
import type { FormChange } from './use-form-controller';

function ChangeList({ changes }: { changes: readonly FormChange[] }) {
  return (
    <DescriptionList>
      {changes.map(change => (
        <DescriptionListItem
          key={change.path}
          label={change.label}
        >
          <Before>{change.beforeText}</Before>
          <ChangeArrow aria-hidden>
            <MdArrowForward />
          </ChangeArrow>
          <After>{change.afterText}</After>
        </DescriptionListItem>
      ))}
    </DescriptionList>
  );
}

export function SaveConfirmationDialog() {
  const { controller, formId } = useFormViewContext();
  const { t } = useTranslation();
  const { isSubmitting } = useFormStatus();
  const confirmation = controller.confirmation;

  if (confirmation === undefined) {
    return null;
  }

  const Body = confirmation.body;
  const changes = confirmation.changes;

  return (
    <Dialog
      open={changes !== null}
      onClose={confirmation.close}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{t(confirmation.title)}</DialogTitle>
      <DialogContent>
        {confirmation.description === undefined ? null : (
          <ConfirmDescription>{t(confirmation.description)}</ConfirmDescription>
        )}
        {changes === null ?
          null
        : Body === undefined ?
          <ChangeList changes={changes} />
        : <Body changes={changes} />}
      </DialogContent>
      <DialogActions>
        <Button
          variant="text"
          onClick={confirmation.close}
        >
          {t('cancel')}
        </Button>
        <Button
          variant="contained"
          type="submit"
          form={formId}
          name="intent"
          value={confirmation.intent ?? 'save'}
          loading={isSubmitting}
          data-testid="confirmSaveButton"
        >
          {t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
