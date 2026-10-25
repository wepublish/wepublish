import { useMutation, useQuery } from '@apollo/client/react';
import {
  CreateMailSendJobDocument,
  MailAudienceInput,
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
  ListViewContainer,
  ListViewHeader,
  Pagination,
  PageTitle,
} from '@wepublish/ui/editor';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
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
  Step,
  StepButton,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Theme,
  Typography,
  useMediaQuery,
} from '@mui/material';
import {
  ReactElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAdd,
  MdArrowBack,
  MdArrowForward,
  MdEdit,
  MdSend,
} from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';
import { mailErrorHelpKey } from './mail-log-common';
import { FieldLabel } from '../field-label';
import {
  CancelJobButton,
  canResume,
  isActive,
  JobProgressBar,
  openCount,
  ResumeJobButton,
} from './mail-job-common';
import { MailPreview } from '../mail-template/mail-preview';
import { CanSendMailTemplates } from '@wepublish/permissions';

/** Mirrors the API default for the win-back look-back window. */
const DEFAULT_ENDED_WITHIN_DAYS = 90;

/** How the author expresses "recently ended": rolling days or a fixed period. */
type EndedMode = 'days' | 'period';
type DateRange = [Date, Date];

/** The three stages the author walks through: audience, content, send. */
const STEP_AUDIENCE = 0;
const STEP_CONTENT = 1;
const STEP_SEND = 2;
const STEP_KEYS = ['audience', 'content', 'send'] as const;

/**
 * Width of the wizard column. Fixed rather than fluid so the steps keep their
 * layout whether or not a template is selected — the preview beside it absorbs
 * every bit of remaining screen instead.
 */
