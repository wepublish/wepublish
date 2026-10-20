import { useMutation, useQuery } from '@apollo/client/react';
import {
  CreateMailSendJobDocument,
  LetterAddressPosition,
  LetterChannelAvailableDocument,
  LetterDeliveryProduct,
  LetterPrintMode,
  LetterPrintSpectrum,
  MailAudienceInput,
  MailChannel,
  MailEmailFilter,
  MailLogState,
  MailRecipientBase,
  MailSendJobDocument,
  MailSendPreviewDocument,
  MailSendRecipientPreviewDocument,
  MailSendRecipientsDocument,
  MailSubscriptionState,
  MailTemplateDocument,
  MailTemplateMissingPlaceholdersDocument,
  MemberPlanListDocument,
  PaymentMethodListDocument,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DateRangeFilter,
  enqueueSnackbar,
  humanizeError,
  InfoTooltip,
  ListViewContainer,
  ListViewHeader,
  PageTitle,
  Pagination,
} from '@wepublish/ui/editor';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Button as MuiButton,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  InputAdornment,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  Stack as MuiStack,
  Step,
  StepButton,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAdd,
  MdArrowBack,
  MdArrowForward,
  MdCancel,
  MdCheckCircle,
  MdEdit,
  MdSend,
} from 'react-icons/md';
import { Link } from 'react-router-dom';
import { mailErrorHelpKey } from './mail-log-common';
import {
  CancelJobButton,
  canResume,
  isActive,
  JobProgressBar,
  openCount,
  ResumeJobButton,
} from './mail-job-common';
import { MailPreview } from '../mail-template/mail-preview';
import { LetterPreview } from '../mail-template/letter-preview';

/** Mirrors the API default for the win-back look-back window. */
const DEFAULT_ENDED_WITHIN_DAYS = 90;

/** The print options as the editor holds them: chosen, so never null. */
type PrintSettings = {
  addressPosition: LetterAddressPosition;
  deliveryProduct: LetterDeliveryProduct;
  printMode: LetterPrintMode;
  printSpectrum: LetterPrintSpectrum;
};

/** Mirrors the API defaults for a letter send. */
const DEFAULT_PRINT: PrintSettings = {
  addressPosition: LetterAddressPosition.Left,
  deliveryProduct: LetterDeliveryProduct.Cheap,
  printMode: LetterPrintMode.Simplex,
  printSpectrum: LetterPrintSpectrum.Grayscale,
};

/** How the author expresses "recently ended": rolling days or a fixed period. */
type EndedMode = 'days' | 'period';
type DateRange = [Date, Date];

/**
 * The three stages the author walks through: content, audience, send. Content
 * comes first because it settles the medium, and the medium decides what the
 * recipient count even means — a letter goes to a person, a mail to a
 * subscription.
 */
const STEP_CONTENT = 0;
const STEP_AUDIENCE = 1;
const STEP_SEND = 2;
const STEP_KEYS = ['content', 'audience', 'send'] as const;

/**
 * Width of the wizard column. Fixed rather than fluid so the steps keep their
 * layout whether or not a template is selected — the preview beside it absorbs
 * every bit of remaining screen instead. Kept just wide enough for the steps
 * and the print options, because the letter is the thing worth reading.
 */
const WIZARD_WIDTH = 560;

/**
 * Templates are edited in a second browser tab, so everything derived from one
 * — the rendered preview, the placeholder list, the template's name — is stale
 * the moment the author switches away. Re-run the query when this tab is looked
 * at again, which is exactly when the author expects to see their edit.
 */
function useRefetchOnFocus(refetch: () => Promise<unknown>, enabled = true) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const refresh = () => {
      if (document.visibilityState === 'visible') {
        // Errors already surface through the query's own onError handler.
        refetch().catch(() => undefined);
      }
    };

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);

    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [refetch, enabled]);
}

const endOfDay = (date?: Date): string | undefined => {
  if (!date) {
    return undefined;
  }

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return end.toISOString();
};

