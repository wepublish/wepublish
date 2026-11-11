import { useMutation, useQuery } from '@apollo/client/react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import {
  ConfirmDeliverySuggestionDocument,
  KeepDeliverySuggestionDocument,
  SetUserDeliveryModeDocument,
  UserDeliveryPreferenceDocument,
  UserDeliverySuggestionDocument,
} from '@wepublish/editor/api';
import {
  enqueueSnackbar,
  humanizeError,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  DEFAULT_DELIVERY_CHANNEL,
  deliveryChannel,
  suggestionMove,
  useDeliveryChannels,
} from './channels';
import { reasonKey } from './delivery-change';
import { usePaperLetterFlow } from './use-paper-letter-flow';

export type UserDeliveryChannelProps = {
  userId: string;
};

/** Everything a decision here changes elsewhere. */
const REFRESH = [
  'UserDeliveryPreference',
  'UserDeliverySuggestion',
  'DeliverySuggestionCounts',
  'DeliveryChannelCounts',
];

const showError = (error: unknown) =>
  enqueueSnackbar(humanizeError(error as never), { variant: 'error' });

const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

/**
 * The person's channel, their open suggestion and the ways to change both.
 * Two components read it so the controls can sit in a card's header and the
 * notes in its body; Apollo answers the second reader from the cache.
 */
function useUserDeliveryChannel(userId: string) {
  const { t } = useTranslation();
  const enabled = usePaperLetterFlow();
  const canManage = !!useAuthorisation('CAN_MANAGE_USER-DELIVERY-MODE');
  const channels = useDeliveryChannels();

  const { data } = useQuery(UserDeliveryPreferenceDocument, {
    variables: { userId },
    skip: !enabled,
  });
  const { data: suggested } = useQuery(UserDeliverySuggestionDocument, {
    variables: { userId },
    skip: !enabled,
  });

  const [setMode, { loading: switching }] = useMutation(
    SetUserDeliveryModeDocument,
    {
      refetchQueries: REFRESH,
      onError: showError,
      onCompleted: ({ setUserDeliveryMode: next }) =>
        enqueueSnackbar(
          t('deliveryChannel.user.switched', {
            channel: t(deliveryChannel(next.channel).labelKey),
          }),
          { variant: 'success' }
        ),
    }
  );
  const [confirm, { loading: confirming }] = useMutation(
    ConfirmDeliverySuggestionDocument,
    { refetchQueries: REFRESH, onError: showError }
  );
  const [keep, { loading: keeping }] = useMutation(
    KeepDeliverySuggestionDocument,
    { refetchQueries: REFRESH, onError: showError }
  );

  const preference = data?.userDeliveryPreference;

  return {
    t,
    canManage,
    channels,
    preference: enabled ? preference : undefined,
    suggestion: enabled ? suggested?.userDeliverySuggestion : undefined,
    switchTo: (channel: Parameters<typeof deliveryChannel>[0]) =>
      setMode({ variables: { userId, channel } }),
    switching,
    confirm: (id: string) => confirm({ variables: { id } }),
    confirming,
    keep: (id: string) => keep({ variables: { id } }),
    keeping,
  };
}

/**
 * For a card header: which way this person's automated messages go, and the
 * switch to the other channels for those who may.
 */
export function UserDeliveryChannelControls({
  userId,
}: UserDeliveryChannelProps) {
  const { t, canManage, channels, preference, switchTo, switching } =
    useUserDeliveryChannel(userId);

  if (!preference) {
    return null;
  }

  return (
    <Stack
      direction="row"
      spacing={1}
      useFlexGap
      sx={{ alignItems: 'center', flexWrap: 'wrap' }}
    >
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary' }}
      >
        {t('deliveryChannel.user.channelLabel')}
      </Typography>
      {/* One pill per channel, the current one filled; clicking another is
          the switch, for those who may. */}
      {channels.map(option => {
        const active = option.channel === preference.channel;
        const outOfReach =
          option.needsPostalAddress && !preference.canReceiveLetters;
        const clickable = canManage && !active && !switching;

        return (
          <Chip
            key={option.channel}
            size="small"
            variant={active ? 'filled' : 'outlined'}
            color={option.colour}
            icon={<option.icon />}
            label={t(option.labelKey)}
            disabled={outOfReach}
            onClick={clickable ? () => switchTo(option.channel) : undefined}
          />
        );
      })}
    </Stack>
  );
}

