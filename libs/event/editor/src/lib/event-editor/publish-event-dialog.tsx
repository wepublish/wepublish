import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import { zurichWallClockToInstant } from '@wepublish/event/schedule';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const MOMENT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export const parseZurichMoment = (value: string): Date | null => {
  const match = MOMENT.exec(value);

  if (!match) {
    return null;
  }

  const [year, month, day, hour, minute] = match.slice(1).map(Number);

  return zurichWallClockToInstant({
    year,
    month,
    day,
    hour,
    minute,
    second: 0,
    millisecond: 0,
  });
};

export interface PublishEventDialogProps {
  open: boolean;
  now: Date;
  onClose(): void;
  onConfirm(publishAt: Date | null): void;
}

export function PublishEventDialog({
  open,
  now,
  onClose,
  onConfirm,
}: PublishEventDialogProps) {
  const { t } = useTranslation();
  const [when, setWhen] = useState<'now' | 'later'>('now');
  const [moment, setMoment] = useState('');

  const publishAt = when === 'later' ? parseZurichMoment(moment) : null;
  const inThePast = !!publishAt && publishAt <= now;
  const ready = when === 'now' || (!!publishAt && !inThePast);

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={open}
      onClose={onClose}
    >
      <DialogTitle>{t('agenda.editor.publish.title')}</DialogTitle>

      <DialogContent>
        <DialogContentText>{t('agenda.editor.publish.body')}</DialogContentText>

        <RadioGroup
          name="publish-when"
          value={when}
          onChange={(_event, value) => setWhen(value as 'now' | 'later')}
        >
          <FormControlLabel
            value="now"
            control={<Radio />}
            label={t('agenda.editor.publish.now')}
          />
          <FormControlLabel
            value="later"
            control={<Radio />}
            label={t('agenda.editor.publish.later')}
          />
        </RadioGroup>

        {when === 'later' && (
          <TextField
            type="datetime-local"
            label={t('agenda.editor.publish.at')}
            value={moment}
            onChange={event => setMoment(event.target.value)}
            error={inThePast}
            helperText={
              inThePast ?
                t('agenda.editor.publish.inThePast')
              : t('agenda.editor.publish.atHelp')
            }
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ mt: 2 }}
            fullWidth
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button
          variant="text"
          onClick={onClose}
        >
          {t('cancel')}
        </Button>

        <Button
          variant="contained"
          disabled={!ready}
          onClick={() => onConfirm(publishAt)}
        >
          {t('agenda.editor.publish.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
