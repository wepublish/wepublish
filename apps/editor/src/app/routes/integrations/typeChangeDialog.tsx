import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type Answer = (confirmed: boolean) => void;

export function useTypeChangeQuestion() {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState<{ resolve: Answer } | null>(null);

  const ask = () => new Promise<boolean>(resolve => setAnswer({ resolve }));

  const reply = (confirmed: boolean) => {
    if (answer !== null) {
      answer.resolve(confirmed);
    }

    setAnswer(null);
  };

  const dialog = (
    <Dialog
      open={answer !== null}
      onClose={() => reply(false)}
      aria-labelledby="integration-type-change-title"
    >
      <DialogTitle id="integration-type-change-title">
        {t('integrations.typeChangeTitle')}
      </DialogTitle>

      <DialogContent>{t('integrations.typeChangeWarning')}</DialogContent>

      <DialogActions>
        <Button
          variant="text"
          onClick={() => reply(false)}
        >
          {t('integrations.cancel')}
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={() => reply(true)}
        >
          {t('integrations.typeChangeConfirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return [ask, dialog] as const;
}
