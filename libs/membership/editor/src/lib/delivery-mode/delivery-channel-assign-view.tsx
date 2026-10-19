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
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import {
  DeliveryModeAudiencePreviewDocument,
  MailChannel,
  SetDeliveryModeForAudienceDocument,
} from '@wepublish/editor/api';
import {
  enqueueSnackbar,
  humanizeError,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { AudienceFilter } from '../mail-send/audience/audience-filter';
import {
  AudienceFilterState,
  INITIAL_AUDIENCE_STATE,
  useAudienceState,
} from '../mail-send/audience/audience-state';
import { describeAudience } from '../mail-send/audience/audience-summary';
import { RecipientListModal } from '../mail-send/audience/recipient-list-modal';
import { RecipientSummary } from '../mail-send/audience/recipient-summary';
import { canGoToStep, StepNav, WizardStepper } from '../mail-send/step-nav';
import { deliveryChannel, useDeliveryChannels } from './channels';
import { useAudienceLookups } from './use-audience-lookups';

const STEP_AUDIENCE = 0;
const STEP_CHANNEL = 1;
const STEP_REVIEW = 2;
const STEP_KEYS = ['audience', 'channel', 'review'] as const;

type Result = { changed: number; skippedWithoutAddress: number };

/**
 * Switch everyone in an audience to one channel, in three steps like a manual
 * send: who, which channel, then a last look. The send page can hand an
 * audience over through the location state.
 */
export function DeliveryChannelAssignView() {
  const { t } = useTranslation();
  const location = useLocation();
  const canListRecipients = useAuthorisation('CAN_SEND_MAIL-TEMPLATES');
  const channels = useDeliveryChannels();
  const lookups = useAudienceLookups();

  const handedOver = (
    location.state as { audience?: Partial<AudienceFilterState> } | null
  )?.audience;
  const { state, update, audience } = useAudienceState(
    handedOver ? { ...INITIAL_AUDIENCE_STATE, ...handedOver } : undefined
  );

  const [step, setStep] = useState(STEP_AUDIENCE);
  const [channel, setChannel] = useState<MailChannel>(MailChannel.Letter);
  const [recipientsOpen, setRecipientsOpen] = useState(false);
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // Always fresh: a stale count must not be what someone agrees to.
  const { data, loading, refetch } = useQuery(
    DeliveryModeAudiencePreviewDocument,
    {
      variables: { audience, channel },
      fetchPolicy: 'network-only',
    }
  );
  const [apply, { loading: applying }] = useMutation(
    SetDeliveryModeForAudienceDocument,
    {
      refetchQueries: [
        'DeliveryChannelCounts',
        'UsersByDeliveryChannel',
        'DeliveryModeBulkChanges',
      ],
      onError: error =>
        enqueueSnackbar(humanizeError(error), { variant: 'error' }),
      onCompleted: ({ setDeliveryModeForAudience: done }) => setResult(done),
    }
  );

  const preview = data?.deliveryModeAudiencePreview;
  const userCount = preview?.userCount ?? 0;
  const skipped = preview?.withoutAddressCount ?? 0;
  const target = deliveryChannel(channel);
  // The preview belongs to the current audience only once it has loaded for
  // it; while it is on its way, nothing may be agreed to.
  const settled = !loading && !!preview;

  const stepComplete = [settled && userCount > 0, settled];
  const canGoTo = (to: number) =>
    canGoToStep(to, { step, complete: stepComplete, locked: !!result });

  const restart = () => {
    setResult(null);
    setStep(STEP_AUDIENCE);
  };

  return (
    <div>
      <WizardStepper
        steps={STEP_KEYS.map(key => ({
          title: t(`deliveryChannel.assign.steps.${key}.title`),
          description: t(`deliveryChannel.assign.steps.${key}.description`),
        }))}
        step={step}
        canGoTo={canGoTo}
        onStep={setStep}
      />

      {step === STEP_AUDIENCE && (
        <>
          <Card
            variant="outlined"
            style={{ marginTop: 16 }}
          >
            <CardHeader
              title={t('deliveryChannel.assign.steps.audience.title')}
            />
            <CardContent>
              <AudienceFilter
                state={state}
                onChange={update}
              />
            </CardContent>
          </Card>

          <RecipientSummary
            loading={loading && !preview}
            headline={t('deliveryChannel.assign.people', { count: userCount })}
            count={userCount}
            userCount={userCount}
            channel={MailChannel.Mail}
            withoutAddressCount={0}
            segmentCounts={preview?.segments ?? []}
            selectedSegments={state.emailSegments}
            onPickSegment={segment =>
              update({
                emailSegments:
                  state.emailSegments.includes(segment) ?
                    state.emailSegments.filter(item => item !== segment)
                  : [...state.emailSegments, segment],
              })
            }
            onRefreshed={() => refetch()}
            missing={[]}
            onShowRecipients={
              canListRecipients ? () => setRecipientsOpen(true) : undefined
            }
          />

          {canListRecipients && (
            <RecipientListModal
              open={recipientsOpen}
              onClose={() => setRecipientsOpen(false)}
              audience={audience}
              channel={MailChannel.Letter}
              totalCount={userCount}
            />
          )}

          <StepNav
            onNext={() => setStep(STEP_CHANNEL)}
            nextDisabled={!canGoTo(STEP_CHANNEL)}
          />
        </>
      )}

      {step === STEP_CHANNEL && (
        <>
          <Card
            variant="outlined"
            style={{ marginTop: 16 }}
          >
            <CardHeader
              title={t('deliveryChannel.assign.steps.channel.title')}
            />
            <CardContent>
              <Typography variant="body2">
                {t('deliveryMode.audience.intro')}
              </Typography>
              <RadioGroup
                value={channel}
                onChange={(_event, value) => setChannel(value as MailChannel)}
                sx={{ marginTop: 1.5 }}
              >
                {channels.map(option => (
                  <FormControlLabel
                    key={option.channel}
                    value={option.channel}
                    control={<Radio />}
                    label={t(option.labelKey)}
                  />
                ))}
              </RadioGroup>

              {settled && target.needsPostalAddress && skipped > 0 && (
                <Alert
                  severity="warning"
                  sx={{ marginTop: 1.5 }}
                >
                  {t('deliveryChannel.assign.noAddress', { count: skipped })}
                </Alert>
              )}
            </CardContent>
          </Card>

          <StepNav
            onBack={() => setStep(STEP_AUDIENCE)}
            onNext={() => setStep(STEP_REVIEW)}
            nextDisabled={!canGoTo(STEP_REVIEW)}
          />
        </>
      )}

      {step === STEP_REVIEW && (
        <>
          <Card
            variant="outlined"
            style={{ marginTop: 16 }}
          >
            <CardHeader
              title={t('deliveryChannel.assign.steps.review.title')}
            />
            <CardContent>
              <Stack spacing={2}>
                <Chip
                  color={target.colour}
                  icon={<target.icon />}
                  label={t(target.labelKey)}
                  sx={{ alignSelf: 'flex-start' }}
                />

                {/* The same phrases the history shows afterwards. */}
                <Stack
                  direction="row"
                  spacing={0.5}
                  useFlexGap
                  sx={{ flexWrap: 'wrap' }}
                >
                  {describeAudience(
                    audience as unknown as Record<string, unknown>,
                    lookups
                  ).map(phrase => (
                    <Chip
                      key={phrase}
                      size="small"
                      label={phrase}
                    />
                  ))}
                </Stack>

                {result ?
                  <Alert severity="success">
                    {t(`deliveryMode.audience.done.${channel}`, result)}
                  </Alert>
                : <Typography>
                    {t(`deliveryChannel.assign.summary.${channel}`, {
                      changed:
                        userCount - (target.needsPostalAddress ? skipped : 0),
                      skipped,
                    })}
                  </Typography>
                }
              </Stack>
            </CardContent>
          </Card>

          {result ?
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ justifyContent: 'flex-end', marginTop: 2 }}
            >
              <Button
                variant="text"
                onClick={restart}
              >
                {t('deliveryChannel.assign.again')}
              </Button>
              <Button
                variant="contained"
                component={Link}
                to="/deliverychannel/history"
              >
                {t('deliveryChannel.assign.showHistory')}
              </Button>
            </Stack>
          : <Stack
              direction="row"
              spacing={1.5}
              sx={{ justifyContent: 'flex-end', marginTop: 2 }}
            >
              <Button
                variant="text"
                onClick={() => setStep(STEP_CHANNEL)}
              >
                {t('mailSend.back')}
              </Button>
              <Button
                variant="contained"
                loading={applying}
                disabled={!settled || userCount === 0}
                onClick={() => setAsking(true)}
              >
                {t('deliveryMode.audience.apply')}
              </Button>
            </Stack>
          }
        </>
      )}

      <Dialog
        open={asking}
        onClose={() => setAsking(false)}
      >
        <DialogTitle>
          {t('deliveryChannel.assign.confirmTitle', {
            channel: t(target.labelKey),
          })}
        </DialogTitle>
        <DialogContent>
          {t(`deliveryChannel.assign.summary.${channel}`, {
            changed: userCount - (target.needsPostalAddress ? skipped : 0),
            skipped,
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
            onClick={() => {
              setAsking(false);
              apply({ variables: { audience, channel } });
            }}
          >
            {t('deliveryMode.audience.apply')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
