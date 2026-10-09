import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  Drawer,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import {
  FullMailSendJobFragment,
  MailLogState,
  MailSendJobDocument,
  MailSendJobRecipientState,
  MailSendJobRecipientsDocument,
  MailSendJobState,
  MailSendJobsDocument,
} from '@wepublish/editor/api';
import {
  InfoTooltip,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DRAWER_WIDTHS,
  Pagination,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdMail, MdOutlineChevronRight } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { SelectPicker } from 'rsuite';
import { useShowErrors } from '../common';
import {
  formatDateTime,
  MailErrorCell,
  mailErrorHelpKey,
} from './mail-log-common';
import {
  CancelJobButton,
  canResume,
  isActive,
  JobProgressBar,
  MailSendJobStateTag,
  openCount,
  ResumeJobButton,
} from './mail-job-common';

const PAGE_SIZE = 20;
const RECIPIENT_PAGE_SIZE = 50;
/** How often a job that is still working is re-read. */
const POLL_INTERVAL = 2000;

const ClickableRow = styled(TableRow)`
  cursor: pointer;

  &:hover {
    background-color: rgb(from var(--rs-text-primary) r g b / 0.03);
  }
`;

const Stat = styled.div<{ tone: string }>`
  flex: 1;
  min-width: 110px;
  padding: 8px 12px;
  border-left: 3px solid ${({ tone }) => tone};
  border-radius: var(--rs-radius-md);
  background-color: rgb(from var(--rs-text-primary) r g b / 0.02);
`;

const StatValue = styled.div`
  font-size: 1.4rem;
  line-height: 1.2;
`;

const TONE = {
  sent: 'var(--rs-state-success)',
  pending: 'var(--rs-text-secondary)',
  failed: 'var(--rs-state-error)',
  sending: 'var(--rs-state-warning)',
} as const;

/**
 * Every bulk send ever started, with what became of it. The detail view is
 * where an unfinished send is picked up again, so a job that stopped early is
 * never a dead end.
 */
