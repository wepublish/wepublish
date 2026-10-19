import { useMutation, useQuery } from '@apollo/client/react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link as MuiLink,
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
import { Link } from 'react-router-dom';

import {
  deliveryChannel,
  suggestionMove,
  useDeliveryChannels,
} from './channels';
import { describeDeliveryChange, reasonKey } from './delivery-change';
import { usePaperLetterFlow } from './use-paper-letter-flow';

export type UserDeliveryModePanelProps = {
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
 * Which way this person's automated messages go, how that came about, and the
 * switch between channels for those who may. An open suggestion for the
 * person is answered right here, apply or keep.
 */
export function UserDeliveryModePanel({ userId }: UserDeliveryModePanelProps) {
  const { t } = useTranslation();
  const enabled = usePaperLetterFlow();
  const canManage = !!useAuthorisation('CAN_MANAGE_USER-DELIVERY-MODE');
  const channels = useDeliveryChannels();
  const [keeping, setKeeping] = useState(false);

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
  const [keep, { loading: keepLoading }] = useMutation(
    KeepDeliverySuggestionDocument,
    { refetchQueries: REFRESH, onError: showError }
  );

  const preference = data?.userDeliveryPreference;
  const suggestion = suggested?.userDeliverySuggestion;

  if (!enabled || !preference) {
    return null;
  }

  const current = deliveryChannel(preference.channel);
  const move = suggestion && suggestionMove(suggestion.kind);

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
              {describeDeliveryChange(t, preference, formatDate)}
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
                      onClick={() =>
                        confirm({ variables: { id: suggestion.id } })
                      }
                    >
                      {t('deliveryMode.confirm')}
                    </Button>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setKeeping(true)}
                    >
                      {t('deliveryChannel.suggestions.keep')}
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Alert>
          )}

          {/* The way back to the default is the quiet one. */}
          {canManage &&
            channels
              .filter(({ channel }) => channel !== preference.channel)
              .map(target => (
                <Button
                  key={target.channel}
                  variant={target.isDefault ? 'outlined' : 'contained'}
                  loading={switching}
                  disabled={
                    target.needsPostalAddress && !preference.canReceiveLetters
                  }
                  onClick={() =>
                    setMode({
                      variables: { userId, channel: target.channel },
                    })
                  }
                >
                  {t(target.switchToKey)}
                </Button>
              ))}

          <MuiLink
            component={Link}
            to="/deliverychannel"
            variant="body2"
          >
            {t('deliveryChannel.user.manageAll')}
          </MuiLink>
        </Stack>
      </CardContent>

      {/* Keeping is a manual decision: the nightly run never proposes this
          person again, in either direction. Say so before it happens. */}
      <Dialog
        open={keeping}
        onClose={() => setKeeping(false)}
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
            onClick={() => setKeeping(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            loading={keepLoading}
            onClick={() => {
              setKeeping(false);

              if (suggestion) {
                keep({ variables: { id: suggestion.id } });
              }
            }}
          >
            {t('deliveryChannel.suggestions.keepYes')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
