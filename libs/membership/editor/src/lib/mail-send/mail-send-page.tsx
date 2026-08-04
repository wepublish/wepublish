import {
  MailAudienceInput,
  MailLogState,
  MailRecipientBase,
  MailSubscriptionState,
  PaymentPeriodicity,
  useCreateMailSendJobMutation,
  useMailSendJobQuery,
  useMailSendRecipientPreviewQuery,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdSend } from 'react-icons/md';
import { Link } from 'react-router-dom';
import {
  Button,
  CheckPicker,
  Divider,
  Form,
  IconButton,
  Message,
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

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recipientsOpen, setRecipientsOpen] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const { data: templateData } = useMailTemplateQuery(DEFAULT_QUERY_OPTIONS());
  const { data: memberPlanData } = useMemberPlanListQuery({
    ...DEFAULT_QUERY_OPTIONS(),
    variables: { take: 100 },
  });
  const { data: paymentMethodData } = usePaymentMethodListQuery(
    DEFAULT_QUERY_OPTIONS()
  );

  const isSubscriptionBase = base === MailRecipientBase.HasSubscription;

  const audience = useMemo<MailAudienceInput>(() => {
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
  const allowsSubscriptionTemplates =
    previewData?.mailSendRecipientPreview.allowsSubscriptionTemplates ?? false;

  // Warn (never block) when the template uses placeholders that this audience
  // won't fill. `withSubscriptionData` mirrors whether the audience carries a
  // subscription per recipient.
  const { data: missingData } = useMailTemplateMissingPlaceholdersQuery({
    ...DEFAULT_QUERY_OPTIONS(),
    skip: !templateId,
    variables: {
      templateId: templateId as string,
      withSubscriptionData: allowsSubscriptionTemplates,
    },
  });
  const missing = missingData?.mailTemplateMissingPlaceholders ?? [];

  // A job is created per click, so the button stays disabled afterwards —
  // re-sending is a deliberate act (reload the page), never a double click.
  const canSend = !!templateId && count > 0 && !creating && !jobId;

  const onConfirm = async () => {
    if (!templateId) {
      return;
    }
    setConfirmOpen(false);
    await createJob({
      variables: { input: { mailTemplateId: templateId, audience } },
    });
  };

  return (
    <div style={{ flexShrink: 0, maxWidth: 1000 }}>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('mailSend.title')}</h2>
        </ListViewHeader>
      </ListViewContainer>

      <Message
        type="info"
        style={{ marginTop: 16 }}
      >
        {t('mailSend.description')}
      </Message>

      <Panel
        bordered
        header={t('mailSend.audience.title')}
        style={{ marginTop: 16 }}
      >
        <Form fluid>
          <Form.Group>
            <Form.ControlLabel>{t('mailSend.base.label')}</Form.ControlLabel>
            <RadioGroup
              value={base}
              onChange={value => setBase(value as MailRecipientBase)}
            >
              <Radio value={MailRecipientBase.AllUsers}>
                {t('mailSend.base.allUsers')}
              </Radio>
              <Radio value={MailRecipientBase.HasSubscription}>
                {t('mailSend.base.hasSubscription')}
              </Radio>
              <Radio value={MailRecipientBase.NoActiveSubscription}>
                {t('mailSend.base.noActiveSubscription')}
              </Radio>
            </RadioGroup>
          </Form.Group>

          {isSubscriptionBase && (
            <>
              <Divider />
              <Form.Group>
                <Form.ControlLabel>
                  {t('mailSend.memberPlans')}
                </Form.ControlLabel>
                <CheckPicker
                  block
                  data={(memberPlanData?.memberPlans.nodes ?? []).map(plan => ({
                    label: plan.name,
                    value: plan.id,
                  }))}
                  value={memberPlanIDs}
                  onChange={value => setMemberPlanIDs(value as string[])}
                  placeholder={t('mailSend.memberPlansAll')}
                />
              </Form.Group>

              <Form.Group>
                <Form.ControlLabel>
                  {t('mailSend.state.label')}
                </Form.ControlLabel>
                <SelectPicker
                  block
                  data={Object.values(MailSubscriptionState).map(value => ({
                    label: t(`mailSend.state.${value}`),
                    value,
                  }))}
                  value={subscriptionState}
                  onChange={setSubscriptionState}
                  placeholder={t('mailSend.state.any')}
                />
              </Form.Group>

              <Form.Group>
                <Form.ControlLabel>{t('mailSend.autoRenew')}</Form.ControlLabel>
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
                  data={Object.values(PaymentPeriodicity).map(value => ({
                    label: value,
                    value,
                  }))}
                  value={periodicity}
                  onChange={setPeriodicity}
                  placeholder={t('mailSend.any')}
                />
              </Form.Group>
            </>
          )}
        </Form>
      </Panel>

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
      </Panel>

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
              {previewLoading ?
                t('mailSend.counting')
              : t('mailSend.recipientsCount', { count })}
            </span>
            <Button
              size="sm"
              appearance="link"
              disabled={count === 0}
              onClick={() => setRecipientsOpen(true)}
            >
              {t('mailSend.showRecipients')}
            </Button>
          </Stack>

          <Button
            appearance="primary"
            disabled={!canSend}
            onClick={() => setConfirmOpen(true)}
          >
            <MdSend /> {t('mailSend.send')}
          </Button>
        </Stack>

        {templateId && missing.length > 0 && (
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

      {jobId && <JobProgress jobId={jobId} />}

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