export function MailSendJobList({
  selectedJobId,
  onSelectJob,
}: {
  selectedJobId: string | null;
  onSelectJob: (jobId: string | null) => void;
}) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const { data, error, startPolling, stopPolling, refetch } = useQuery(
    MailSendJobsDocument,
    {
      fetchPolicy: 'cache-and-network',
      variables: { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE },
    }
  );
  useShowErrors(error);

  const jobs = data?.mailSendJobs.nodes ?? [];
  const hasActiveJob = jobs.some(isActive);

  // Only poll while something is actually moving.
  useEffect(() => {
    if (hasActiveJob) {
      startPolling(POLL_INTERVAL);
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [hasActiveJob, startPolling, stopPolling]);

  return (
    <>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>{t('mailJobs.created')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('mailJobs.template')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('mailJobs.audience')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('mailJobs.state')}</strong>
              </TableCell>
              <TableCell width="24%">
                <strong>{t('mailJobs.progress')}</strong>
              </TableCell>
              <TableCell align="center">
                <strong>{t('action')}</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map(job => (
              <ClickableRow
                key={job.id}
                hover
                onClick={() => onSelectJob(job.id)}
              >
                <TableCell>{formatDateTime(job.createdAt)}</TableCell>
                <TableCell>{job.mailTemplate?.name ?? '—'}</TableCell>
                <TableCell>{t(`mailJobs.audiences.${job.audience}`)}</TableCell>
                <TableCell>
                  <MailSendJobStateTag status={job.status} />
                </TableCell>
                <TableCell>
                  <JobProgressBar job={job} />
                  <Typography
                    variant="caption"
                    style={{ color: 'var(--rs-text-secondary)' }}
                    sx={{
                      display: 'block',
                    }}
                  >
                    {t('mailJobs.progressCount', {
                      sent: job.sentCount,
                      total: job.totalCount,
                    })}
                    {job.failedCount > 0 &&
                      ` · ${t('mailJobs.failedCount', {
                        count: job.failedCount,
                      })}`}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Stack
                    direction="row"
                    sx={{ justifyContent: 'center' }}
                    spacing={1}
                  >
                    {canResume(job) && (
                      <ResumeJobButton
                        job={job}
                        size="small"
                        onDone={() => refetch()}
                      />
                    )}
                    <Button
                      variant="text"
                      size="small"
                      endIcon={<MdOutlineChevronRight />}
                      onClick={event => {
                        event.stopPropagation();
                        onSelectJob(job.id);
                      }}
                    >
                      {t('mailJobs.details')}
                    </Button>
                  </Stack>
                </TableCell>
              </ClickableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {!jobs.length && (
        <Alert
          severity="info"
          style={{ marginTop: 16 }}
        >
          {t('mailJobs.empty')}
        </Alert>
      )}
      <Pagination
        state={{
          page,
          limit: PAGE_SIZE,
          setPage,
          // This list has a fixed page size.
          setLimit: () => undefined,
        }}
        totalCount={data?.mailSendJobs.totalCount ?? 0}
      />
      <MailSendJobDrawer
        jobId={selectedJobId}
        onClose={() => {
          onSelectJob(null);
          refetch();
        }}
      />
    </>
  );
}

/** One job in full: how far it got, why it stopped, and what to do about it. */
function MailSendJobDrawer({
  jobId,
  onClose,
}: {
  jobId: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  const { data, error, startPolling, stopPolling, refetch } = useQuery(
    MailSendJobDocument,
    {
      skip: !jobId,
      fetchPolicy: 'cache-and-network',
      variables: { id: jobId as string },
    }
  );
  useShowErrors(error);

  const job = jobId ? data?.mailSendJob : null;
  const active = job ? isActive(job) : false;

  useEffect(() => {
    if (active) {
      startPolling(POLL_INTERVAL);
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [active, startPolling, stopPolling]);

  return (
    <Drawer
      anchor="right"
      slotProps={{
        paper: {
          sx: {
            display: 'flex',
            flexDirection: 'column',
            width: DRAWER_WIDTHS.lg,
            maxWidth: '100vw',
          },
        },
      }}
      open={!!jobId}
      onClose={onClose}
    >
      <DrawerHeader>
        <DrawerTitle>
          {job?.mailTemplate?.name ?? t('mailJobs.detailTitle')}
        </DrawerTitle>
      </DrawerHeader>

      <DrawerBody>
        {job && (
          <>
            <JobSummary
              job={job}
              onChanged={() => refetch()}
            />
            <JobRecipientTable
              jobId={job.id}
              poll={active}
            />
          </>
        )}
      </DrawerBody>
    </Drawer>
  );
}

function JobSummary({
  job,
  onChanged,
}: {
  job: FullMailSendJobFragment;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const pending = openCount(job);

  return (
    <>
      <Stack
        direction="row"
        sx={{ flexWrap: 'wrap', alignItems: 'center' }}
        spacing={2}
        style={{ marginBottom: 16 }}
      >
        <MailSendJobStateTag status={job.status} />
        <Typography variant="body2">
          {t('mailJobs.audience')}: {t(`mailJobs.audiences.${job.audience}`)}
        </Typography>
        <Typography variant="body2">
          {t('mailJobs.created')}: {formatDateTime(job.createdAt)}
        </Typography>
        {job.finishedAt && (
          <Typography variant="body2">
            {t('mailJobs.finished')}: {formatDateTime(job.finishedAt)}
          </Typography>
        )}
      </Stack>
      <JobProgressBar job={job} />
      <Stack
        direction="row"
        sx={{ flexWrap: 'wrap' }}
        spacing={1.5}
        style={{ marginTop: 16 }}
      >
        <Stat tone={TONE.sent}>
          <StatValue>{job.sentCount}</StatValue>
          <Typography variant="caption">{t('mailJobs.stats.sent')}</Typography>
        </Stat>
        <Stat tone={TONE.pending}>
          <StatValue>{pending}</StatValue>
          <Typography variant="caption">
            {t('mailJobs.stats.pending')}
          </Typography>
        </Stat>
        <Stat tone={TONE.failed}>
          <StatValue>{job.failedCount}</StatValue>
          <Typography variant="caption">
            {t('mailJobs.stats.failed')}
          </Typography>
        </Stat>
        <Stat tone={TONE.sending}>
          <StatValue>{job.sendingCount}</StatValue>
          <Typography variant="caption">
            {t(
              job.status === MailSendJobState.Running ?
                'mailJobs.stats.sending'
              : 'mailJobs.stats.interrupted'
            )}
          </Typography>
        </Stat>
      </Stack>
      {job.error && (
        <Alert
          severity={pending > 0 ? 'warning' : 'error'}
          style={{ marginTop: 16 }}
        >
          <div>{job.error}</div>
          <div style={{ marginTop: 8, whiteSpace: 'pre-line' }}>
            <strong>{t('mailLog.errorHelp.fixTitle')}:</strong>{' '}
            {t(`mailLog.errorHelp.${mailErrorHelpKey(job.error)}.fix`)}
          </div>
        </Alert>
      )}
      {pending > 0 && !isActive(job) && (
        <Alert
          severity="info"
          style={{ marginTop: 16 }}
        >
          {t('mailJobs.unfinishedHint', { count: pending })}
        </Alert>
      )}
      {job.status === MailSendJobState.Running && job.heartbeatAt && (
        <Typography
          variant="caption"
          style={{ color: 'var(--rs-text-secondary)', marginTop: 12 }}
          sx={{
            display: 'block',
          }}
        >
          {t('mailJobs.lastActivity', {
            time: formatDateTime(job.heartbeatAt),
          })}
        </Typography>
      )}
      <Stack
        direction="row"
        sx={{ flexWrap: 'wrap' }}
        spacing={1}
        style={{ marginTop: 16, marginBottom: 24 }}
      >
        {canResume(job) && (
          <ResumeJobButton
            job={job}
            onDone={onChanged}
          />
        )}
        {isActive(job) && (
          <CancelJobButton
            job={job}
            onDone={onChanged}
          />
        )}
        <Button
          variant="outlined"
          size="small"
          component={Link}
          to={`/maillog?job=${job.id}`}
          startIcon={<MdMail />}
        >
          {t('mailJobs.showMails')}
        </Button>
        {job.failedCount > 0 && (
          <Button
            variant="outlined"
            size="small"
            color="error"
            component={Link}
            to={`/maillog?job=${job.id}&state=${MailLogState.Rejected}`}
          >
            {t('mailJobs.showFailedMails', { count: job.failedCount })}
          </Button>
        )}
      </Stack>
    </>
  );
}

/** The queue itself: every planned mail of this job and where it stands. */
function JobRecipientTable({ jobId, poll }: { jobId: string; poll: boolean }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [state, setState] = useState<MailSendJobRecipientState | null>(null);

  // A different job or filter starts at the top of the queue again.
  useEffect(() => {
    setPage(1);
  }, [jobId, state]);

  const { data, error, startPolling, stopPolling } = useQuery(
    MailSendJobRecipientsDocument,
    {
      fetchPolicy: 'cache-and-network',
      variables: {
        jobId,
        state,
        skip: (page - 1) * RECIPIENT_PAGE_SIZE,
        take: RECIPIENT_PAGE_SIZE,
      },
    }
  );
  useShowErrors(error);

  useEffect(() => {
    if (poll) {
      startPolling(POLL_INTERVAL);
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [poll, startPolling, stopPolling]);

  const entries = data?.mailSendJobRecipients.nodes ?? [];

  return (
    <Card variant="outlined">
      <CardHeader
        title={
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
            style={{ width: '100%' }}
          >
            <span>{t('mailJobs.queue.title')}</span>
            <SelectPicker
              size="sm"
              searchable={false}
              style={{ width: 200 }}
              data={Object.values(MailSendJobRecipientState).map(value => ({
                label: t(`mailJobs.recipientState.${value}`),
                value,
              }))}
              value={state}
              onChange={setState}
              placeholder={t('mailJobs.queue.allStates')}
            />
          </Stack>
        }
      />

      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>
                  <strong>{t('mailJobs.queue.recipient')}</strong>
                </TableCell>
                <TableCell>
                  <strong>{t('mailJobs.queue.state')}</strong>
                </TableCell>
                <TableCell>
                  <strong>{t('mailJobs.queue.sentAt')}</strong>
                </TableCell>
                <TableCell>
                  <strong>{t('mailJobs.queue.attempts')}</strong>{' '}
                  <InfoTooltip text={t('mailJobs.queue.attemptsHelp')} />
                </TableCell>
                <TableCell>
                  <strong>{t('mailLog.error')}</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell style={{ color: 'var(--rs-text-secondary)' }}>
                    {entry.position + 1}
                  </TableCell>
                  <TableCell>
                    {entry.user.email}
                    {entry.memberPlanName && (
                      <Typography
                        variant="caption"
                        style={{ color: 'var(--rs-text-secondary)' }}
                        sx={{
                          display: 'block',
                        }}
                      >
                        {entry.memberPlanName}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <RecipientStateTag state={entry.state} />
                  </TableCell>
                  <TableCell>{formatDateTime(entry.sentAt)}</TableCell>
                  <TableCell>{entry.attempts}</TableCell>
                  <TableCell>
                    <MailErrorCell error={entry.error} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {!entries.length && (
          <Alert
            severity="info"
            style={{ marginTop: 12 }}
          >
            {t('mailJobs.queue.empty')}
          </Alert>
        )}
        <Pagination
          state={{
            page,
            limit: RECIPIENT_PAGE_SIZE,
            setPage,
            setLimit: () => undefined /* page size was fixed here */,
          }}
          totalCount={data?.mailSendJobRecipients.totalCount ?? 0}
        />
      </CardContent>
    </Card>
  );
}

const RECIPIENT_STATE_TONE: Record<MailSendJobRecipientState, string> = {
  [MailSendJobRecipientState.Sent]: TONE.sent,
  [MailSendJobRecipientState.Pending]: TONE.pending,
  [MailSendJobRecipientState.Failed]: TONE.failed,
  [MailSendJobRecipientState.Sending]: TONE.sending,
};

const StateDot = styled.span<{ tone: string }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  background-color: ${({ tone }) => tone};
`;

function RecipientStateTag({ state }: { state: MailSendJobRecipientState }) {
  const { t } = useTranslation();

  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      <StateDot tone={RECIPIENT_STATE_TONE[state]} />
      {t(`mailJobs.recipientState.${state}`)}
    </span>
  );
}