const WIZARD_WIDTH = 820;

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

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recipientsOpen, setRecipientsOpen] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [step, setStep] = useState(STEP_AUDIENCE);
  const fieldId = useId();
  const templateTitleId = `${fieldId}-template-title`;
  const stepTitleRef = useRef<HTMLHeadingElement>(null);
  const focusStepTitle = useRef(false);
  const stepperVertical = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('sm')
  );

  const goToStep = (target: number) => {
    focusStepTitle.current = true;
    setStep(target);
  };

  useEffect(() => {
    if (focusStepTitle.current) {
      focusStepTitle.current = false;
      stepTitleRef.current?.focus();
    }
  }, [step]);

  const stepTitleProps = {
    title: {
      component: 'h2',
      tabIndex: -1,
      ref: stepTitleRef,
      sx: { outline: 'none' },
    },
  } as const;

  const { data: templateData, refetch: refetchTemplates } =
    useQuery(MailTemplateDocument);
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
      return { base };
    }

    return {
      base,
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
      variables: { audience },
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

  const count = previewData?.mailSendRecipientPreview.count ?? 0;
  // One person can match through several subscriptions and would then receive
  // the mail more than once — say so rather than implying `count` people.
  const userCount = previewData?.mailSendRecipientPreview.userCount ?? 0;
  const allowsSubscriptionTemplates =
    previewData?.mailSendRecipientPreview.allowsSubscriptionTemplates ?? false;

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

  // What each step has to produce before the next one makes sense: an audience
  // with recipients, then a template to preview.
  const stepComplete = [count > 0 && !previewLoading, !!templateId];

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
      variables: { input: { mailTemplateId: templateId, audience } },
    });
  };

  const recipientSummary = (action?: ReactElement) => (
    <RecipientSummary
      loading={previewLoading}
      count={count}
      userCount={userCount}
      missing={missing}
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
      {/* The preview lives beside the wizard rather than inside a step: once a
          template is chosen it stays visible, so every later change — audience,
          preview recipient, an edit in the template tab — is seen immediately.
          The wizard column is a fixed width and the preview takes whatever is
          left, so selecting a template never re-flows the wizard. */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          alignItems: 'start',
          gridTemplateColumns: {
            xs: '1fr',
            lg: `${WIZARD_WIDTH}px minmax(0, 1fr)`,
          },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stepper
            activeStep={step}
            nonLinear
            orientation={stepperVertical ? 'vertical' : 'horizontal'}
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

          {step === STEP_AUDIENCE && (
            <>
              <Card
                variant="outlined"
                style={{ marginTop: 16 }}
              >
                <CardHeader
                  title={t('mailSend.audience.title')}
                  slotProps={stepTitleProps}
                />

                <CardContent>
                  <Stack
                    spacing={3}
                    sx={{ width: '100%' }}
                  >
                    <FormControl fullWidth>
                      <FieldLabel
                        id={`${fieldId}-f1`}
                        label={t('mailSend.base.label')}
                      />
                      <RadioGroup
                        aria-labelledby={`${fieldId}-f1`}
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
                    </FormControl>

                    {isWinBackBase && (
                      <>
                        <Divider />
                        <FormControl fullWidth>
                          <FieldLabel
                            id={`${fieldId}-f2`}
                            label={t('mailSend.endedWindow.label')}
                          />
                          <RadioGroup
                            aria-labelledby={`${fieldId}-f2`}
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
                                  htmlInput: {
                                    min: 1,
                                    max: 3650,
                                    'aria-label': t(
                                      'mailSend.endedWindow.relative'
                                    ),
                                  },
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
                          <FieldLabel
                            id={`${fieldId}-f3`}
                            label={t('mailSend.memberPlans')}
                          />
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
                                slotProps={{
                                  ...params.slotProps,
                                  htmlInput: {
                                    ...params.slotProps.htmlInput,
                                    'aria-labelledby': `${fieldId}-f3`,
                                  },
                                }}
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
                          <FieldLabel
                            id={`${fieldId}-f4`}
                            label={t('mailSend.memberPlans')}
                          />
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
                                slotProps={{
                                  ...params.slotProps,
                                  htmlInput: {
                                    ...params.slotProps.htmlInput,
                                    'aria-labelledby': `${fieldId}-f4`,
                                  },
                                }}
                              />
                            )}
                          />
                        </FormControl>

                        <FormControl fullWidth>
                          <FieldLabel
                            id={`${fieldId}-f5`}
                            label={t('mailSend.state.label')}
                            help={t('mailSend.stateHelp')}
                          />
                          <TextField
                            select
                            value={subscriptionState ?? ''}
                            onChange={event =>
                              setSubscriptionState(
                                event.target.value as MailSubscriptionState
                              )
                            }
                            fullWidth
                            slotProps={{
                              select: {
                                displayEmpty: true,
                                labelId: `${fieldId}-f5`,
                              },
                            }}
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
                          <FieldLabel
                            id={`${fieldId}-f6`}
                            label={t('mailSend.autoRenew')}
                            help={t('mailSend.autoRenewHelp')}
                          />
                          <TextField
                            select
                            value={autoRenew ?? ''}
                            onChange={event => {
                              const value = event.target.value;
                              setAutoRenew(value ?? 'any');
                            }}
                            fullWidth
                            slotProps={{ select: { labelId: `${fieldId}-f6` } }}
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
                          <FieldLabel
                            id={`${fieldId}-f7`}
                            label={t('mailSend.paymentMethod')}
                          />
                          <TextField
                            select
                            value={paymentMethodID ?? ''}
                            onChange={event =>
                              setPaymentMethodID(event.target.value)
                            }
                            fullWidth
                            slotProps={{
                              select: {
                                displayEmpty: true,
                                labelId: `${fieldId}-f7`,
                              },
                            }}
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
                          <FieldLabel
                            id={`${fieldId}-f8`}
                            label={t('mailSend.periodicity')}
                          />
                          <TextField
                            select
                            value={periodicity ?? ''}
                            onChange={event =>
                              setPeriodicity(
                                event.target.value as PaymentPeriodicity
                              )
                            }
                            fullWidth
                            slotProps={{
                              select: {
                                displayEmpty: true,
                                labelId: `${fieldId}-f8`,
                              },
                            }}
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
                          <FieldLabel
                            id={`${fieldId}-f9`}
                            label={t('mailSend.isPaid')}
                          />
                          <TextField
                            select
                            value={isPaid ?? ''}
                            onChange={event => {
                              const value = event.target.value;
                              setIsPaid(value ?? 'any');
                            }}
                            fullWidth
                            slotProps={{ select: { labelId: `${fieldId}-f9` } }}
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
                          <FieldLabel
                            id={`${fieldId}-f10`}
                            label={t('mailSend.isCanceled')}
                          />
                          <TextField
                            select
                            value={isCanceled ?? ''}
                            onChange={event => {
                              const value = event.target.value;
                              setIsCanceled(value ?? 'any');
                            }}
                            fullWidth
                            slotProps={{
                              select: { labelId: `${fieldId}-f10` },
                            }}
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
                          <FieldLabel
                            id={`${fieldId}-f11`}
                            label={t('mailSend.hasReplacedSubscription')}
                          />
                          <TextField
                            select
                            value={hasReplaced ?? ''}
                            onChange={event => {
                              const value = event.target.value;
                              setHasReplaced(value ?? 'any');
                            }}
                            fullWidth
                            slotProps={{
                              select: { labelId: `${fieldId}-f11` },
                            }}
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

              {recipientSummary()}

              <StepNav
                onNext={() => goToStep(STEP_CONTENT)}
                nextDisabled={!stepComplete[STEP_AUDIENCE]}
              />
            </>
          )}

          {step === STEP_CONTENT && (
            <>
              <Card
                variant="outlined"
                style={{ marginTop: 16 }}
              >
                <CardHeader
                  title={t('mailSend.template')}
                  slotProps={{
                    title: { ...stepTitleProps.title, id: templateTitleId },
                  }}
                />

                <CardContent>
                  <div
                    style={{ display: 'flex', gap: 12, alignItems: 'center' }}
                  >
                    <TextField
                      select
                      value={templateId ?? ''}
                      onChange={event => setTemplateId(event.target.value)}
                      fullWidth
                      slotProps={{
                        select: {
                          displayEmpty: true,
                          labelId: templateTitleId,
                        },
                      }}
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
                      component={RouterLink}
                      to="/mailtemplates/create"
                      target="_blank"
                    >
                      {t('mailSend.createTemplate')}
                    </Button>
                  </div>

                  {missing.length > 0 && (
                    <Alert
                      severity="warning"
                      style={{ marginTop: 12 }}
                    >
                      {t('mailSend.missingPlaceholders', {
                        placeholders: missing.join(', '),
                      })}
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <StepNav
                onBack={() => goToStep(STEP_AUDIENCE)}
                onNext={() => goToStep(STEP_SEND)}
                nextDisabled={!stepComplete[STEP_CONTENT]}
              />
            </>
          )}

          {step === STEP_SEND && (
            <>
              <Card
                variant="outlined"
                style={{ marginTop: 16 }}
              >
                <CardHeader
                  title={t('mailSend.summary.title')}
                  slotProps={stepTitleProps}
                />

                <CardContent>
                  <Stack
                    direction="row"
                    sx={{ alignItems: 'center' }}
                    spacing={1}
                  >
                    <strong>{t('mailSend.template')}:</strong>
                    <span>{templateName ?? '—'}</span>
                  </Stack>
                </CardContent>
              </Card>

              {recipientSummary(
                <Button
                  variant="contained"
                  disabled={!canSend}
                  onClick={() => setConfirmOpen(true)}
                >
                  <MdSend /> {t('mailSend.send')}
                </Button>
              )}

              {jobId && <JobProgress jobId={jobId} />}

              <StepNav
                onBack={jobId ? undefined : () => goToStep(STEP_CONTENT)}
              />
            </>
          )}
        </Box>

        {/* Always occupied — an empty column would leave half the screen blank
            and read as a broken layout. */}
        <Box sx={{ position: 'sticky', top: 16, marginTop: 3, minWidth: 0 }}>
          {templateId ?
            <TemplatePreview
              templateId={templateId}
              audience={audience}
              recipientCount={count}
            />
          : <Card>
              <CardHeader
                title={t('mailSend.preview.title')}
                slotProps={{ title: { component: 'h2' } }}
              />

              <CardContent>
                <Alert
                  severity="info"
                  role="status"
                >
                  {t('mailSend.selectTemplateHint')}
                </Alert>
              </CardContent>
            </Card>
          }
        </Box>
      </Box>
      <RecipientListModal
        open={recipientsOpen}
        onClose={() => setRecipientsOpen(false)}
        audience={audience}
        totalCount={count}
      />
      <Dialog
        fullWidth
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
      >
        <DialogTitle>{t('mailSend.confirmTitle')}</DialogTitle>
        <DialogContent>{t('mailSend.confirmText', { count })}</DialogContent>
        <DialogActions>
          <Button
            variant="text"
            onClick={() => setConfirmOpen(false)}
          >
            {t('mailSend.cancel')}
          </Button>

          <Button
            variant="contained"
            loading={creating}
            onClick={onConfirm}
          >
            {t('mailSend.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

/**
 * How many recipients the current audience resolves to, plus the warning about
 * placeholders this audience cannot fill. Shown while choosing the audience and
 * again before sending; only the send step passes an `action`.
 */
function RecipientSummary({
  loading,
  count,
  userCount,
  missing,
  onShowRecipients,
  action,
}: {
  loading: boolean;
  count: number;
  userCount: number;
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
            <span role="status">
              {loading ?
                t('mailSend.counting')
              : count === userCount ?
                t('mailSend.recipientsCount', { count })
              : t('mailSend.recipientsCountPerPerson', {
                  count,
                  people: userCount,
                })
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

        {missing.length > 0 && (
          <Alert
            severity="warning"
            style={{ marginTop: 12 }}
          >
            {t('mailSend.missingPlaceholders', {
              placeholders: missing.join(', '),
            })}
          </Alert>
        )}
      </CardContent>
    </Card>
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
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        justifyContent: 'flex-end',
        marginTop: 2,
      }}
    >
      {onBack && (
        <Button
          variant="text"
          startIcon={<MdArrowBack />}
          onClick={onBack}
        >
          {t('mailSend.back')}
        </Button>
      )}
      {onNext && (
        <Button
          variant="contained"
          endIcon={<MdArrowForward />}
          disabled={nextDisabled}
          onClick={onNext}
        >
          {t('mailSend.next')}
        </Button>
      )}
    </Stack>
  );
}

/**
 * The mail as one recipient of the audience will receive it — rendered by the
 * API through the same composition the send uses, so placeholders show real
 * values. Defaults to the first recipient; any other can be picked.
 */
function TemplatePreview({
  templateId,
  audience,
  recipientCount,
}: {
  templateId: string;
  audience: MailAudienceInput;
  recipientCount: number;
}) {
  const { t } = useTranslation();
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const recipientLabelId = useId();

  const [shownAudience, setShownAudience] = useState(audience);

  if (audience !== shownAudience) {
    setShownAudience(audience);
    setRecipientId(null);
  }

  const { data: recipientData } = useQuery(MailSendRecipientsDocument, {
    variables: { audience, take: RECIPIENTS_PAGE_SIZE },
  });

  const { data, loading, error, refetch } = useQuery(MailSendPreviewDocument, {
    skip: recipientCount === 0,
    variables: {
      input: { mailTemplateId: templateId, audience, recipientId },
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
    <Card>
      <CardHeader
        title={
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
            style={{ width: '100%' }}
          >
            <span>{t('mailSend.preview.title')}</span>
            <Button
              variant="outlined"
              startIcon={<MdEdit />}
              component={RouterLink}
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
          <Alert
            severity="info"
            role="status"
          >
            {t('mailSend.preview.noRecipients')}
          </Alert>
        : <>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <FormLabel
                  id={recipientLabelId}
                  style={{ margin: 0 }}
                >
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
                      slotProps={{
                        ...params.slotProps,
                        htmlInput: {
                          ...params.slotProps.htmlInput,
                          'aria-labelledby': recipientLabelId,
                        },
                      }}
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

            {preview && (
              <MailPreview
                html={preview.html}
                subject={preview.subject}
                height="max(420px, calc(100vh - 250px))"
              />
            )}

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
  totalCount,
}: {
  open: boolean;
  onClose: () => void;
  audience: MailAudienceInput;
  totalCount: number;
}) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const [pagedAudience, setPagedAudience] = useState(audience);

  if (audience !== pagedAudience) {
    setPagedAudience(audience);
    setPage(1);
  }

  const { data, loading, error } = useQuery(MailSendRecipientsDocument, {
    skip: !open,
    variables: {
      audience,
      skip: (page - 1) * RECIPIENTS_PAGE_SIZE,
      take: RECIPIENTS_PAGE_SIZE,
    },
  });

  const recipients = data?.mailSendRecipients.nodes ?? [];

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
              </TableRow>
            </TableHead>
            <TableBody>
              {recipients.map(recipient => (
                <TableRow key={recipient.id}>
                  <TableCell>{recipient.email}</TableCell>
                  <TableCell>
                    {[recipient.firstName, recipient.name]
                      .filter(Boolean)
                      .join(' ') || '—'}
                  </TableCell>
                  <TableCell>{recipient.memberPlanName ?? '—'}</TableCell>
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
                  component={RouterLink}
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
            component={RouterLink}
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
  CanSendMailTemplates.id,
])(MailSendPage);
export { CheckedPermissionComponent as MailSendPage };
