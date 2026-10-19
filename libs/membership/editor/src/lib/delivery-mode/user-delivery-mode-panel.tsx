import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Typography,
  Stack,
  Card,
  CardContent,
  CardHeader,
  Chip,
} from '@mui/material';
import {
  MailChannel,
  SetUserDeliveryModeDocument,
  UserDeliveryPreferenceDocument,
} from '@wepublish/editor/api';
import { humanizeError, enqueueSnackbar } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

import { deliveryChannel, useDeliveryChannels } from './channels';
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
      enqueueSnackbar(humanizeError(error), { variant: 'error' }),
  });
  const channels = useDeliveryChannels();

  const preference = data?.userDeliveryPreference;

  if (!enabled || !preference) {
    return null;
  }

  const current = deliveryChannel(preference.channel);
  const switchTo = (channel: MailChannel) =>
    setMode({ variables: { userId, channel } });

  return (
    <Card
      variant="outlined"
      sx={{ bgcolor: 'background.paper' }}
    >
      <CardHeader title={t('deliveryMode.panelTitle')} />

      <CardContent>
        <Stack
          sx={{ alignItems: 'flex-start' }}
          spacing={1.5}
          direction="column"
        >
          <Chip
            color={current.colour}
            icon={<current.icon />}
            label={t(current.labelKey)}
          />

          {preference.origin && (
            <Typography
              variant="caption"
              sx={{ display: 'block', color: 'text.secondary' }}
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
              sx={{ display: 'block', color: 'text.secondary' }}
            >
              {t('deliveryMode.noAddress')}
            </Typography>
          )}

          {/* The way back to the default is the quiet one. */}
          {channels
            .filter(({ channel }) => channel !== preference.channel)
            .map(target => (
              <Button
                key={target.channel}
                variant={target.isDefault ? 'outlined' : 'contained'}
                loading={loading}
                disabled={
                  target.needsPostalAddress && !preference.canReceiveLetters
                }
                onClick={() => switchTo(target.channel)}
              >
                {t(target.switchToKey)}
              </Button>
            ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
