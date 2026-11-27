import { useMutation, useQuery } from '@apollo/client/react';
import { Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import {
  FullMailLogFragment,
  MailChannel,
  MailLogFilter,
  MailLogState,
  MailLogType,
  MailLogsDocument,
  MailSendJobsDocument,
  MailTemplateDocument,
  SyncMailLogStatesDocument,
} from '@wepublish/editor/api';
import styled from '@emotion/styled';
import {
  DataTable,
  enqueueSnackbar,
  InfoTooltip,
  Pagination,
  TableWrapper,
  useListViewState,
  useTableExportQuery,
} from '@wepublish/ui/editor';
import { ReactNode, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdSync } from 'react-icons/md';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_MUTATION_OPTIONS } from '../common';
import { useLetterChannel } from '../mail-template/use-letter-channel';
import {
  formatDateTime,
  MailErrorCell,
  MailLogChannelCell,
  mailLogTypeLabel,
  MailLogStateLegend,
  MailLogStateTag,
} from './mail-log-common';

const DEFAULT_PAGE_SIZE = 50;
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

const Toolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
`;

const isMailLogState = (value: string | null): value is MailLogState =>
  Object.values(MailLogState).includes(value as MailLogState);

/** Drops unset filters so stored and linked filters compare and count cleanly. */
const compact = (filter: MailLogFilter): MailLogFilter =>
  Object.fromEntries(
    Object.entries(filter).filter(([, value]) => value != null && value !== '')
  );

function FilterField({
  label,
  info,
  hint,
  children,
}: {
  label: string;
  info?: string;
  hint?: string;
  children: (ids: { labelId: string; hintId?: string }) => ReactNode;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{ alignItems: 'center', marginBottom: 0.5 }}
      >
        <Typography
          id={labelId}
          variant="caption"
          style={{ fontWeight: 600 }}
          sx={{
            display: 'block',
          }}
        >
          {label}
        </Typography>
        {info && <InfoTooltip text={info} />}
      </Stack>
      {children({ labelId, hintId })}
      {hint && (
        <Typography
          id={hintId}
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

/**
 * The sent mails themselves, filterable by send, template, state and origin.
 *
 * Filters and page size are remembered like in every other list. A link from
 * a send (`?job=…&state=…`) shows exactly that send instead; the first filter
 * change takes over from the link.
 */
export function MailLogTable() {
  const { t } = useTranslation();

  const [searchParams, setSearchParams] = useSearchParams();
  const linkedJob = searchParams.get('job');
  const linkedStateParam = searchParams.get('state');
  const linkedState =
    isMailLogState(linkedStateParam) ? linkedStateParam : null;
  const linked = !!(linkedJob || linkedState);

  const listState = useListViewState<MailLogFilter>('mail-log', {
    defaultSortField: 'sentDate',
    defaultLimit: DEFAULT_PAGE_SIZE,
  });
  const { limit, setLimit } = listState;
  const filter: MailLogFilter =
    linked ?
      compact({ mailSendJobId: linkedJob, state: linkedState })
    : compact(listState.filter);

  const [page, setPage] = useState(1);

  const setFilter = (next: MailLogFilter) => {
    listState.setFilter(compact(next));
    setPage(1);

    if (linked) {
      const params = new URLSearchParams(searchParams);
      params.delete('job');
      params.delete('state');
      setSearchParams(params, { replace: true });
    }
  };

  const updateFilter = (partial: MailLogFilter) =>
    setFilter({ ...filter, ...partial });

  const { data: templateData } = useQuery(MailTemplateDocument);

  const { data: jobData } = useQuery(MailSendJobsDocument, {
    variables: { take: JOB_OPTIONS_LIMIT },
  });
  const { data, loading } = useQuery(MailLogsDocument, {
    variables: {
      filter,
      skip: (page - 1) * limit,
      take: limit,
    },
  });

  const exportMailLogs = useTableExportQuery(
    MailLogsDocument,
    { filter },
    data => data.mailLogs
  );

  const { paperLetters } = useLetterChannel();
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

    // Letters only get a mention where some were asked about; most
    // installations print none.
    enqueueSnackbar(
      t(
        sync.lettersChecked ?
          'mailLog.sync.doneWithLetters'
        : 'mailLog.sync.done',
        {
          checked: sync.checked,
          updated: sync.updated,
          lettersChecked: sync.lettersChecked,
          lettersUpdated: sync.lettersUpdated,
        }
      ),
      { variant: sync.updated || sync.lettersUpdated ? 'success' : 'info' }
    );
  };

  const logs = data?.mailLogs.nodes ?? [];
  const totalCount = data?.mailLogs.totalCount ?? 0;

  const totalPages = Math.ceil(totalCount / limit);
  if (totalPages > 0 && page > totalPages) {
    setPage(1);
  }

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

  const filters = (
    <FilterGrid>
      <FilterField
        label={t('mailLog.filter.job')}
        info={t('mailLog.filter.jobHelp')}
      >
        {({ labelId }) => (
          <TextField
            select
            value={filter.mailSendJobId ?? ''}
            onChange={event =>
              updateFilter({ mailSendJobId: event.target.value || null })
            }
            slotProps={{ select: { displayEmpty: true, labelId } }}
            fullWidth
          >
            <MenuItem value="">{t('mailLog.filter.jobAll')}</MenuItem>

            {/* A linked send may be older than the jobs offered here. */}
            {filter.mailSendJobId &&
              !jobOptions.some(
                option => option.value === filter.mailSendJobId
              ) && (
                <MenuItem value={filter.mailSendJobId}>
                  {filter.mailSendJobId}
                </MenuItem>
              )}

            {jobOptions.map(option => (
              <MenuItem
                key={option.value}
                value={option.value}
              >
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        )}
      </FilterField>
      <FilterField label={t('mailLog.filter.template')}>
        {({ labelId }) => (
          <TextField
            select
            value={filter.mailTemplateId ?? ''}
            onChange={event =>
              updateFilter({ mailTemplateId: event.target.value || null })
            }
            slotProps={{ select: { displayEmpty: true, labelId } }}
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
        )}
      </FilterField>
      <FilterField label={t('mailLog.filter.state')}>
        {({ labelId }) => (
          <TextField
            select
            value={filter.state ?? ''}
            onChange={event =>
              updateFilter({
                state: (event.target.value as MailLogState) || null,
              })
            }
            slotProps={{ select: { displayEmpty: true, labelId } }}
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
        )}
      </FilterField>
      <FilterField label={t('mailLog.filter.channel')}>
        {({ labelId }) => (
          <TextField
            select
            value={filter.channel ?? ''}
            onChange={event =>
              updateFilter({
                channel: (event.target.value as MailChannel) || null,
              })
            }
            slotProps={{ select: { displayEmpty: true, labelId } }}
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
        )}
      </FilterField>
      <FilterField
        label={t('mailLog.filter.type')}
        hint={t('mailLog.filter.typeHint')}
      >
        {({ labelId, hintId }) => (
          <TextField
            select
            value={filter.type ?? ''}
            onChange={event =>
              updateFilter({
                type: (event.target.value as MailLogType) || null,
              })
            }
            slotProps={{
              select: {
                displayEmpty: true,
                labelId,
                SelectDisplayProps: {
                  'aria-describedby': hintId,
                } as object,
              },
            }}
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
        )}
      </FilterField>
    </FilterGrid>
  );

  return (
    <TableWrapper>
      <Toolbar>
        <Button
          variant="outlined"
          size="small"
          loading={syncing}
          onClick={runSync}
        >
          <MdSync /> {t('mailLog.sync.action')}
        </Button>
        <InfoTooltip
          text={t(
            paperLetters ? 'mailLog.sync.hintWithLetters' : 'mailLog.sync.hint'
          )}
        />
      </Toolbar>

      <DataTable<FullMailLogFragment>
        filters={filters}
        filterCount={Object.keys(filter).length}
        onResetFilters={() => setFilter({})}
        storageKey="mail-log"
        exportRows={exportMailLogs}
        exportTotalCount={totalCount}
        data={logs}
        loading={loading}
        emptyMessage={t('mailLog.empty')}
        columns={[
          {
            id: 'sentDate',
            alwaysVisible: true,
            label: t('mailLog.sentDate'),
            width: 160,
            render: log => formatDateTime(log.sentDate),
            exportValue: log => new Date(log.sentDate),
          },
          {
            id: 'recipient',
            label: t('mailLog.recipient'),
            width: 220,
            render: log => log.recipient.email,
            exportValue: log => log.recipient.email,
          },
          {
            id: 'template',
            label: t('mailLog.template'),
            width: 180,
            render: log => log.mailTemplate.name,
            exportValue: log => log.mailTemplate.name,
          },
          {
            id: 'subject',
            label: t('mailLog.subject'),
            width: 240,
            render: log => log.subject ?? '—',
            exportValue: log => log.subject,
          },
          {
            id: 'channel',
            label: t('mailLog.channel'),
            width: 160,
            render: log => (
              <MailLogChannelCell
                channel={log.channel}
                address={log.address}
              />
            ),
            exportValue: log =>
              [t(`mailLog.channels.${log.channel}`), log.address]
                .filter(Boolean)
                .join(' · '),
          },
          {
            id: 'type',
            label: t('mailLog.type'),
            width: 160,
            render: log => mailLogTypeLabel(log.type, t),
            exportValue: log => mailLogTypeLabel(log.type, t),
          },
          {
            id: 'state',
            columnLabel: t('mailLog.state'),
            label: (
              <Stack
                direction="row"
                sx={{ alignItems: 'center' }}
                spacing={0.5}
              >
                <span>{t('mailLog.state')}</span>
                <MailLogStateLegend />
              </Stack>
            ),
            width: 140,
            render: log => <MailLogStateTag state={log.state} />,
            exportValue: log => log.state,
          },
          {
            id: 'error',
            label: t('mailLog.error'),
            width: 240,
            render: log => <MailErrorCell error={log.error} />,
            exportValue: log => log.error,
          },
        ]}
      />

      <Pagination
        state={{
          page,
          limit,
          setPage,
          setLimit: limit => {
            setLimit(limit);
            setPage(1);
          },
        }}
        totalCount={totalCount}
      />
    </TableWrapper>
  );
}
