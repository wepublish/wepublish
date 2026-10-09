import { useMutation } from '@apollo/client/react';
import {
  Alert,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  CancelMailSendJobDocument,
  FullMailSendJobFragment,
  MailSendJobState,
  ResumeMailSendJobDocument,
} from '@wepublish/editor/api';
import { humanizeError, enqueueSnackbar } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdPlayArrow, MdStop } from 'react-icons/md';
import { Checkbox } from 'rsuite';

const STATE_COLORS: Record<
  MailSendJobState,
  'success' | 'warning' | 'error' | 'primary'
> = {
  [MailSendJobState.Queued]: 'warning',
  [MailSendJobState.Running]: 'primary',
  [MailSendJobState.Done]: 'success',
  [MailSendJobState.Failed]: 'error',
  [MailSendJobState.Cancelled]: 'error',
};

export function MailSendJobStateTag({ status }: { status: MailSendJobState }) {
  const { t } = useTranslation();

  return (
    <Chip
      color={STATE_COLORS[status] ?? 'primary'}
      label={t(`mailSend.status.${status}`)}
    />
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
    <LinearProgress
      // A running job animates; a finished one sits at its final percentage.
      variant={
        job.status === MailSendJobState.Running ?
          'indeterminate'
        : 'determinate'
      }
      value={percent}
      color={
        job.failedCount || job.status === MailSendJobState.Failed ? 'warning'
        : job.status === MailSendJobState.Done ?
          'success'
        : 'primary'
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
  size = 'small',
  onDone,
}: {
  job: FullMailSendJobFragment;
  size?: 'small' | 'medium' | 'large';
  onDone?: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [retryUnfinished, setRetryUnfinished] = useState(false);

  const [resume, { loading }] = useMutation(ResumeMailSendJobDocument, {
    onError: error =>
      enqueueSnackbar(humanizeError(error), { variant: 'error' }),
    onCompleted: () => {
      enqueueSnackbar(t('mailJobs.resumed'), {
        variant: 'success',
        autoHideDuration: 3000,
      });
      onDone?.();
    },
  });

  const remaining = openCount(job);
  const unfinished = unfinishedCount(job);
  const total = remaining + (retryUnfinished ? unfinished : 0);

  return (
    <>
      <Button
        variant="contained"
        size={size}
        startIcon={<MdPlayArrow />}
        onClick={event => {
          event.stopPropagation();
          setOpen(true);
        }}
      >
        {t('mailJobs.resume')}
      </Button>
      <Dialog
        fullWidth
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
      >
        <DialogTitle>{t('mailJobs.resumeTitle')}</DialogTitle>
        <DialogContent>
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
                style={{
                  color: 'var(--rs-text-secondary)',
                  lineHeight: 1.35,
                  marginLeft: 34,
                }}
                sx={{
                  display: 'block',
                }}
              >
                {t('mailJobs.retryUnfinishedHint')}
              </Typography>
            </div>
          )}

          <Alert
            severity="info"
            style={{ marginTop: 12 }}
          >
            {t('mailJobs.resumeSafety', { count: job.sentCount })}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
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
            variant="text"
            onClick={() => setOpen(false)}
          >
            {t('mailSend.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/** Stops a running job. What was not sent stays open for a later continue. */
export function CancelJobButton({
  job,
  size = 'small',
  onDone,
}: {
  job: FullMailSendJobFragment;
  size?: 'small' | 'medium' | 'large';
  onDone?: () => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const [cancel, { loading }] = useMutation(CancelMailSendJobDocument, {
    onError: error =>
      enqueueSnackbar(humanizeError(error), { variant: 'error' }),
    onCompleted: () => onDone?.(),
  });

  return (
    <>
      <Button
        variant="outlined"
        size={size}
        color="error"
        startIcon={<MdStop />}
        onClick={event => {
          event.stopPropagation();
          setOpen(true);
        }}
      >
        {t('mailJobs.cancel')}
      </Button>

      <Dialog
        fullWidth
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
      >
        <DialogTitle>{t('mailJobs.cancelTitle')}</DialogTitle>
        <DialogContent>
          {t('mailJobs.cancelText', { count: openCount(job) })}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="error"
            loading={loading}
            onClick={async () => {
              await cancel({ variables: { id: job.id } });
              setOpen(false);
            }}
          >
            {t('mailJobs.cancelConfirm')}
          </Button>
          <Button
            variant="text"
            onClick={() => setOpen(false)}
          >
            {t('mailSend.back')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
