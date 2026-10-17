import { useMutation, useQuery } from '@apollo/client/react';
import {
  DeliveryModeAudiencePreviewDocument,
  MailAudienceInput,
  MailChannel,
  SetDeliveryModeForAudienceDocument,
} from '@wepublish/editor/api';
import {
  humanizeError,
  useAuthorisation,
  enqueueSnackbar,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdMarkunreadMailbox } from 'react-icons/md';

import { usePaperLetterFlow } from './use-paper-letter-flow';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';

export type DeliveryModeAudienceActionProps = {
  audience: MailAudienceInput;
  /** Called once a switch went through, with what it did. */
  onDone?: (
    result: { changed: number; skippedWithoutAddress: number },
    channel: MailChannel
  ) => void;
};

/**
 * Switch everyone in the chosen audience between mailed and printed
 * subscription mails. Sits next to the audience summary of the communication
 * tool, so the same filters serve both.
 */
export function DeliveryModeAudienceAction({
  audience,
  onDone,
}: DeliveryModeAudienceActionProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<MailChannel>(MailChannel.Letter);
  const flow = usePaperLetterFlow();
  const allowed = useAuthorisation('CAN_MANAGE_USER-DELIVERY-MODE');
  const enabled = flow && allowed;

  const { data } = useQuery(DeliveryModeAudiencePreviewDocument, {
    variables: { audience, channel },
    skip: !open || !enabled,
    fetchPolicy: 'network-only',
  });
  const [apply, { loading }] = useMutation(SetDeliveryModeForAudienceDocument, {
    onError: error =>
      enqueueSnackbar(humanizeError(error), { variant: 'error' }),
    onCompleted: ({ setDeliveryModeForAudience: result }) => {
      enqueueSnackbar(t(`deliveryMode.audience.done.${channel}`, result), {
        variant: 'success',
        autoHideDuration: 8000,
      });
      setOpen(false);
      onDone?.(result, channel);
    },
  });

  if (!enabled) {
    return null;
  }

  const preview = data?.deliveryModeAudiencePreview;

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<MdMarkunreadMailbox />}
        onClick={() => setOpen(true)}
      >
        {t('deliveryMode.audience.open')}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
      >
        <DialogTitle>{t('deliveryMode.audience.title')}</DialogTitle>
        <DialogContent>
          <p>{t('deliveryMode.audience.intro')}</p>
          <RadioGroup
            value={channel}
            onChange={(_event, value) => setChannel(value as MailChannel)}
            style={{ marginBlock: 12 }}
          >
            <FormControlLabel
              value={MailChannel.Letter}
              control={<Radio />}
              label={t('deliveryMode.channel.letter')}
            />
            <FormControlLabel
              value={MailChannel.Mail}
              control={<Radio />}
              label={t('deliveryMode.channel.mail')}
            />
          </RadioGroup>
          {preview && (
            <p>
              {t(
                channel === MailChannel.Letter ?
                  'deliveryMode.audience.previewLetter'
                : 'deliveryMode.audience.previewMail',
                preview
              )}
            </p>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            onClick={() => setOpen(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            loading={loading}
            disabled={!preview?.userCount}
            onClick={() => apply({ variables: { audience, channel } })}
          >
            {t('deliveryMode.audience.apply')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
