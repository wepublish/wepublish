import {
  MailAudienceInput,
  MailRecipientBase,
  MailSendJobState,
  MailSubscriptionState,
  PaymentPeriodicity,
  useCreateMailSendJobMutation,
  useMailSendJobQuery,
  useMailSendRecipientPreviewQuery,
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
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdSend } from 'react-icons/md';
import {
  Button,
  CheckPicker,
  Divider,
  Form,
  Message,
  Modal,
  Panel,
  Radio,
  RadioGroup,
  SelectPicker,
  Stack,
  toaster,
} from 'rsuite';
import { DEFAULT_QUERY_OPTIONS } from '../common';

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

  const canSend = !!templateId && count > 0 && !creating;

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
        header={t('mailSend.template')}
        style={{ marginTop: 16 }}
      >
        <SelectPicker
          block
          data={(templateData?.mailTemplates ?? []).map(template => ({
            label: template.name,
            value: template.id,
          }))}
          value={templateId}
          onChange={setTemplateId}
          placeholder={t('mailSend.selectTemplate')}
        />
      </Panel>

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
        style={{ marginTop: 16 }}
      >
        <Stack
          justifyContent="space-between"
          alignItems="center"
        >
          <span>
            {previewLoading ?
              t('mailSend.counting')
            : t('mailSend.recipientsCount', { count })}
          </span>

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
      {job.error && (
        <Message
          type="error"
          style={{ marginTop: 12 }}
        >
          {job.error}
        </Message>
      )}
    </Panel>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_SEND_MAIL-TEMPLATES',
])(MailSendPage);
export { CheckedPermissionComponent as MailSendPage };
