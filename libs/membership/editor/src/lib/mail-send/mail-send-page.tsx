import { useMutation, useQuery } from '@apollo/client/react';
import {
  CreateMailSendJobDocument,
  LetterAddressPosition,
  LetterDeliveryProduct,
  LetterPrintMode,
  LetterPrintSpectrum,
  MailAudienceInput,
  MailChannel,
  MailLogState,
  MailSendJobDocument,
  MailSendPreviewDocument,
  MailSendRecipientPreviewDocument,
  MailSendRecipientsDocument,
  MailTemplateDocument,
  MailTemplateMissingPlaceholdersDocument,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  ListViewContainer,
  ListViewHeader,
  PageTitle,
  useAuthorisation,
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
  FormControlLabel,
  FormLabel,
  Link as MuiLink,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  Stack as MuiStack,
  TextField,
  Typography,
} from '@mui/material';
import { ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdEdit, MdSend } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { useLetterChannel } from '../mail-template/use-letter-channel';
import { canGoToStep, StepNav, WizardStepper } from './step-nav';
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
import { usePaperLetterFlow } from '../delivery-mode/use-paper-letter-flow';
import { AudienceFilter } from './audience/audience-filter';
import { useAudienceState } from './audience/audience-state';
import {
  RECIPIENTS_PAGE_SIZE,
  RecipientListModal,
} from './audience/recipient-list-modal';
import {
  MissingPlaceholdersWarning,
  RecipientSummary,
} from './audience/recipient-summary';

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

function MailSendPage() {
  const { t } = useTranslation();

  const [templateId, setTemplateId] = useState<string | null>(null);
  const {
    state: audienceState,
    update: updateAudience,
    audience,
  } = useAudienceState();
  const emailSegments = audienceState.emailSegments;

  // The lasting switch of this audience lives in the delivery channel area;
  // the send page only points there, for those who may switch at all.
  const paperLetterFlow = usePaperLetterFlow();
  const canManageDelivery = useAuthorisation('CAN_MANAGE_USER-DELIVERY-MODE');
  const canHandOverToDelivery = paperLetterFlow && !!canManageDelivery;

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
  const { letterAvailable } = useLetterChannel();

  const {
    data: previewData,
    loading: previewLoading,
    refetch: refetchPreview,
  } = useQuery(MailSendRecipientPreviewDocument, {
    variables: { audience, channel },
  });

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
  const segmentCounts = previewData?.mailSendRecipientPreview.segments ?? [];

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
  const canGoTo = (target: number) =>
    canGoToStep(target, { step, complete: stepComplete, locked: !!jobId });

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
      channel={channel}
      withoutAddressCount={withoutAddressCount}
      segmentCounts={segmentCounts}
      selectedSegments={emailSegments}
      onPickSegment={segment =>
        updateAudience({
          emailSegments:
            emailSegments.includes(segment) ?
              emailSegments.filter(item => item !== segment)
            : [...emailSegments, segment],
        })
      }
      onRefreshed={() => refetchPreview()}
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
          <WizardStepper
            steps={STEP_KEYS.map(key => ({
              title: t(`mailSend.steps.${key}.title`),
              description: t(`mailSend.steps.${key}.description`),
            }))}
            step={step}
            canGoTo={canGoTo}
            onStep={setStep}
          />

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
                  <AudienceFilter
                    state={audienceState}
                    onChange={updateAudience}
                  >
                    {/* What the picked base means for the template's
                        placeholders is the send page's business, not the
                        filter's: the same filter also switches channels. */}
                    <Typography
                      variant="caption"
                      sx={{ display: 'block', color: 'text.secondary' }}
                    >
                      {t(`mailSend.base.placeholderNote.${audienceState.base}`)}
                    </Typography>
                    <MissingPlaceholdersWarning missing={missing} />
                  </AudienceFilter>
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
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{ alignItems: 'center' }}
                  >
                    {canHandOverToDelivery && (
                      <MuiLink
                        component={Link}
                        to="/deliverychannel/assign"
                        state={{ audience: audienceState }}
                        variant="body2"
                      >
                        {t('mailSend.deliveryChannelHandOff')}
                      </MuiLink>
                    )}
                    <Button
                      variant="contained"
                      disabled={!canSend}
                      onClick={() => setConfirmOpen(true)}
                    >
                      <MdSend /> {t('mailSend.send')}
                    </Button>
                  </Stack>
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

/**
 * The concrete recipients the current audience resolves to. Paginated, because
 * an audience can be the entire user base.
 */
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
