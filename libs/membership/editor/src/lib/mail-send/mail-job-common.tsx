import { Typography } from '@mui/material';
import {
  FullMailSendJobFragment,
  MailSendJobState,
  useCancelMailSendJobMutation,
  useResumeMailSendJobMutation,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdPlayArrow, MdStop } from 'react-icons/md';
import {
  Button,
  Checkbox,
  Message,
  Modal,
  Progress,
  Tag,
  toaster,
} from 'rsuite';

const STATE_COLORS: Record<
  MailSendJobState,
  'green' | 'yellow' | 'red' | 'blue'
> = {
  [MailSendJobState.Queued]: 'yellow',
  [MailSendJobState.Running]: 'blue',
  [MailSendJobState.Done]: 'green',
  [MailSendJobState.Failed]: 'red',
  [MailSendJobState.Cancelled]: 'red',
};

export function MailSendJobStateTag({ status }: { status: MailSendJobState }) {
  const { t } = useTranslation();

  return (
    <Tag color={STATE_COLORS[status] ?? 'blue'}>
      {t(`mailSend.status.${status}`)}
    </Tag>
  );
}

/** Mails of a job that were never delivered and can still be sent. */
export const openCount = (job: FullMailSendJobFragment): number =>
  Math.max(
    job.totalCount - job.sentCount - job.failedCount - job.sendingCount,
    0
  );

/** Mails whose fate is unknown or which failed — only re-sent on request. */
export const unfinishedCount = (job: FullMailSendJobFragment): number =>
  job.failedCount + job.sendingCount;

export const isActive = (job: FullMailSendJobFragment): boolean =>
  job.status === MailSendJobState.Running ||
  job.status === MailSendJobState.Queued;

/**
 * A job can be continued as long as it is not running and something is left to
 * do — either mails never attempted, or ones the editor may want to retry.
 */
export const canResume = (job: FullMailSendJobFragment): boolean =>
  !isActive(job) && openCount(job) + unfinishedCount(job) > 0;

export function JobProgressBar({ job }: { job: FullMailSendJobFragment }) {
  const done = job.sentCount + job.failedCount;
  const percent =
    job.totalCount ? Math.round((done / job.totalCount) * 100) : 0;

  return (
    <Progress.Line
      percent={percent}
      strokeColor={job.failedCount ? '#f5a623' : undefined}
      status={
        job.status === MailSendJobState.Running ? 'active'
        : job.status === MailSendJobState.Done ?
          'success'
        : job.status === MailSendJobState.Failed ?
          'fail'
        : undefined
      }
    />
  );
}

/**
 * Continues a job that stopped early. Mails already sent are never repeated —
 * the only thing the editor decides is whether the failed and the interrupted
 * ones are attempted again.
 */
export function ResumeJobButton({
  job,
  size = 'sm',
  onDone,
}: {
  job: FullMailSendJobFragment;
  size?: 'xs' | 'sm' | 'md';
  onDone?: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [retryUnfinished, setRetryUnfinished] = useState(false);

  const [resume, { loading }] = useResumeMailSendJobMutation({
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
    onCompleted: () => {
      toaster.push(
        <Message
          type="success"
          showIcon
          closable
          duration={3000}
        >
          {t('mailJobs.resumed')}
        </Message>
      );
      onDone?.();
    },
  });

  const remaining = openCount(job);
  const unfinished = unfinishedCount(job);
  const total = remaining + (retryUnfinished ? unfinished : 0);

  return (
    <>
      <Button
        size={size}
        appearance="primary"
        startIcon={<MdPlayArrow />}
        onClick={event => {
          event.stopPropagation();
          setOpen(true);
        }}
      >
        {t('mailJobs.resume')}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="xs"
      >
        <Modal.Header>
          <Modal.Title>{t('mailJobs.resumeTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{t('mailJobs.resumeText', { count: remaining })}</p>

          {unfinished > 0 && (
            <div style={{ marginTop: 12 }}>
              <Checkbox
                checked={retryUnfinished}
                onChange={(_, checked) => setRetryUnfinished(checked)}
              >
                {t('mailJobs.retryUnfinished', { count: unfinished })}
              </Checkbox>
              <Typography
                variant="caption"
                display="block"
                style={{ color: '#8e8e93', lineHeight: 1.35, marginLeft: 34 }}
              >
                {t('mailJobs.retryUnfinishedHint')}
              </Typography>
            </div>
          )}

          <Message
            type="info"
            style={{ marginTop: 12 }}
          >
            {t('mailJobs.resumeSafety', { count: job.sentCount })}
          </Message>
        </Modal.Body>
        <Modal.Footer>
          <Button
            appearance="primary"
            loading={loading}
            disabled={total === 0}
            onClick={async () => {
              await resume({ variables: { id: job.id, retryUnfinished } });
              setOpen(false);
            }}
          >
            {t('mailJobs.resumeConfirm', { count: total })}
          </Button>
          <Button
            appearance="subtle"
            onClick={() => setOpen(false)}
          >
            {t('mailSend.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

/** Stops a running job. What was not sent stays open for a later continue. */
export function CancelJobButton({
  job,
  size = 'sm',
  onDone,
}: {
  job: FullMailSendJobFragment;
  size?: 'xs' | 'sm' | 'md';
  onDone?: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const [cancel, { loading }] = useCancelMailSendJobMutation({
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
    onCompleted: () => onDone?.(),
  });

  return (
    <>
      <Button
        size={size}
        appearance="ghost"
        color="red"
        startIcon={<MdStop />}
        onClick={event => {
          event.stopPropagation();
          setOpen(true);
        }}
      >
        {t('mailJobs.cancel')}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="xs"
      >
        <Modal.Header>
          <Modal.Title>{t('mailJobs.cancelTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {t('mailJobs.cancelText', { count: openCount(job) })}
        </Modal.Body>
        <Modal.Footer>
          <Button
            appearance="primary"
            color="red"
            loading={loading}
            onClick={async () => {
              await cancel({ variables: { id: job.id } });
              setOpen(false);
            }}
          >
            {t('mailJobs.cancelConfirm')}
          </Button>
          <Button
            appearance="subtle"
            onClick={() => setOpen(false)}
          >
            {t('mailSend.back')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