function MailSendPage() {
  const { t } = useTranslation();

  const [templateId, setTemplateId] = useState<string | null>(null);
  const [base, setBase] = useState<MailRecipientBase>(
    MailRecipientBase.AllUsers
  );
  const [memberPlanIDs, setMemberPlanIDs] = useState<string[]>([]);
  const [subscriptionState, setSubscriptionState] =
    useState<MailSubscriptionState | null>(null);
  const [autoRenew, setAutoRenew] = useState<string>('any');
  const [paymentMethodID, setPaymentMethodID] = useState<string | null>(null);
  const [periodicity, setPeriodicity] = useState<PaymentPeriodicity | null>(
    null
  );
  const [startsAtFrom, setStartsAtFrom] = useState<Date | null>(null);
  const [startsAtTo, setStartsAtTo] = useState<Date | null>(null);
  const [endsAtFrom, setEndsAtFrom] = useState<Date | null>(null);
  const [endsAtTo, setEndsAtTo] = useState<Date | null>(null);
  const [isPaid, setIsPaid] = useState<string>('any');
  const [isCanceled, setIsCanceled] = useState<string>('any');
  const [hasReplaced, setHasReplaced] = useState<string>('any');
  const [endedWithinDays, setEndedWithinDays] = useState(
    DEFAULT_ENDED_WITHIN_DAYS
  );
  const [endedMode, setEndedMode] = useState<EndedMode>('days');
  const [endedPeriod, setEndedPeriod] = useState<DateRange | null>(null);
  const [emailFilter, setEmailFilter] = useState<MailEmailFilter>(
    MailEmailFilter.All
  );

  const [channel, setChannel] = useState<MailChannel>(MailChannel.Mail);
  const [print, setPrint] = useState<PrintSettings>(DEFAULT_PRINT);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recipientsOpen, setRecipientsOpen] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [step, setStep] = useState(STEP_CONTENT);

  const { data: templateData, refetch: refetchTemplates } =
    useQuery(MailTemplateDocument);
  // Without a letter integration every send is a mail, so there is no channel
  // to choose and nothing to say about it.
  const { data: letterChannelData } = useQuery(LetterChannelAvailableDocument);
  const letterAvailable = !!letterChannelData?.letterChannelAvailable;
  const { data: memberPlanData } = useQuery(MemberPlanListDocument, {
    variables: { take: 100 },
  });
  const { data: paymentMethodData } = useQuery(PaymentMethodListDocument);

  const isSubscriptionBase = base === MailRecipientBase.HasSubscription;
  const isWinBackBase = base === MailRecipientBase.EndedSubscription;

  const audience = useMemo<MailAudienceInput>(() => {
    if (isWinBackBase) {
      const usePeriod = endedMode === 'period' && endedPeriod?.length === 2;

      return {
        base,
        emailFilter,
        // Either an explicit period or the rolling window — never both, so the
        // backend does not have to guess which one the author meant.
        endedWithinDays: usePeriod ? undefined : endedWithinDays,
        endedFrom: usePeriod ? endedPeriod?.[0].toISOString() : undefined,
        // The picker returns midnight, so stretch the end over the whole day.
        endedTo: usePeriod ? endOfDay(endedPeriod?.[1]) : undefined,
        memberPlanIDs: memberPlanIDs.length ? memberPlanIDs : undefined,
      };
    }

    if (!isSubscriptionBase) {
      return { base, emailFilter };
    }

    return {
      base,
      emailFilter,
      memberPlanIDs: memberPlanIDs.length ? memberPlanIDs : undefined,
      subscriptionState: subscriptionState ?? undefined,
      autoRenew: autoRenew === 'any' ? undefined : autoRenew === 'true',
      paymentMethodID: paymentMethodID ?? undefined,
      paymentPeriodicity: periodicity ?? undefined,
      startsAtFrom: startsAtFrom ? startsAtFrom.toISOString() : undefined,
      startsAtTo: endOfDay(startsAtTo ?? undefined),
      endsAtFrom: endsAtFrom ? endsAtFrom.toISOString() : undefined,
      endsAtTo: endOfDay(endsAtTo ?? undefined),
      isPaid: isPaid === 'any' ? undefined : isPaid === 'true',
      isCanceled: isCanceled === 'any' ? undefined : isCanceled === 'true',
      hasReplacedSubscription:
        hasReplaced === 'any' ? undefined : hasReplaced === 'true',
    };
  }, [
    base,
    emailFilter,
    isSubscriptionBase,
    isWinBackBase,
    endedWithinDays,
    endedMode,
    endedPeriod,
    memberPlanIDs,
    subscriptionState,
    autoRenew,
    paymentMethodID,
    periodicity,
    startsAtFrom,
    startsAtTo,
    endsAtFrom,
    endsAtTo,
    isPaid,
    isCanceled,
    hasReplaced,
  ]);

  const { data: previewData, loading: previewLoading } = useQuery(
    MailSendRecipientPreviewDocument,
    {
      variables: { audience, channel },
    }
  );

  const [createJob, { loading: creating }] = useMutation(
    CreateMailSendJobDocument,
    {
      onError: error =>
        enqueueSnackbar(humanizeError(error), { variant: 'error' }),
      onCompleted: result => {
        setJobId(result.createMailSendJob.id);
        enqueueSnackbar(t('mailSend.started'), {
          variant: 'success',
          autoHideDuration: 3000,
        });
      },
    }
  );

  // Messages, not people: for a mail one person can match through several
  // subscriptions and receives one each. A letter send is already collapsed to
  // one per person by the API, so there `count === userCount`.
  const count = previewData?.mailSendRecipientPreview.count ?? 0;
  const userCount = previewData?.mailSendRecipientPreview.userCount ?? 0;
  const allowsSubscriptionTemplates =
    previewData?.mailSendRecipientPreview.allowsSubscriptionTemplates ?? false;
  const isLetter = channel === MailChannel.Letter;
  // A letter send skips whoever has no usable postal address, so say how many
  // that is before the send rather than leaving it to the log.
  const withoutAddressCount =
    previewData?.mailSendRecipientPreview.withoutAddressCount ?? 0;

  // Warn (never block) when the template uses placeholders that this audience
  // won't fill. `withSubscriptionData` mirrors whether the audience carries a
  // subscription per recipient.
  const { data: missingData, refetch: refetchMissing } = useQuery(
    MailTemplateMissingPlaceholdersDocument,
    {
      skip: !templateId,
      variables: {
        templateId: templateId as string,
        withSubscriptionData: allowsSubscriptionTemplates,
      },
    }
  );
  // The query is skipped without a template, but Apollo can still hand back the
  // previously selected template's result — so gate on the template as well.
  const missing =
    templateId ? (missingData?.mailTemplateMissingPlaceholders ?? []) : [];

  useRefetchOnFocus(refetchTemplates);
  useRefetchOnFocus(refetchMissing, !!templateId);

  // A job is created per click, so the button stays disabled afterwards —
  // re-sending is a deliberate act (reload the page), never a double click.
  const canSend = !!templateId && count > 0 && !creating && !jobId;

  const templateName = (templateData?.mailTemplates ?? []).find(
    template => template.id === templateId
  )?.name;

  // What each step has to produce before the next one makes sense: a template
  // to send, then an audience with recipients.
  const stepComplete = [!!templateId, count > 0 && !previewLoading];

  // Once the job exists the wizard is done — stepping back would only offer
  // edits that can no longer affect the running send.
  const canGoTo = (target: number) => {
    if (target === step) {
      return true;
    }

    if (jobId) {
      return false;
    }

    if (target < step) {
      return true;
    }

    return stepComplete.slice(step, target).every(Boolean);
  };

  const onConfirm = async () => {
    if (!templateId) {
      return;
    }
    setConfirmOpen(false);
    await createJob({
      variables: {
        input: {
          mailTemplateId: templateId,
          audience,
          channel,
          print: isLetter ? print : undefined,
        },
      },
    });
  };

  const recipientSummary = ({
    action,
    showMissing = true,
  }: { action?: ReactElement; showMissing?: boolean } = {}) => (
    <RecipientSummary
      loading={previewLoading}
      count={count}
      userCount={userCount}
      isLetter={isLetter}
      withoutAddressCount={withoutAddressCount}
      missing={showMissing ? missing : []}
      onShowRecipients={() => setRecipientsOpen(true)}
      action={action}
    />
  );

  return (
    <div style={{ flexShrink: 0 }}>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('mailSend.title')}</PageTitle>
        </ListViewHeader>
      </ListViewContainer>

      {/* The preview sits beside the wizard on the send step only, as the last
          check before sending. The wizard column is a fixed width on every
          step, so showing the preview never re-flows the wizard. */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          alignItems: 'start',
          gridTemplateColumns: {
            xs: '1fr',
            lg:
              step === STEP_SEND ?
                `${WIZARD_WIDTH}px minmax(0, 1fr)`
              : `${WIZARD_WIDTH}px`,
          },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stepper
            activeStep={step}
            nonLinear
            sx={{ marginTop: 3, marginBottom: 1 }}
          >
            {STEP_KEYS.map((key, index) => (
              <Step key={key}>
                <StepButton
                  disabled={!canGoTo(index)}
                  optional={
                    <Typography variant="caption">
                      {t(`mailSend.steps.${key}.description`)}
                    </Typography>
                  }
                  onClick={() => setStep(index)}
                >
                  {t(`mailSend.steps.${key}.title`)}
                </StepButton>
              </Step>
            ))}
          </Stepper>

          {step === STEP_CONTENT && (
            <>
              <Card
                variant="outlined"
                style={{ marginTop: 16 }}
              >
                <CardHeader title={t('mailSend.template')} />

                <CardContent>
                  <div
                    style={{ display: 'flex', gap: 12, alignItems: 'center' }}
                  >
                    <TextField
                      select
                      value={templateId ?? ''}
                      onChange={event => setTemplateId(event.target.value)}
                      fullWidth
                      slotProps={{ select: { displayEmpty: true } }}
                    >
                      <MenuItem value="">
                        {t('mailSend.selectTemplate')}
                      </MenuItem>

                      {(templateData?.mailTemplates ?? []).map(template => (
                        <MenuItem
                          key={template.id}
                          value={template.id}
                        >
                          {template.name}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Button
                      variant="outlined"
                      startIcon={<MdAdd />}
                      component={Link}
                      to="/mailtemplates/create"
                      target="_blank"
                    >
                      {t('mailSend.createTemplate')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {letterAvailable && (
                <ChannelPanel
                  channel={channel}
                  onChannelChange={setChannel}
                  print={print}
                  onPrintChange={setPrint}
                />
              )}

              <StepNav
                onNext={() => setStep(STEP_AUDIENCE)}
                nextDisabled={!stepComplete[STEP_CONTENT]}
              />
            </>
          )}

          {step === STEP_AUDIENCE && (
            <>
              <Card
                variant="outlined"
                style={{ marginTop: 16 }}
              >
                <CardHeader title={t('mailSend.audience.title')} />

                <CardContent>
                  <Stack
                    spacing={3}
                    sx={{ width: '100%' }}
                  >
                    <FormControl fullWidth>
                      <FormLabel>{t('mailSend.base.label')}</FormLabel>
                      <RadioGroup
                        value={base}
                        onChange={(_event, value) =>
                          setBase(value as MailRecipientBase)
                        }
                      >
                        {[
                          MailRecipientBase.AllUsers,
                          MailRecipientBase.HasSubscription,
                          MailRecipientBase.NoActiveSubscription,
                          MailRecipientBase.EndedSubscription,
                        ].map(option => (
                          <FormControlLabel
                            key={option}
                            value={option}
                            control={<Radio />}
                            label={
                              <>
                                <div>{t(`mailSend.base.${option}`)}</div>
                                <Typography
                                  variant="caption"
                                  style={{
                                    color: 'text.secondary',
                                    whiteSpace: 'normal',
                                    lineHeight: 1.35,
                                  }}
                                  sx={{
                                    display: 'block',
                                  }}
                                >
                                  {t(`mailSend.base.${option}Hint`)}
                                </Typography>
                              </>
                            }
                          />
                        ))}
                      </RadioGroup>

                      <MissingPlaceholdersWarning missing={missing} />
                    </FormControl>

                    <Divider />
                    <FormControl fullWidth>
                      <FormLabel>{t('mailSend.emailFilter.label')}</FormLabel>
                      <RadioGroup
                        row
                        value={emailFilter}
                        onChange={(_event, value) =>
                          setEmailFilter(value as MailEmailFilter)
                        }
                      >
                        {[
                          MailEmailFilter.All,
                          MailEmailFilter.Placeholder,
                          MailEmailFilter.Real,
                        ].map(option => (
                          <FormControlLabel
                            key={option}
                            value={option}
                            control={<Radio />}
                            label={t(`mailSend.emailFilter.${option}`)}
                          />
                        ))}
                      </RadioGroup>
                      <FormHelperText>
                        {t('mailSend.emailFilter.hint')}
                      </FormHelperText>
                    </FormControl>

                    {isWinBackBase && (
                      <>
                        <Divider />
                        <FormControl fullWidth>
                          <FormLabel>
                            {t('mailSend.endedWindow.label')}
                          </FormLabel>
                          <RadioGroup
                            row
                            value={endedMode}
                            onChange={(_event, value) =>
                              setEndedMode(value as EndedMode)
                            }
                          >
                            <FormControlLabel
                              value="days"
                              control={<Radio />}
                              label={t('mailSend.endedWindow.relative')}
                            />
                            <FormControlLabel
                              value="period"
                              control={<Radio />}
                              label={t('mailSend.endedWindow.period')}
                            />
                          </RadioGroup>

                          {endedMode === 'days' ?
                            <>
                              <TextField
                                type="number"
                                value={endedWithinDays}
                                onChange={event => {
                                  const parsed = parseInt(
                                    event.target.value,
                                    10
                                  );

                                  if (Number.isFinite(parsed) && parsed > 0) {
                                    setEndedWithinDays(parsed);
                                  }
                                }}
                                slotProps={{
                                  htmlInput: { min: 1, max: 3650 },
                                  input: {
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        {t('mailSend.endedWindow.days')}
                                      </InputAdornment>
                                    ),
                                  },
                                }}
                                style={{ width: 180 }}
                              />
                              <FormHelperText>
                                {t('mailSend.endedWithinDaysHint')}
                              </FormHelperText>
                            </>
                          : <>
                              <DateRangeFilter
                                label={t('mailSend.endedWindow.periodFrom')}
                                disableFuture
                                value={{
                                  from: endedPeriod?.[0] ?? null,
                                  to: endedPeriod?.[1] ?? null,
                                }}
                                onChange={({ from, to }) =>
                                  setEndedPeriod(from && to ? [from, to] : null)
                                }
                              />
                              <FormHelperText>
                                {t('mailSend.endedWindow.periodHint')}
                              </FormHelperText>
                            </>
                          }
                        </FormControl>

                        <FormControl fullWidth>
                          <FormLabel>{t('mailSend.memberPlans')}</FormLabel>
                          <Autocomplete
                            multiple
                            disableCloseOnSelect
                            options={(
                              memberPlanData?.memberPlans.nodes ?? []
                            ).map(plan => plan.id)}
                            getOptionLabel={option =>
                              (memberPlanData?.memberPlans.nodes ?? [])
                                .filter(plan => plan.id === option)
                                .map(plan => plan.name)[0] ?? option
                            }
                            value={memberPlanIDs}
                            onChange={(_event, value) =>
                              setMemberPlanIDs(value as string[])
                            }
                            renderInput={params => (
                              <TextField
                                {...params}
                                placeholder={t('mailSend.memberPlansAll')}
                              />
                            )}
                          />
                        </FormControl>
                      </>
                    )}

                    {isSubscriptionBase && (
                      <>
                        <Divider />
                        <FormControl fullWidth>
                          <FormLabel>{t('mailSend.memberPlans')}</FormLabel>
                          <Autocomplete
                            multiple
                            disableCloseOnSelect
                            options={(
                              memberPlanData?.memberPlans.nodes ?? []
                            ).map(plan => plan.id)}
                            getOptionLabel={option =>
                              (memberPlanData?.memberPlans.nodes ?? [])
                                .filter(plan => plan.id === option)
                                .map(plan => plan.name)[0] ?? option
                            }
                            value={memberPlanIDs}
                            onChange={(_event, value) =>
                              setMemberPlanIDs(value as string[])
                            }
                            renderInput={params => (
                              <TextField
                                {...params}
                                placeholder={t('mailSend.memberPlansAll')}
                              />
                            )}
                          />
                        </FormControl>

                        <FormControl fullWidth>
                          <FormLabel>
                            {t('mailSend.state.label')}{' '}
                            <InfoTooltip text={t('mailSend.stateHelp')} />
                          </FormLabel>
                          <TextField
                            select
                            value={subscriptionState ?? ''}
                            onChange={event =>
                              setSubscriptionState(
                                event.target.value as MailSubscriptionState
                              )
                            }
                            fullWidth
                            slotProps={{ select: { displayEmpty: true } }}
                          >
                            <MenuItem value="">
                              {t('mailSend.state.any')}
                            </MenuItem>

                            {Object.values(MailSubscriptionState).map(value => (
                              <MenuItem
                                key={value}
                                value={value}
                              >
                                {t(`mailSend.state.${value}`)}
                              </MenuItem>
                            ))}
                          </TextField>
                        </FormControl>

                        <FormControl fullWidth>
                          <FormLabel>
                            {t('mailSend.autoRenew')}{' '}
                            <InfoTooltip text={t('mailSend.autoRenewHelp')} />
                          </FormLabel>
                          <TextField
                            select
                            value={autoRenew ?? ''}
                            onChange={event => {
                              const value = event.target.value;
                              setAutoRenew(value ?? 'any');
                            }}
                            fullWidth
                          >
                            <MenuItem
                              key={'any'}
                              value={'any'}
                            >
                              {t('mailSend.any')}
                            </MenuItem>

                            <MenuItem
                              key={'true'}
                              value={'true'}
                            >
                              {t('mailSend.yes')}
                            </MenuItem>

                            <MenuItem
                              key={'false'}
                              value={'false'}
                            >
                              {t('mailSend.no')}
                            </MenuItem>
                          </TextField>
                        </FormControl>

                        <FormControl fullWidth>
                          <FormLabel>{t('mailSend.paymentMethod')}</FormLabel>
                          <TextField
                            select
                            value={paymentMethodID ?? ''}
                            onChange={event =>
                              setPaymentMethodID(event.target.value)
                            }
                            fullWidth
                            slotProps={{ select: { displayEmpty: true } }}
                          >
                            <MenuItem value="">{t('mailSend.any')}</MenuItem>

                            {(paymentMethodData?.paymentMethods ?? []).map(
                              method => (
                                <MenuItem
                                  key={method.id}
                                  value={method.id}
                                >
                                  {method.name}
                                </MenuItem>
                              )
                            )}
                          </TextField>
                        </FormControl>

                        <FormControl fullWidth>
                          <FormLabel>{t('mailSend.periodicity')}</FormLabel>
                          <TextField
                            select
                            value={periodicity ?? ''}
                            onChange={event =>
                              setPeriodicity(
                                event.target.value as PaymentPeriodicity
                              )
                            }
                            fullWidth
                            slotProps={{ select: { displayEmpty: true } }}
                          >
                            <MenuItem value="">{t('mailSend.any')}</MenuItem>

                            {Object.values(PaymentPeriodicity).map(value => (
                              <MenuItem
                                key={value}
                                value={value}
                              >
                                {t(
                                  `memberPlanList.paymentPeriodicity.${value}`
                                )}
                              </MenuItem>
                            ))}
                          </TextField>
                        </FormControl>

                        <FormControl fullWidth>
                          <DateRangeFilter
                            label={t('mailSend.startsAt')}
                            value={{
                              from: startsAtFrom ?? null,
                              to: startsAtTo,
                            }}
                            onChange={({ from, to }) => {
                              setStartsAtFrom(from);
                              setStartsAtTo(to);
                            }}
                          />
                        </FormControl>

                        <FormControl fullWidth>
                          <DateRangeFilter
                            label={t('mailSend.endsAt')}
                            value={{ from: endsAtFrom, to: endsAtTo }}
                            onChange={({ from, to }) => {
                              setEndsAtFrom(from);
                              setEndsAtTo(to);
                            }}
                          />
                          <FormHelperText>
                            {t('mailSend.endsAtHint')}
                          </FormHelperText>
                        </FormControl>

                        <FormControl fullWidth>
                          <FormLabel>{t('mailSend.isPaid')}</FormLabel>
                          <TextField
                            select
                            value={isPaid ?? ''}
                            onChange={event => {
                              const value = event.target.value;
                              setIsPaid(value ?? 'any');
                            }}
                            fullWidth
                          >
                            <MenuItem
                              key={'any'}
                              value={'any'}
                            >
                              {t('mailSend.any')}
                            </MenuItem>

                            <MenuItem
                              key={'true'}
                              value={'true'}
                            >
                              {t('mailSend.yes')}
                            </MenuItem>

                            <MenuItem
                              key={'false'}
                              value={'false'}
                            >
                              {t('mailSend.no')}
                            </MenuItem>
                          </TextField>
                          <FormHelperText>
                            {t('mailSend.isPaidHint')}
                          </FormHelperText>
                        </FormControl>

                        <FormControl fullWidth>
                          <FormLabel>{t('mailSend.isCanceled')}</FormLabel>
                          <TextField
                            select
                            value={isCanceled ?? ''}
                            onChange={event => {
                              const value = event.target.value;
                              setIsCanceled(value ?? 'any');
                            }}
                            fullWidth
                          >
                            <MenuItem
                              key={'any'}
                              value={'any'}
                            >
                              {t('mailSend.any')}
                            </MenuItem>

                            <MenuItem
                              key={'true'}
                              value={'true'}
                            >
                              {t('mailSend.yes')}
                            </MenuItem>

                            <MenuItem
                              key={'false'}
                              value={'false'}
                            >
                              {t('mailSend.no')}
                            </MenuItem>
                          </TextField>
                          <FormHelperText>
                            {t('mailSend.isCanceledHint')}
                          </FormHelperText>
                        </FormControl>

                        <FormControl fullWidth>
                          <FormLabel>
                            {t('mailSend.hasReplacedSubscription')}
                          </FormLabel>
                          <TextField
                            select
                            value={hasReplaced ?? ''}
                            onChange={event => {
                              const value = event.target.value;
                              setHasReplaced(value ?? 'any');
                            }}
                            fullWidth
                          >
                            <MenuItem
                              key={'any'}
                              value={'any'}
                            >
                              {t('mailSend.any')}
                            </MenuItem>

                            <MenuItem
                              key={'true'}
                              value={'true'}
                            >
                              {t('mailSend.yes')}
                            </MenuItem>

                            <MenuItem
                              key={'false'}
                              value={'false'}
                            >
                              {t('mailSend.no')}
                            </MenuItem>
                          </TextField>
                          <FormHelperText>
                            {t('mailSend.hasReplacedSubscriptionHint')}
                          </FormHelperText>
                        </FormControl>
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {recipientSummary({ showMissing: false })}

              <StepNav
                onBack={() => setStep(STEP_CONTENT)}
                onNext={() => setStep(STEP_SEND)}
                nextDisabled={!stepComplete[STEP_AUDIENCE]}
              />
            </>
          )}

          {step === STEP_SEND && (
            <>
              <Card
                variant="outlined"
                style={{ marginTop: 16 }}
              >
                <CardHeader title={t('mailSend.summary.title')} />

                <CardContent>
                  <Stack
                    direction="row"
                    sx={{ alignItems: 'center' }}
                    spacing={1}
                  >
                    <strong>{t('mailSend.template')}:</strong>
                    <span>{templateName ?? '—'}</span>
                  </Stack>
                  {letterAvailable && (
                    <Stack
                      direction="row"
                      sx={{ alignItems: 'center' }}
                      spacing={1}
                      style={{ marginTop: 8 }}
                    >
                      <strong>{t('mailSend.channel.label')}:</strong>
                      <span>
                        {t(`mailSend.channel.${isLetter ? 'letter' : 'mail'}`)}
                      </span>
                    </Stack>
                  )}
                </CardContent>
              </Card>

              {recipientSummary({
                action: (
                  <Button
                    variant="contained"
                    disabled={!canSend}
                    onClick={() => setConfirmOpen(true)}
                  >
                    <MdSend /> {t('mailSend.send')}
                  </Button>
                ),
              })}

              {jobId && <JobProgress jobId={jobId} />}

              <StepNav
                onBack={jobId ? undefined : () => setStep(STEP_AUDIENCE)}
              />
            </>
          )}
        </Box>

        {step === STEP_SEND && (
          <Box sx={{ position: 'sticky', top: 16, marginTop: 3, minWidth: 0 }}>
            {templateId ?
              <TemplatePreview
                templateId={templateId}
                audience={audience}
                recipientCount={count}
                channel={channel}
                print={print}
              />
            : <Card variant="outlined">
                <CardHeader title={t('mailSend.preview.title')} />

                <CardContent>
                  <Alert severity="info">
                    {t('mailSend.selectTemplateHint')}
                  </Alert>
                </CardContent>
              </Card>
            }
          </Box>
        )}
      </Box>
      <RecipientListModal
        open={recipientsOpen}
        onClose={() => setRecipientsOpen(false)}
        audience={audience}
        channel={channel}
        totalCount={count}
      />
      <Dialog
        fullWidth
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
      >
        <DialogTitle>{t('mailSend.confirmTitle')}</DialogTitle>
        <DialogContent>
          {t(isLetter ? 'mailSend.confirmTextLetter' : 'mailSend.confirmText', {
            count,
          })}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            loading={creating}
            onClick={onConfirm}
          >
            {t('mailSend.confirm')}
          </Button>
          <Button
            variant="text"
            onClick={() => setConfirmOpen(false)}
          >
            {t('mailSend.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

/**
 * How many messages the current audience resolves to, plus the warnings about
 * placeholders this audience cannot fill and recipients a letter cannot reach.
 * Shown while choosing the audience and again before sending; only the send step
 * passes an `action`.
 */
function RecipientSummary({
  loading,
  count,
  userCount,
  isLetter,
  withoutAddressCount,
  missing,
  onShowRecipients,
  action,
}: {
  loading: boolean;
  count: number;
  userCount: number;
  isLetter: boolean;
  withoutAddressCount: number;
  missing: string[];
  onShowRecipients: () => void;
  action?: ReactElement;
}) {
  const { t } = useTranslation();

  return (
    <Card
      variant="outlined"
      style={{ marginTop: 16 }}
    >
      <CardContent>
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Stack
            direction="row"
            sx={{ alignItems: 'center' }}
            spacing={1.5}
          >
            <span>
              {loading ?
                t('mailSend.counting')
              : t(
                  isLetter ?
                    'mailSend.lettersCount'
                  : 'mailSend.recipientsCountPerPerson',
                  { count, people: userCount }
                )
              }
            </span>
            <Button
              variant="text"
              size="small"
              disabled={count === 0}
              onClick={onShowRecipients}
            >
              {t('mailSend.showRecipients')}
            </Button>
          </Stack>

          {action}
        </Stack>

        {isLetter && withoutAddressCount > 0 && (
          <Alert
            severity="warning"
            style={{ marginTop: 12 }}
          >
            {t('mailSend.channel.withoutAddress', {
              count: withoutAddressCount,
            })}
          </Alert>
        )}

        <MissingPlaceholdersWarning missing={missing} />
      </CardContent>
    </Card>
  );
}

/** Placeholders the template uses that the chosen audience cannot fill. */
function MissingPlaceholdersWarning({ missing }: { missing: string[] }) {
  const { t } = useTranslation();

  if (!missing.length) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      style={{ marginTop: 12 }}
    >
      {t('mailSend.missingPlaceholders', {
        placeholders: missing.join(', '),
      })}
    </Alert>
  );
}

/** Back/next controls of the wizard. Either side can be left out. */
function StepNav({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <MuiStack
      direction="row"
      spacing={1.5}
      sx={{
        justifyContent: 'flex-end',
        marginTop: 2,
      }}
    >
      {onBack && (
        <MuiButton
          variant="text"
          startIcon={<MdArrowBack />}
          onClick={onBack}
        >
          {t('mailSend.back')}
        </MuiButton>
      )}
      {onNext && (
        <MuiButton
          variant="contained"
          endIcon={<MdArrowForward />}
          disabled={nextDisabled}
          onClick={onNext}
        >
          {t('mailSend.next')}
        </MuiButton>
      )}
    </MuiStack>
  );
}

/**
 * The mail as one recipient of the audience will receive it — rendered by the
 * API through the same composition the send uses, so placeholders show real
 * values. Defaults to the first recipient; any other can be picked.
 */
/**
 * The medium the send goes out through, and — for a letter — how it is printed
 * and posted. Both are the job's, not the template's: the same words can go out
 * as a mail today and as a letter tomorrow.
 */
function ChannelPanel({
  channel,
  onChannelChange,
  print,
  onPrintChange,
}: {
  channel: MailChannel;
  onChannelChange: (channel: MailChannel) => void;
  print: PrintSettings;
  onPrintChange: (print: PrintSettings) => void;
}) {
  const { t } = useTranslation();
  const isLetter = channel === MailChannel.Letter;

  const option = <T extends string>(values: readonly T[], group: string) =>
    values.map(value => ({
      label: t(`mailSend.print.${group}.${value}`),
      value,
    }));

  return (
    <Card
      variant="outlined"
      style={{ marginTop: 16 }}
    >
      <CardHeader title={t('mailSend.channel.label')} />

      <CardContent>
        <RadioGroup
          row
          value={channel}
          onChange={(_event, value) => onChannelChange(value as MailChannel)}
        >
          <FormControlLabel
            value={MailChannel.Mail}
            control={<Radio />}
            label={t('mailSend.channel.mail')}
          />
          <FormControlLabel
            value={MailChannel.Letter}
            control={<Radio />}
            label={t('mailSend.channel.letter')}
          />
        </RadioGroup>

        {isLetter && (
          <>
            <MuiStack
              direction="row"
              spacing={2}
              useFlexGap
              sx={{ marginTop: 2, flexWrap: 'wrap' }}
            >
              <PrintOption
                label={t('mailSend.print.addressPosition.label')}
                value={print.addressPosition}
                options={option(
                  Object.values(LetterAddressPosition),
                  'addressPosition'
                )}
                onChange={addressPosition =>
                  onPrintChange({ ...print, addressPosition })
                }
              />
              <PrintOption
                label={t('mailSend.print.deliveryProduct.label')}
                value={print.deliveryProduct}
                options={option(
                  Object.values(LetterDeliveryProduct),
                  'deliveryProduct'
                )}
                onChange={deliveryProduct =>
                  onPrintChange({ ...print, deliveryProduct })
                }
              />
              <PrintOption
                label={t('mailSend.print.printMode.label')}
                value={print.printMode}
                options={option(Object.values(LetterPrintMode), 'printMode')}
                onChange={printMode => onPrintChange({ ...print, printMode })}
              />
              <PrintOption
                label={t('mailSend.print.printSpectrum.label')}
                value={print.printSpectrum}
                options={option(
                  Object.values(LetterPrintSpectrum),
                  'printSpectrum'
                )}
                onChange={printSpectrum =>
                  onPrintChange({ ...print, printSpectrum })
                }
              />
            </MuiStack>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PrintOption<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
}) {
  return (
    <div style={{ minWidth: 180, flex: 1 }}>
      <FormLabel>{label}</FormLabel>
      <Autocomplete
        options={options}
        getOptionLabel={option => option.label}
        isOptionEqualToValue={(option, selected) =>
          option.value === selected.value
        }
        value={options.find(option => option.value === value) ?? undefined}
        onChange={(_event, option) => {
          const next = option.value;
          next && onChange(next as T);
        }}
        disableClearable
        renderInput={params => <TextField {...params} />}
      />
    </div>
  );
}

function TemplatePreview({
  templateId,
  audience,
  recipientCount,
  channel,
  print,
}: {
  templateId: string;
  audience: MailAudienceInput;
  recipientCount: number;
  channel: MailChannel;
  print: PrintSettings;
}) {
  const { t } = useTranslation();
  const [recipientId, setRecipientId] = useState<string | null>(null);

  // A different audience resolves to different people, so the pinned recipient
  // must not survive it.
  const [shownAudience, setShownAudience] = useState({ audience, channel });

  if (
    audience !== shownAudience.audience ||
    channel !== shownAudience.channel
  ) {
    setShownAudience({ audience, channel });
    setRecipientId(null);
  }

  const { data: recipientData } = useQuery(MailSendRecipientsDocument, {
    variables: { audience, channel, take: RECIPIENTS_PAGE_SIZE },
  });

  const isLetter = channel === MailChannel.Letter;

  const { data, loading, error, refetch } = useQuery(MailSendPreviewDocument, {
    skip: recipientCount === 0,
    variables: {
      input: {
        mailTemplateId: templateId,
        audience,
        recipientId,
        channel,
        print: isLetter ? print : undefined,
      },
    },
  });

  // The mail is composed by the API from the stored template, so an edit made in
  // the other tab only shows up once this query runs again.
  useRefetchOnFocus(refetch, recipientCount > 0);

  const preview = data?.mailSendPreview;
  const options = (recipientData?.mailSendRecipients.nodes ?? []).map(
    recipient => ({
      label: `${recipient.email}${
        recipient.memberPlanName ? ` · ${recipient.memberPlanName}` : ''
      }`,
      value: recipient.id,
    })
  );

  return (
    <Card variant="outlined">
      <CardHeader
        title={
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
            style={{ width: '100%' }}
          >
            <span>{t('mailSend.preview.title')}</span>
            {/* Sits with the mail it changes, not with the template picker. */}
            <Button
              variant="outlined"
              startIcon={<MdEdit />}
              component={Link}
              to={`/mailtemplates/edit/${templateId}`}
              target="_blank"
              size="small"
            >
              {t('mailSend.editTemplate')}
            </Button>
          </Stack>
        }
      />

      <CardContent>
        {recipientCount === 0 ?
          <Alert severity="info">{t('mailSend.preview.noRecipients')}</Alert>
        : <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <FormLabel style={{ margin: 0 }}>
                  {t('mailSend.preview.recipient')}
                </FormLabel>
                <Autocomplete
                  options={options}
                  getOptionLabel={option => option.label}
                  isOptionEqualToValue={(option, selected) =>
                    option.value === selected.value
                  }
                  value={
                    options.find(
                      option =>
                        option.value === (preview?.recipient?.id ?? recipientId)
                    ) ?? undefined
                  }
                  onChange={(_event, option) => {
                    const value = option.value;
                    setRecipientId(value);
                  }}
                  disableClearable
                  renderInput={params => (
                    <TextField
                      {...params}
                      placeholder={t('mailSend.preview.firstRecipient')}
                    />
                  )}
                />
              </div>
              <Typography
                variant="caption"
                style={{ color: 'text.secondary', marginTop: 4 }}
                sx={{
                  display: 'block',
                }}
              >
                {t('mailSend.preview.hint')}
              </Typography>
            </div>

            {error && <Alert severity="error">{humanizeError(error)}</Alert>}

            {/* Both end with the viewport instead of stretching the page — but
              never get so short that the message is unreadable. */}
            {preview?.pdf ?
              <LetterPreview
                pdf={preview.pdf}
                height="max(420px, calc(100vh - 250px))"
              />
            : preview && !isLetter ?
              <MailPreview
                html={preview.html}
                subject={preview.subject}
                height="max(420px, calc(100vh - 250px))"
              />
            : null}

            {loading && !preview && (
              <span>{t('mailSend.preview.loading')}</span>
            )}
          </>
        }
      </CardContent>
    </Card>
  );
}

const RECIPIENTS_PAGE_SIZE = 50;

/**
 * The concrete recipients the current audience resolves to. Paginated, because
 * an audience can be the entire user base.
 */
function RecipientListModal({
  open,
  onClose,
  audience,
  channel,
  totalCount,
}: {
  open: boolean;
  onClose: () => void;
  audience: MailAudienceInput;
  channel: MailChannel;
  totalCount: number;
}) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  // Changing the audience while the modal is closed must not leave the user on
  // a page that no longer exists.
  const [pagedAudience, setPagedAudience] = useState({ audience, channel });

  if (
    audience !== pagedAudience.audience ||
    channel !== pagedAudience.channel
  ) {
    setPagedAudience({ audience, channel });
    setPage(1);
  }

  const { data, loading, error } = useQuery(MailSendRecipientsDocument, {
    skip: !open,
    variables: {
      audience,
      channel,
      skip: (page - 1) * RECIPIENTS_PAGE_SIZE,
      take: RECIPIENTS_PAGE_SIZE,
    },
  });

  const recipients = data?.mailSendRecipients.nodes ?? [];
  // Only a letter needs an address; for a mail the column would be noise.
  const isLetter = channel === MailChannel.Letter;

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={onClose}
      maxWidth="md"
    >
      <DialogTitle>
        {t('mailSend.recipientList.title', { count: totalCount })}
      </DialogTitle>
      <DialogContent style={{ maxHeight: '65vh' }}>
        {loading && !recipients.length ?
          <span>{t('mailSend.recipientList.loading')}</span>
        : <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>{t('mailSend.recipientList.email')}</strong>
                </TableCell>
                <TableCell>
                  <strong>{t('mailSend.recipientList.name')}</strong>
                </TableCell>
                <TableCell>
                  <strong>{t('mailSend.recipientList.memberPlan')}</strong>
                </TableCell>
                {isLetter && (
                  <TableCell align="center">
                    <strong>{t('mailSend.recipientList.address')}</strong>
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {recipients.map(recipient => (
                <TableRow
                  key={recipient.id}
                  sx={
                    isLetter && !recipient.hasAddress ?
                      { backgroundColor: 'rgba(244, 67, 54, 0.08)' }
                    : undefined
                  }
                >
                  <TableCell>{recipient.email}</TableCell>
                  <TableCell>
                    {[recipient.firstName, recipient.name]
                      .filter(Boolean)
                      .join(' ') || '—'}
                  </TableCell>
                  <TableCell>{recipient.memberPlanName ?? '—'}</TableCell>
                  {isLetter && (
                    <TableCell align="center">
                      {recipient.hasAddress ?
                        <MdCheckCircle
                          size={18}
                          color="#4caf50"
                          title={t('mailSend.recipientList.withAddress')}
                        />
                      : <MdCancel
                          size={18}
                          color="#f44336"
                          title={t('mailSend.recipientList.withoutAddress')}
                        />
                      }
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        }
      </DialogContent>
      <DialogActions>
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Pagination
            state={{
              page,
              limit: RECIPIENTS_PAGE_SIZE,
              setPage,
              setLimit: () => undefined /* page size was fixed here */,
            }}
            totalCount={data?.mailSendRecipients.totalCount ?? totalCount}
          />
          <Button
            variant="text"
            onClick={onClose}
          >
            {t('mailSend.cancel')}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

/** Polls a running send job and shows live progress. */
function JobProgress({ jobId }: { jobId: string }) {
  const { t } = useTranslation();
  const { data, startPolling, stopPolling, refetch } = useQuery(
    MailSendJobDocument,
    {
      variables: { id: jobId },
      fetchPolicy: 'network-only',
    }
  );

  const job = data?.mailSendJob;
  const active = job ? isActive(job) : true;

  useEffect(() => {
    if (active) {
      startPolling(2000);
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [active, startPolling, stopPolling]);

  if (!job) {
    return null;
  }

  const remaining = openCount(job);

  return (
    <Card
      variant="outlined"
      style={{ marginTop: 16 }}
    >
      <CardHeader title={t('mailSend.progress.title')} />

      <CardContent>
        <JobProgressBar job={job} />

        <Stack
          direction="row"
          sx={{ flexWrap: 'wrap' }}
          spacing={3}
          style={{ marginTop: 8 }}
        >
          <span>
            {t('mailSend.progress.status')}:{' '}
            {t(`mailSend.status.${job.status}`)}
          </span>
          <span>
            {t('mailSend.progress.sent')}: {job.sentCount} / {job.totalCount}
          </span>
          <span>
            {t('mailSend.progress.failed')}: {job.failedCount}
          </span>
        </Stack>

        {/* An unfinished send is the case that needs an action, so say what is
          left and offer to continue right here. */}
        {remaining > 0 && !active && (
          <Alert
            severity="warning"
            style={{ marginTop: 12 }}
          >
            {t('mailJobs.unfinishedHint', { count: remaining })}
          </Alert>
        )}

        {(job.failedCount > 0 || job.error) && (
          <Alert
            severity="error"
            style={{ marginTop: 12 }}
          >
            <Stack
              sx={{ alignItems: 'flex-start' }}
              spacing={1}
              direction="column"
            >
              {job.error && (
                <>
                  <span>
                    {t('mailSend.progress.reason')}: {job.error}
                  </span>
                  <span>
                    <strong>{t('mailLog.errorHelp.fixTitle')}:</strong>{' '}
                    <span style={{ whiteSpace: 'pre-line' }}>
                      {t(
                        `mailLog.errorHelp.${mailErrorHelpKey(job.error)}.fix`
                      )}
                    </span>
                  </span>
                </>
              )}
              {job.failedCount > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  component={Link}
                  to={`/maillog?job=${job.id}&state=${MailLogState.Rejected}`}
                >
                  {t('mailSend.progress.showFailures', {
                    count: job.failedCount,
                  })}
                </Button>
              )}
            </Stack>
          </Alert>
        )}

        <Stack
          direction="row"
          sx={{ flexWrap: 'wrap' }}
          spacing={1}
          style={{ marginTop: 12 }}
        >
          {canResume(job) && (
            <ResumeJobButton
              job={job}
              onDone={() => refetch()}
            />
          )}
          {isActive(job) && (
            <CancelJobButton
              job={job}
              onDone={() => refetch()}
            />
          )}
          <Button
            variant="outlined"
            size="small"
            component={Link}
            to={`/maillog?tab=jobs&job=${job.id}`}
          >
            {t('mailSend.progress.showJob')}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_SEND_MAIL-TEMPLATES',
])(MailSendPage);
export { CheckedPermissionComponent as MailSendPage };
