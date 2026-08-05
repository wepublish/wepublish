import {
  MailAudienceInput,
  MailLogState,
  MailRecipientBase,
  MailSubscriptionState,
  PaymentPeriodicity,
  useCreateMailSendJobMutation,
  useMailSendJobQuery,
  useMailSendRecipientPreviewQuery,
  useMailSendPreviewQuery,
  useMailSendRecipientsQuery,
  useMailTemplateMissingPlaceholdersQuery,
  useMailTemplateQuery,
  useMemberPlanListQuery,
  usePaymentMethodListQuery,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  ListViewContainer,
  ListViewHeader,
} from '@wepublish/ui/editor';
import {
  Box,
  Button as MuiButton,
  Stack as MuiStack,
  Step,
  StepButton,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAdd,
  MdArrowBack,
  MdArrowForward,
  MdEdit,
  MdSend,
} from 'react-icons/md';
import { Link } from 'react-router-dom';
import {
  Button,
  CheckPicker,
  DateRangePicker,
  Divider,
  Form,
  IconButton,
  Message,
  InputNumber,
  Modal,
  Pagination,
  Panel,
  Radio,
  RadioGroup,
  SelectPicker,
  Stack,
  toaster,
} from 'rsuite';
import { DEFAULT_QUERY_OPTIONS } from '../common';
import { mailErrorHelpKey } from './mail-log-common';
import { MailPreview } from '../mail-template/mail-preview';

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
  const [endedWithinDays, setEndedWithinDays] = useState(
    DEFAULT_ENDED_WITHIN_DAYS
  );
  const [endedMode, setEndedMode] = useState<EndedMode>('days');
  const [endedPeriod, setEndedPeriod] = useState<DateRange | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recipientsOpen, setRecipientsOpen] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [step, setStep] = useState(STEP_AUDIENCE);

  const { data: templateData, refetch: refetchTemplates } =
    useMailTemplateQuery(DEFAULT_QUERY_OPTIONS());
  const { data: memberPlanData } = useMemberPlanListQuery({
    ...DEFAULT_QUERY_OPTIONS(),
    variables: { take: 100 },
  });
  const { data: paymentMethodData } = usePaymentMethodListQuery(
    DEFAULT_QUERY_OPTIONS()
  );

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
  ]);

  const { data: previewData, loading: previewLoading } =
    useMailSendRecipientPreviewQuery({
      ...DEFAULT_QUERY_OPTIONS(),
      variables: { audience },
    });

  const [createJob, { loading: creating }] = useCreateMailSendJobMutation({
    onError: error =>
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
        >
          {error.message}
        </Message>
      ),
    onCompleted: result => {
      setJobId(result.createMailSendJob.id);
      toaster.push(
        <Message
          type="success"
          showIcon
          closable
          duration={3000}
        >
          {t('mailSend.started')}
        </Message>
      );
    },
  });

  const count = previewData?.mailSendRecipientPreview.count ?? 0;
  // One person can match through several subscriptions and would then receive
  // the mail more than once — say so rather than implying `count` people.
  const userCount = previewData?.mailSendRecipientPreview.userCount ?? 0;
  const allowsSubscriptionTemplates =
    previewData?.mailSendRecipientPreview.allowsSubscriptionTemplates ?? false;

  // Warn (never block) when the template uses placeholders that this audience
  // won't fill. `withSubscriptionData` mirrors whether the audience carries a
  // subscription per recipient.
  const { data: missingData, refetch: refetchMissing } =
    useMailTemplateMissingPlaceholdersQuery({
      ...DEFAULT_QUERY_OPTIONS(),
      skip: !templateId,
      variables: {
        templateId: templateId as string,
        withSubscriptionData: allowsSubscriptionTemplates,
      },
    });
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
          <h2>{t('mailSend.title')}</h2>
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
              <Panel
                bordered
                header={t('mailSend.audience.title')}
                style={{ marginTop: 16 }}
              >
                <Form fluid>
                  <Form.Group>
                    <Form.ControlLabel>
                      {t('mailSend.base.label')}
                    </Form.ControlLabel>
                    <RadioGroup
                      value={base}
                      onChange={value => setBase(value as MailRecipientBase)}
                    >
                      {[
                        MailRecipientBase.AllUsers,
                        MailRecipientBase.HasSubscription,
                        MailRecipientBase.NoActiveSubscription,
                        MailRecipientBase.EndedSubscription,
                      ].map(option => (
                        <Radio
                          key={option}
                          value={option}
                        >
                          <div>{t(`mailSend.base.${option}`)}</div>
                          <Typography
                            variant="caption"
                            display="block"
                            style={{
                              color: '#8e8e93',
                              whiteSpace: 'normal',
                              lineHeight: 1.35,
                            }}
                          >
                            {t(`mailSend.base.${option}Hint`)}
                          </Typography>
                        </Radio>
                      ))}
                    </RadioGroup>
                  </Form.Group>

                  {isWinBackBase && (
                    <>
                      <Divider />
                      <Form.Group>
                        <Form.ControlLabel>
                          {t('mailSend.endedWindow.label')}
                        </Form.ControlLabel>
                        <RadioGroup
                          inline
                          value={endedMode}
                          onChange={value => setEndedMode(value as EndedMode)}
                        >
                          <Radio value="days">
                            {t('mailSend.endedWindow.relative')}
                          </Radio>
                          <Radio value="period">
                            {t('mailSend.endedWindow.period')}
                          </Radio>
                        </RadioGroup>

                        {endedMode === 'days' ?
                          <>
                            <InputNumber
                              min={1}
                              max={3650}
                              value={endedWithinDays}
                              onChange={value => {
                                const parsed =
                                  typeof value === 'number' ? value : (
                                    parseInt(`${value}`, 10)
                                  );

                                if (Number.isFinite(parsed) && parsed > 0) {
                                  setEndedWithinDays(parsed);
                                }
                              }}
                              postfix={t('mailSend.endedWindow.days')}
                              style={{ width: 180 }}
                            />
                            <Form.HelpText>
                              {t('mailSend.endedWithinDaysHint')}
                            </Form.HelpText>
                          </>
                        : <>
                            <DateRangePicker
                              value={endedPeriod}
                              onChange={value => setEndedPeriod(value)}
                              format="dd.MM.yyyy"
                              cleanable
                              // Ended subscriptions can only lie in the past.
                              shouldDisableDate={date => date > new Date()}
                              placeholder={t(
                                'mailSend.endedWindow.periodPlaceholder'
                              )}
                              style={{ width: 280 }}
                            />
                            <Form.HelpText>
                              {t('mailSend.endedWindow.periodHint')}
                            </Form.HelpText>
                          </>
                        }
                      </Form.Group>

                      <Form.Group>
                        <Form.ControlLabel>
                          {t('mailSend.memberPlans')}
                        </Form.ControlLabel>
                        <CheckPicker
                          block
                          data={(memberPlanData?.memberPlans.nodes ?? []).map(
                            plan => ({
                              label: plan.name,
                              value: plan.id,
                            })
                          )}
                          value={memberPlanIDs}
                          onChange={value =>
                            setMemberPlanIDs(value as string[])
                          }
                          placeholder={t('mailSend.memberPlansAll')}
                        />
                      </Form.Group>
                    </>
                  )}

                  {isSubscriptionBase && (
                    <>
                      <Divider />
                      <Form.Group>
                        <Form.ControlLabel>
                          {t('mailSend.memberPlans')}
                        </Form.ControlLabel>
                        <CheckPicker
                          block
                          data={(memberPlanData?.memberPlans.nodes ?? []).map(
                            plan => ({
                              label: plan.name,
                              value: plan.id,
                            })
                          )}
                          value={memberPlanIDs}
                          onChange={value =>
                            setMemberPlanIDs(value as string[])
                          }
                          placeholder={t('mailSend.memberPlansAll')}
                        />
                      </Form.Group>

                      <Form.Group>
                        <Form.ControlLabel>
                          {t('mailSend.state.label')}
                        </Form.ControlLabel>
                        <SelectPicker
                          block
                          data={Object.values(MailSubscriptionState).map(
                            value => ({
                              label: t(`mailSend.state.${value}`),
                              value,
                            })
                          )}
                          value={subscriptionState}
                          onChange={setSubscriptionState}
                          placeholder={t('mailSend.state.any')}
                        />
                      </Form.Group>

                      <Form.Group>
                        <Form.ControlLabel>
                          {t('mailSend.autoRenew')}
                        </Form.ControlLabel>
                        <SelectPicker
                          block
                          cleanable={false}
                          searchable={false}
                          data={[
                            { label: t('mailSend.any'), value: 'any' },
                            { label: t('mailSend.yes'), value: 'true' },
                            { label: t('mailSend.no'), value: 'false' },
                          ]}
                          value={autoRenew}
                          onChange={value => setAutoRenew(value ?? 'any')}
                        />
                      </Form.Group>

                      <Form.Group>
                        <Form.ControlLabel>
                          {t('mailSend.paymentMethod')}
                        </Form.ControlLabel>
                        <SelectPicker
                          block
                          data={(paymentMethodData?.paymentMethods ?? []).map(
                            method => ({ label: method.name, value: method.id })
                          )}
                          value={paymentMethodID}
                          onChange={setPaymentMethodID}
                          placeholder={t('mailSend.any')}
                        />
                      </Form.Group>

                      <Form.Group>
                        <Form.ControlLabel>
                          {t('mailSend.periodicity')}
                        </Form.ControlLabel>
                        <SelectPicker
                          block
                          data={Object.values(PaymentPeriodicity).map(
                            value => ({
                              label: value,
                              value,
                            })
                          )}
                          value={periodicity}
                          onChange={setPeriodicity}
                          placeholder={t('mailSend.any')}
                        />
                      </Form.Group>
                    </>
                  )}
                </Form>
              </Panel>

              {recipientSummary()}

              <StepNav
                onNext={() => setStep(STEP_CONTENT)}
                nextDisabled={!stepComplete[STEP_AUDIENCE]}
              />
            </>
          )}

          {step === STEP_CONTENT && (
            <>
              <Panel
                bordered
                header={t('mailSend.template')}
                style={{ marginTop: 16 }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <SelectPicker
                    block
                    data={(templateData?.mailTemplates ?? []).map(template => ({
                      label: template.name,
                      value: template.id,
                    }))}
                    value={templateId}
                    onChange={setTemplateId}
                    placeholder={t('mailSend.selectTemplate')}
                    style={{ flex: 1, minWidth: 0 }}
                  />
                  <IconButton
                    as={Link}
                    to="/mailtemplates/create"
                    target="_blank"
                    appearance="ghost"
                    icon={<MdAdd />}
                  >
                    {t('mailSend.createTemplate')}
                  </IconButton>
                </div>

                {missing.length > 0 && (
                  <Message
                    type="warning"
                    style={{ marginTop: 12 }}
                  >
                    {t('mailSend.missingPlaceholders', {
                      placeholders: missing.join(', '),
                    })}
                  </Message>
                )}
              </Panel>

              <StepNav
                onBack={() => setStep(STEP_AUDIENCE)}
                onNext={() => setStep(STEP_SEND)}
                nextDisabled={!stepComplete[STEP_CONTENT]}
              />
            </>
          )}

          {step === STEP_SEND && (
            <>
              <Panel
                bordered
                header={t('mailSend.summary.title')}
                style={{ marginTop: 16 }}
              >
                <Stack
                  spacing={8}
                  alignItems="center"
                >
                  <strong>{t('mailSend.template')}:</strong>
                  <span>{templateName ?? '—'}</span>
                </Stack>
              </Panel>

              {recipientSummary(
                <Button
                  appearance="primary"
                  disabled={!canSend}
                  onClick={() => setConfirmOpen(true)}
                >
                  <MdSend /> {t('mailSend.send')}
                </Button>
              )}

              {jobId && <JobProgress jobId={jobId} />}

              <StepNav
                onBack={jobId ? undefined : () => setStep(STEP_CONTENT)}
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
          : <Panel
              bordered
              header={t('mailSend.preview.title')}
            >
              <Message type="info">{t('mailSend.selectTemplateHint')}</Message>
            </Panel>
          }
        </Box>
      </Box>

      <RecipientListModal
        open={recipientsOpen}
        onClose={() => setRecipientsOpen(false)}
        audience={audience}
        totalCount={count}
      />

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        size="xs"
      >
        <Modal.Header>
          <Modal.Title>{t('mailSend.confirmTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{t('mailSend.confirmText', { count })}</Modal.Body>
        <Modal.Footer>
          <Button
            appearance="primary"
            loading={creating}
            onClick={onConfirm}
          >
            {t('mailSend.confirm')}
          </Button>
          <Button
            appearance="subtle"
            onClick={() => setConfirmOpen(false)}
          >
            {t('mailSend.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
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
    <Panel
      bordered
      style={{ marginTop: 16 }}
    >
      <Stack
        justifyContent="space-between"
        alignItems="center"
      >
        <Stack
          spacing={12}
          alignItems="center"
        >
          <span>
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
            size="sm"
            appearance="link"
            disabled={count === 0}
            onClick={onShowRecipients}
          >
            {t('mailSend.showRecipients')}
          </Button>
        </Stack>

        {action}
      </Stack>

      {missing.length > 0 && (
        <Message
          type="warning"
          style={{ marginTop: 12 }}
        >
          {t('mailSend.missingPlaceholders', {
            placeholders: missing.join(', '),
          })}
        </Message>
      )}
    </Panel>
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
      justifyContent="flex-end"
      sx={{ marginTop: 2 }}
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

  // A different audience resolves to different people, so the pinned recipient
  // must not survive it.
  useEffect(() => {
    setRecipientId(null);
  }, [audience]);

  const { data: recipientData } = useMailSendRecipientsQuery({
    ...DEFAULT_QUERY_OPTIONS(),
    variables: { audience, take: RECIPIENTS_PAGE_SIZE },
  });

  const { data, loading, error, refetch } = useMailSendPreviewQuery({
    ...DEFAULT_QUERY_OPTIONS(),
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
    <Panel
      bordered
      header={
        <Stack
          justifyContent="space-between"
          alignItems="center"
          style={{ width: '100%' }}
        >
          <span>{t('mailSend.preview.title')}</span>
          {/* Sits with the mail it changes, not with the template picker. */}
          <IconButton
            as={Link}
            to={`/mailtemplates/edit/${templateId}`}
            target="_blank"
            appearance="ghost"
            size="sm"
            icon={<MdEdit />}
          >
            {t('mailSend.editTemplate')}
          </IconButton>
        </Stack>
      }
    >
      {recipientCount === 0 ?
        <Message type="info">{t('mailSend.preview.noRecipients')}</Message>
      : <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Form.ControlLabel style={{ margin: 0 }}>
                {t('mailSend.preview.recipient')}
              </Form.ControlLabel>
              <SelectPicker
                data={options}
                value={preview?.recipient?.id ?? recipientId}
                onChange={value => setRecipientId(value)}
                cleanable={false}
                placeholder={t('mailSend.preview.firstRecipient')}
                style={{ flex: 1, minWidth: 0 }}
              />
            </div>
            <Typography
              variant="caption"
              display="block"
              style={{ color: '#8e8e93', marginTop: 4 }}
            >
              {t('mailSend.preview.hint')}
            </Typography>
          </div>

          {error && <Message type="error">{error.message}</Message>}

          {preview && (
            <MailPreview
              html={preview.html}
              subject={preview.subject}
              // The panel is pinned next to the wizard, so it ends with the
              // viewport instead of stretching the page — but never gets so
              // short that the mail is unreadable.
              height="max(420px, calc(100vh - 250px))"
            />
          )}

          {loading && !preview && <span>{t('mailSend.preview.loading')}</span>}
        </>
      }
    </Panel>
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

  // Changing the audience while the modal is closed must not leave the user on
  // a page that no longer exists.
  useEffect(() => {
    setPage(1);
  }, [audience]);

  const { data, loading } = useMailSendRecipientsQuery({
    ...DEFAULT_QUERY_OPTIONS(),
    skip: !open,
    variables: {
      audience,
      skip: (page - 1) * RECIPIENTS_PAGE_SIZE,
      take: RECIPIENTS_PAGE_SIZE,
    },
  });

  const recipients = data?.mailSendRecipients.nodes ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
    >
      <Modal.Header>
        <Modal.Title>
          {t('mailSend.recipientList.title', { count: totalCount })}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '65vh' }}>
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
      </Modal.Body>
      <Modal.Footer>
        <Stack
          justifyContent="space-between"
          alignItems="center"
        >
          <Pagination
            prev
            next
            maxButtons={5}
            size="sm"
            total={data?.mailSendRecipients.totalCount ?? totalCount}
            limit={RECIPIENTS_PAGE_SIZE}
            activePage={page}
            onChangePage={setPage}
          />
          <Button
            appearance="subtle"
            onClick={onClose}
          >
            {t('mailSend.cancel')}
          </Button>
        </Stack>
      </Modal.Footer>
    </Modal>
  );
}

/** Polls a running send job and shows live progress. */
function JobProgress({ jobId }: { jobId: string }) {
  const { t } = useTranslation();
  const { data, startPolling, stopPolling } = useMailSendJobQuery({
    variables: { id: jobId },
    fetchPolicy: 'network-only',
  });

  const job = data?.mailSendJob;
  const finished = job?.status === 'done' || job?.status === 'failed';

  useEffect(() => {
    startPolling(2000);
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  useEffect(() => {
    if (finished) {
      stopPolling();
    }
  }, [finished, stopPolling]);

  if (!job) {
    return null;
  }

  return (
    <Panel
      bordered
      header={t('mailSend.progress.title')}
      style={{ marginTop: 16 }}
    >
      <Stack
        spacing={24}
        wrap
      >
        <span>
          {t('mailSend.progress.status')}: {t(`mailSend.status.${job.status}`)}
        </span>
        <span>
          {t('mailSend.progress.sent')}: {job.sentCount} / {job.totalCount}
        </span>
        <span>
          {t('mailSend.progress.failed')}: {job.failedCount}
        </span>
      </Stack>

      {(job.failedCount > 0 || job.error) && (
        <Message
          type="error"
          showIcon
          style={{ marginTop: 12 }}
        >
          <Stack
            spacing={8}
            direction="column"
            alignItems="flex-start"
          >
            {job.error && (
              <>
                <span>
                  {t('mailSend.progress.reason')}: {job.error}
                </span>
                <span>
                  <strong>{t('mailLog.errorHelp.fixTitle')}:</strong>{' '}
                  <span style={{ whiteSpace: 'pre-line' }}>
                    {t(`mailLog.errorHelp.${mailErrorHelpKey(job.error)}.fix`)}
                  </span>
                </span>
              </>
            )}
            {job.failedCount > 0 && (
              <Button
                size="sm"
                appearance="ghost"
                color="red"
                as={Link}
                to={`/maillog?job=${job.id}&state=${MailLogState.Rejected}`}
              >
                {t('mailSend.progress.showFailures', {
                  count: job.failedCount,
                })}
              </Button>
            )}
          </Stack>
        </Message>
      )}
    </Panel>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_SEND_MAIL-TEMPLATES',
])(MailSendPage);
export { CheckedPermissionComponent as MailSendPage };
