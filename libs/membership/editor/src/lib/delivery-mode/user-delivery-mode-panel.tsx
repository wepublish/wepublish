import { useMutation, useQuery } from '@apollo/client/react';
import { Typography } from '@mui/material';
import {
  MailChannel,
  SetUserDeliveryModeDocument,
  UserDeliveryPreferenceDocument,
} from '@wepublish/editor/api';
import { humanizeError } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdMailOutline, MdMarkunreadMailbox } from 'react-icons/md';
import { Button, Message, Panel, Stack, Tag, toaster } from 'rsuite';

import { usePaperLetterFlow } from './use-paper-letter-flow';

export type UserDeliveryModePanelProps = {
  userId: string;
};

/** `emailQuality:dead` → `emailQuality_dead`: a colon would be a namespace to i18next. */
const reasonKey = (reason: string) => reason.replace(':', '_');

/**
 * Which way a user's automated subscription mails go, and the switch between
 * them. Letters need a usable postal address; the way back is always open.
 */
export function UserDeliveryModePanel({ userId }: UserDeliveryModePanelProps) {
  const { t } = useTranslation();
  const enabled = usePaperLetterFlow();
  const { data, refetch } = useQuery(UserDeliveryPreferenceDocument, {
    variables: { userId },
    skip: !enabled,
  });
  const [setMode, { loading }] = useMutation(SetUserDeliveryModeDocument, {
    onCompleted: () => refetch(),
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
  });

  const preference = data?.userDeliveryPreference;

  if (!enabled || !preference) {
    return null;
  }

  const isLetter = preference.channel === MailChannel.Letter;
  const switchTo = (channel: MailChannel) =>
    setMode({ variables: { userId, channel } });

  return (
    <Panel
      bordered
      header={t('deliveryMode.panelTitle')}
      style={{ background: 'var(--rs-bg-card)' }}
    >
      <Stack
        spacing={12}
        direction="column"
        alignItems="flex-start"
      >
        <Tag
          color={isLetter ? 'orange' : 'blue'}
          size="lg"
        >
          {isLetter ?
            <MdMarkunreadMailbox style={{ marginRight: 6 }} />
          : <MdMailOutline style={{ marginRight: 6 }} />}
          {t(`deliveryMode.channel.${preference.channel}`)}
        </Tag>

        {preference.origin && (
          <Typography
            variant="caption"
            sx={{ display: 'block', color: 'var(--rs-text-secondary)' }}
          >
            <span>{t(`deliveryMode.origin.${preference.origin}`)}</span>
            {preference.reason && (
              <>
                {' · '}
                <span>
                  {t(`deliveryMode.reason.${reasonKey(preference.reason)}`)}
                </span>
              </>
            )}
            {preference.changedAt && (
              <>
                {' · '}
                {new Date(preference.changedAt).toLocaleDateString()}
                {preference.changedBy &&
                  ` · ${preference.changedBy.firstName ? `${preference.changedBy.firstName} ` : ''}${preference.changedBy.name}`}
              </>
            )}
          </Typography>
        )}

        {!preference.canReceiveLetters && (
          <Typography
            variant="caption"
            sx={{ display: 'block', color: 'var(--rs-text-secondary)' }}
          >
            {t('deliveryMode.noAddress')}
          </Typography>
        )}

        {isLetter ?
          <Button
            appearance="default"
            loading={loading}
            onClick={() => switchTo(MailChannel.Mail)}
          >
            {t('deliveryMode.switchToMail')}
          </Button>
        : <Button
            appearance="primary"
            loading={loading}
            disabled={!preference.canReceiveLetters}
            onClick={() => switchTo(MailChannel.Letter)}
          >
            {t('deliveryMode.switchToLetter')}
          </Button>
        }
      </Stack>
    </Panel>
  );
}
