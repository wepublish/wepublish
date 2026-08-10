import styled from '@emotion/styled';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  FullMailSendJobFragment,
  MailLogState,
  MailSendJobRecipientState,
  MailSendJobState,
  useMailSendJobQuery,
  useMailSendJobRecipientsQuery,
  useMailSendJobsQuery,
} from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdMail, MdOutlineChevronRight } from 'react-icons/md';
import { Link } from 'react-router-dom';
import {
  Button,
  Drawer,
  Message,
  Pagination,
  Panel,
  SelectPicker,
  Stack,
} from 'rsuite';
import { DEFAULT_QUERY_OPTIONS } from '../common';
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
    background-color: rgba(0, 0, 0, 0.03);
  }
`;

const Stat = styled.div<{ tone: string }>`
  flex: 1;
  min-width: 110px;
  padding: 8px 12px;
  border-left: 3px solid ${({ tone }) => tone};
  background-color: rgba(0, 0, 0, 0.02);
`;

const StatValue = styled.div`
  font-size: 1.4rem;
  line-height: 1.2;
`;

const TONE = {
  sent: '#4caf50',
  pending: '#8e8e93',
  failed: '#d9534f',
  sending: '#f5a623',
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

  const { data, startPolling, stopPolling, refetch } = useMailSendJobsQuery({
    ...DEFAULT_QUERY_OPTIONS(),
    fetchPolicy: 'cache-and-network',
    variables: { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE },
  });

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
              <TableCell align="right">
                <strong>{t('mailJobs.actions')}</strong>
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
                    display="block"
                    style={{ color: '#8e8e93' }}
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
                <TableCell align="right">
                  <Stack
                    spacing={8}
                    justifyContent="flex-end"
                  >
                    {canResume(job) && (
                      <ResumeJobButton
                        job={job}
                        size="xs"
                        onDone={() => refetch()}
                      />
                    )}
                    <Button
                      size="xs"
                      appearance="subtle"
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
        <Message
          type="info"
          style={{ marginTop: 16 }}
        >
          {t('mailJobs.empty')}
        </Message>
      )}

      <Pagination
        style={{ marginTop: 16 }}
        prev
        next
        maxButtons={7}
        size="sm"
        total={data?.mailSendJobs.totalCount ?? 0}
        limit={PAGE_SIZE}
        activePage={page}
        onChangePage={setPage}
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

  const { data, startPolling, stopPolling, refetch } = useMailSendJobQuery({
    ...DEFAULT_QUERY_OPTIONS(),
    skip: !jobId,
    fetchPolicy: 'cache-and-network',
    variables: { id: jobId as string },
  });

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
      open={!!jobId}
      onClose={onClose}
      size="lg"
    >
      <Drawer.Header>
        <Drawer.Title>
          {job?.mailTemplate?.name ?? t('mailJobs.detailTitle')}
        </Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
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
      </Drawer.Body>
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
        spacing={16}
        alignItems="center"
        wrap
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
        spacing={12}
        wrap
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
        <Message
          type={pending > 0 ? 'warning' : 'error'}
          showIcon
          style={{ marginTop: 16 }}
        >
          <div>{job.error}</div>
          <div style={{ marginTop: 8, whiteSpace: 'pre-line' }}>
            <strong>{t('mailLog.errorHelp.fixTitle')}:</strong>{' '}
            {t(`mailLog.errorHelp.${mailErrorHelpKey(job.error)}.fix`)}
          </div>
        </Message>
      )}

      {pending > 0 && !isActive(job) && (
        <Message
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        >
          {t('mailJobs.unfinishedHint', { count: pending })}
        </Message>
      )}

      {job.status === MailSendJobState.Running && job.heartbeatAt && (
        <Typography
          variant="caption"
          display="block"
          style={{ color: '#8e8e93', marginTop: 12 }}
        >
          {t('mailJobs.lastActivity', {
            time: formatDateTime(job.heartbeatAt),
          })}
        </Typography>
      )}

      <Stack
        spacing={8}
        wrap
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
          size="sm"
          appearance="ghost"
          as={Link}
          to={`/maillog?job=${job.id}`}
          startIcon={<MdMail />}
        >
          {t('mailJobs.showMails')}
        </Button>
        {job.failedCount > 0 && (
          <Button
            size="sm"
            appearance="ghost"
            color="red"
            as={Link}
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

  const { data, startPolling, stopPolling } = useMailSendJobRecipientsQuery({
    ...DEFAULT_QUERY_OPTIONS(),
    fetchPolicy: 'cache-and-network',
    variables: {
      jobId,
      state,
      skip: (page - 1) * RECIPIENT_PAGE_SIZE,
      take: RECIPIENT_PAGE_SIZE,
    },
  });

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
    <Panel
      bordered
      header={
        <Stack
          justifyContent="space-between"
          alignItems="center"
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
    >
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
                <strong>{t('mailJobs.queue.attempts')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('mailLog.error')}</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map(entry => (
              <TableRow key={entry.id}>
                <TableCell style={{ color: '#8e8e93' }}>
                  {entry.position + 1}
                </TableCell>
                <TableCell>
                  {entry.user.email}
                  {entry.memberPlanName && (
                    <Typography
                      variant="caption"
                      display="block"
                      style={{ color: '#8e8e93' }}
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
        <Message
          type="info"
          style={{ marginTop: 12 }}
        >
          {t('mailJobs.queue.empty')}
        </Message>
      )}

      <Pagination
        style={{ marginTop: 12 }}
        prev
        next
        maxButtons={5}
        size="xs"
        total={data?.mailSendJobRecipients.totalCount ?? 0}
        limit={RECIPIENT_PAGE_SIZE}
        activePage={page}
        onChangePage={setPage}
      />
    </Panel>
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
