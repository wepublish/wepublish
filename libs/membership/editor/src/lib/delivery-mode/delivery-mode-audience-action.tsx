import { useMutation, useQuery } from '@apollo/client/react';
import {
  DeliveryModeAudiencePreviewDocument,
  MailAudienceInput,
  MailChannel,
  SetDeliveryModeForAudienceDocument,
} from '@wepublish/editor/api';
import { humanizeError, useAuthorisation } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdMarkunreadMailbox } from 'react-icons/md';
import { Button, Message, Modal, Radio, RadioGroup, toaster } from 'rsuite';

import { usePaperLetterFlow } from './use-paper-letter-flow';

export type DeliveryModeAudienceActionProps = {
  audience: MailAudienceInput;
};

/**
 * Switch everyone in the chosen audience between mailed and printed
 * subscription mails. Sits next to the audience summary of the communication
 * tool, so the same filters serve both.
 */
export function DeliveryModeAudienceAction({
  audience,
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
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
        >
          {humanizeError(error)}
        </Message>
      ),
    onCompleted: ({ setDeliveryModeForAudience: result }) => {
      toaster.push(
        <Message
          type="success"
          showIcon
          closable
          duration={8000}
        >
          {t(`deliveryMode.audience.done.${channel}`, result)}
        </Message>
      );
      setOpen(false);
    },
  });

  if (!enabled) {
    return null;
  }

  const preview = data?.deliveryModeAudiencePreview;

  return (
    <>
      <Button
        size="sm"
        appearance="ghost"
        startIcon={<MdMarkunreadMailbox />}
        onClick={() => setOpen(true)}
      >
        {t('deliveryMode.audience.open')}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
      >
        <Modal.Header>
          <Modal.Title>{t('deliveryMode.audience.title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{t('deliveryMode.audience.intro')}</p>
          <RadioGroup
            value={channel}
            onChange={value => setChannel(value as MailChannel)}
            style={{ marginBlock: 12 }}
          >
            <Radio value={MailChannel.Letter}>
              {t('deliveryMode.channel.letter')}
            </Radio>
            <Radio value={MailChannel.Mail}>
              {t('deliveryMode.channel.mail')}
            </Radio>
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
        </Modal.Body>
        <Modal.Footer>
          <Button
            appearance="subtle"
            onClick={() => setOpen(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            appearance="primary"
            loading={loading}
            disabled={!preview?.userCount}
            onClick={() => apply({ variables: { audience, channel } })}
          >
            {t('deliveryMode.audience.apply')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