/**
 * For the card's body: why letters may be out of reach, and the person's
 * open suggestion to apply or keep. Renders nothing when there is nothing
 * to say.
 */
export function UserDeliveryChannelNotes({ userId }: UserDeliveryChannelProps) {
  const {
    t,
    canManage,
    preference,
    suggestion,
    confirm,
    confirming,
    keep,
    keeping,
  } = useUserDeliveryChannel(userId);
  const [asking, setAsking] = useState(false);

  if (!preference) {
    return null;
  }

  const current = deliveryChannel(preference.channel);
  const move = suggestion && suggestionMove(suggestion.kind);
  // Email may always be chosen; say when it will not reach this person.
  const emailUnreachable = deliveryChannel(
    DEFAULT_DELIVERY_CHANNEL
  ).unreachableEmailSegments.includes(preference.emailSegment);

  // How the person got onto their channel stays with the overview; here only
  // what asks for a decision or explains a pill.
  if (preference.canReceiveLetters && !emailUnreachable && !suggestion) {
    return null;
  }

  return (
    <Box sx={{ px: 2, pb: 1.5 }}>
      <Stack
        spacing={1}
        sx={{ alignItems: 'flex-start' }}
      >
        {!preference.canReceiveLetters && (
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary' }}
          >
            {t('deliveryMode.noAddress')}
          </Typography>
        )}

        {emailUnreachable && (
          <Typography
            variant="caption"
            sx={{ color: 'warning.main' }}
          >
            {t('deliveryChannel.user.emailUnreachable', {
              segment: t(`mailSend.emailSegments.${preference.emailSegment}`),
            })}
          </Typography>
        )}

        {suggestion && move && (
          <Alert
            severity="info"
            sx={{ width: '100%' }}
          >
            <Stack spacing={1}>
              <strong>
                {t('deliveryChannel.user.suggestion', {
                  move: t(deliveryChannel(move.to).switchToKey),
                })}
              </strong>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center' }}
              >
                <Chip
                  size="small"
                  label={t(
                    `deliveryMode.reason.${reasonKey(suggestion.reason)}`
                  )}
                />
                <Typography variant="caption">
                  {t('deliveryMode.table.since')}{' '}
                  {formatDate(suggestion.createdAt)}
                </Typography>
              </Stack>
              {canManage && (
                <Stack
                  direction="row"
                  spacing={1}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    loading={confirming}
                    onClick={() => confirm(suggestion.id)}
                  >
                    {t('deliveryMode.confirm')}
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setAsking(true)}
                  >
                    {t('deliveryChannel.suggestions.keep')}
                  </Button>
                </Stack>
              )}
            </Stack>
          </Alert>
        )}
      </Stack>

      {/* Keeping is a manual decision: the nightly run never proposes this
          person again, in either direction. Say so before it happens. */}
      <Dialog
        open={asking}
        onClose={() => setAsking(false)}
      >
        <DialogTitle>{t('deliveryChannel.suggestions.keepTitle')}</DialogTitle>
        <DialogContent>
          {suggestion &&
            t('deliveryChannel.suggestions.keepText', {
              name: [suggestion.user.firstName, suggestion.user.name]
                .filter(Boolean)
                .join(' '),
              channel: t(current.labelKey),
            })}
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            onClick={() => setAsking(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            loading={keeping}
            onClick={() => {
              setAsking(false);

              if (suggestion) {
                keep(suggestion.id);
              }
            }}
          >
            {t('deliveryChannel.suggestions.keepYes')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
