import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  MailChannel,
  MailLogState,
  MailLogType,
  MailLogsDocument,
  MailSendJobsDocument,
  MailTemplateDocument,
  SyncMailLogStatesDocument,
} from '@wepublish/editor/api';
import styled from '@emotion/styled';
import { InfoTooltip, enqueueSnackbar, Pagination } from '@wepublish/ui/editor';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdFilterList, MdSync } from 'react-icons/md';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_MUTATION_OPTIONS } from '../common';
import {
  formatDateTime,
  MailErrorCell,
  MailLogChannelCell,
  mailLogTypeLabel,
  MailLogStateLegend,
  MailLogStateTag,
} from './mail-log-common';

const PAGE_SIZE = 50;
const JOB_OPTIONS_LIMIT = 50;

interface MailTypeOption {
  label: string;
  description: string;
  value: MailLogType;
}

/** Filters share one responsive row so they line up whatever the viewport. */
const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  align-items: start;
`;

function FilterField({
  label,
  info,
  hint,
  children,
}: {
  label: string;
  info?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Typography
        variant="caption"
        style={{ marginBottom: 4, fontWeight: 600 }}
        sx={{
          display: 'block',
        }}
      >
        {label}
        {info && (
          <>
            {' '}
            <InfoTooltip text={info} />
          </>
        )}
      </Typography>
      {children}
      {hint && (
        <Typography
          variant="caption"
          style={{
            marginTop: 4,
            color: 'text.secondary',
            lineHeight: 1.35,
          }}
          sx={{
            display: 'block',
          }}
        >
          {hint}
        </Typography>
      )}
    </div>
  );
}

/** The sent mails themselves, filterable by send, template, state and origin. */
export function MailLogTable() {
  const { t } = useTranslation();

  // The send job lives in the URL so the failure links on the send page can
  // deep-link straight into the mails of one specific send.
  const [searchParams, setSearchParams] = useSearchParams();
  const jobId = searchParams.get('job');

  const [page, setPage] = useState(1);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [state, setState] = useState<MailLogState | null>(
    searchParams.get('state') === MailLogState.Rejected ?
      MailLogState.Rejected
    : null
  );
  const [type, setType] = useState<MailLogType | null>(null);
  const [channel, setChannel] = useState<MailChannel | null>(null);

  const { data: templateData } = useQuery(MailTemplateDocument);

  const { data: jobData } = useQuery(MailSendJobsDocument, {
    variables: { take: JOB_OPTIONS_LIMIT },
  });
  const { data } = useQuery(MailLogsDocument, {
    variables: {
      filter: {
        mailTemplateId: templateId ?? undefined,
        state: state ?? undefined,
        type: type ?? undefined,
        channel: channel ?? undefined,
        mailSendJobId: jobId ?? undefined,
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    },
  });

  const [syncStates, { loading: syncing }] = useMutation(
    SyncMailLogStatesDocument,
    {
      ...DEFAULT_MUTATION_OPTIONS(t),
      refetchQueries: ['MailLogs'],
    }
  );

  // Delivery states normally arrive by provider webhook. Locally the provider
  // cannot reach this installation, so offer an explicit pull.
  const runSync = async () => {
    const result = await syncStates();
    const sync = result.data?.syncMailLogStates;

    if (!sync) {
      return;
    }

    enqueueSnackbar(
      t('mailLog.sync.done', {
        checked: sync.checked,
        updated: sync.updated,
      }),
      { variant: sync.updated ? 'success' : 'info' }
    );
  };

  const logs = data?.mailLogs.nodes ?? [];
  const totalCount = data?.mailLogs.totalCount ?? 0;

  const stateOptions = Object.values(MailLogState).map(value => ({
    label: value,
    value,
  }));
  const channelOptions = Object.values(MailChannel).map(value => ({
    label: t(`mailLog.channels.${value}`),
    value,
  }));

  const typeOptions = Object.values(MailLogType).map(value => ({
    label: mailLogTypeLabel(value, t),
    description: t(`mailLog.typeDescriptions.${value}`),
    value,
  }));
  const templateOptions = (templateData?.mailTemplates ?? []).map(template => ({
    label: template.name,
    value: template.id,
  }));
  const jobOptions = (jobData?.mailSendJobs.nodes ?? []).map(job => ({
    label: `${formatDateTime(job.createdAt)} · ${
      job.mailTemplate?.name ?? '—'
    } (${job.sentCount}/${job.totalCount})`,
    value: job.id,
  }));

  const resetPageThen =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setPage(1);
      setter(value);
    };

  // The job filter is URL state, so keep the other params (e.g. state) intact.
  const selectJob = (value: string | null) => {
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set('job', value);
    } else {
      next.delete('job');
    }
    setSearchParams(next);
  };

  const hasFilters = !!(jobId || templateId || state || type || channel);

  const resetFilters = () => {
    setPage(1);
    setTemplateId(null);
    setState(null);
    setType(null);
    setChannel(null);
    setSearchParams({});
  };

  return (
    <>
      <Card
        variant="outlined"
        style={{ marginTop: 16, marginBottom: 16 }}
      >
        <CardHeader
          title={
            <Stack
              direction="row"
              sx={{ alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Stack
                direction="row"
                sx={{ alignItems: 'center' }}
                spacing={1}
              >
                <MdFilterList />
                <span>{t('mailLog.filter.title')}</span>
              </Stack>
              <Stack
                direction="row"
                sx={{ alignItems: 'center' }}
                spacing={1}
              >
                {hasFilters && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={resetFilters}
                  >
                    {t('mailLog.filter.reset')}
                  </Button>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  loading={syncing}
                  onClick={runSync}
                >
                  <MdSync /> {t('mailLog.sync.action')}
                </Button>
                <InfoTooltip text={t('mailLog.sync.hint')} />
              </Stack>
            </Stack>
          }
        />

        <CardContent>
          <FilterGrid>
            <FilterField
              label={t('mailLog.filter.job')}
              info={t('mailLog.filter.jobHelp')}
            >
              <TextField
                select
                value={jobId ?? ''}
                onChange={event => selectJob(event.target.value || null)}
                slotProps={{ select: { displayEmpty: true } }}
                fullWidth
              >
                <MenuItem value="">{t('mailLog.filter.jobAll')}</MenuItem>

                {jobOptions.map(option => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </FilterField>
            <FilterField label={t('mailLog.filter.template')}>
              <TextField
                select
                value={templateId ?? ''}
                onChange={event =>
                  resetPageThen(setTemplateId)(event.target.value || null)
                }
                slotProps={{ select: { displayEmpty: true } }}
                fullWidth
              >
                <MenuItem value="">{t('mailLog.filter.all')}</MenuItem>

                {templateOptions.map(option => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </FilterField>
            <FilterField label={t('mailLog.filter.state')}>
              <TextField
                select
                value={state ?? ''}
                onChange={event =>
                  resetPageThen(setState)(
                    (event.target.value as MailLogState) || null
                  )
                }
                slotProps={{ select: { displayEmpty: true } }}
                fullWidth
              >
                <MenuItem value="">{t('mailLog.filter.all')}</MenuItem>

                {stateOptions.map(option => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </FilterField>
            <FilterField label={t('mailLog.filter.channel')}>
              <TextField
                select
                value={channel ?? ''}
                onChange={event =>
                  resetPageThen(setChannel)(
                    (event.target.value as MailChannel) || null
                  )
                }
                slotProps={{ select: { displayEmpty: true } }}
                fullWidth
              >
                <MenuItem value="">{t('mailLog.filter.all')}</MenuItem>

                {channelOptions.map(option => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </FilterField>
            <FilterField
              label={t('mailLog.filter.type')}
              hint={t('mailLog.filter.typeHint')}
            >
              <TextField
                select
                value={type ?? ''}
                onChange={event =>
                  resetPageThen(setType)(
                    (event.target.value as MailLogType) || null
                  )
                }
                slotProps={{ select: { displayEmpty: true } }}
                fullWidth
              >
                <MenuItem value="">{t('mailLog.filter.all')}</MenuItem>

                {typeOptions.map(option => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                    sx={{ display: 'block', paddingBlock: 0.5 }}
                  >
                    <div>{option.label}</div>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        whiteSpace: 'normal',
                        lineHeight: 1.35,
                      }}
                    >
                      {(option as MailTypeOption).description}
                    </Typography>
                  </MenuItem>
                ))}
              </TextField>
            </FilterField>
          </FilterGrid>
        </CardContent>
      </Card>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>{t('mailLog.sentDate')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('mailLog.recipient')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('mailLog.template')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('mailLog.subject')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('mailLog.channel')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('mailLog.type')}</strong>
              </TableCell>
              <TableCell>
                <Stack
                  direction="row"
                  sx={{ alignItems: 'center' }}
                  spacing={0.5}
                >
                  <strong>{t('mailLog.state')}</strong>
                  <MailLogStateLegend />
                </Stack>
              </TableCell>
              <TableCell>
                <strong>{t('mailLog.error')}</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map(log => (
              <TableRow key={log.id}>
                <TableCell>{formatDateTime(log.sentDate)}</TableCell>
                <TableCell>{log.recipient.email}</TableCell>
                <TableCell>{log.mailTemplate.name}</TableCell>
                <TableCell>{log.subject ?? '—'}</TableCell>
                <TableCell>
                  <MailLogChannelCell
                    channel={log.channel}
                    address={log.address}
                  />
                </TableCell>
                <TableCell>{mailLogTypeLabel(log.type, t)}</TableCell>
                <TableCell>
                  <MailLogStateTag state={log.state} />
                </TableCell>
                <TableCell>
                  <MailErrorCell error={log.error} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Pagination
        state={{
          page,
          limit: PAGE_SIZE,
          setPage,
          setLimit: () => undefined /* page size was fixed here */,
        }}
        totalCount={totalCount}
      />
    </>
  );
}
