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
  MailLogState,
  MailLogType,
  useMailLogsQuery,
  useMailSendJobsQuery,
  useMailTemplateQuery,
} from '@wepublish/editor/api';
import styled from '@emotion/styled';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdFilterList } from 'react-icons/md';
import { useSearchParams } from 'react-router-dom';
import { Button, Pagination, Panel, SelectPicker, Stack } from 'rsuite';
import { DEFAULT_QUERY_OPTIONS } from '../common';
import {
  formatDateTime,
  MailErrorCell,
  mailLogTypeLabel,
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
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Typography
        variant="caption"
        display="block"
        style={{ marginBottom: 4, fontWeight: 600 }}
      >
        {label}
      </Typography>
      {children}
      {hint && (
        <Typography
          variant="caption"
          display="block"
          style={{ marginTop: 4, color: '#8e8e93', lineHeight: 1.35 }}
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

  const { data: templateData } = useMailTemplateQuery(DEFAULT_QUERY_OPTIONS());
  const { data: jobData } = useMailSendJobsQuery({
    ...DEFAULT_QUERY_OPTIONS(),
    variables: { take: JOB_OPTIONS_LIMIT },
  });
  const { data } = useMailLogsQuery({
    ...DEFAULT_QUERY_OPTIONS(),
    variables: {
      filter: {
        mailTemplateId: templateId ?? undefined,
        state: state ?? undefined,
        type: type ?? undefined,
        mailSendJobId: jobId ?? undefined,
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    },
  });

  const logs = data?.mailLogs.nodes ?? [];
  const totalCount = data?.mailLogs.totalCount ?? 0;

  const stateOptions = Object.values(MailLogState).map(value => ({
    label: value,
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

  const hasFilters = !!(jobId || templateId || state || type);

  const resetFilters = () => {
    setPage(1);
    setTemplateId(null);
    setState(null);
    setType(null);
    setSearchParams({});
  };

  return (
    <>
      <Panel
        bordered
        style={{ marginTop: 16, marginBottom: 16 }}
        header={
          <Stack
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack
              spacing={8}
              alignItems="center"
            >
              <MdFilterList />
              <span>{t('mailLog.filter.title')}</span>
            </Stack>
            {hasFilters && (
              <Button
                size="xs"
                appearance="link"
                onClick={resetFilters}
              >
                {t('mailLog.filter.reset')}
              </Button>
            )}
          </Stack>
        }
      >
        <FilterGrid>
          <FilterField label={t('mailLog.filter.job')}>
            <SelectPicker
              block
              data={jobOptions}
              value={jobId}
              onChange={selectJob}
              placeholder={t('mailLog.filter.jobAll')}
            />
          </FilterField>
          <FilterField label={t('mailLog.filter.template')}>
            <SelectPicker
              block
              data={templateOptions}
              value={templateId}
              onChange={resetPageThen(setTemplateId)}
              placeholder={t('mailLog.filter.all')}
            />
          </FilterField>
          <FilterField label={t('mailLog.filter.state')}>
            <SelectPicker
              block
              searchable={false}
              data={stateOptions}
              value={state}
              onChange={resetPageThen(setState)}
              placeholder={t('mailLog.filter.all')}
            />
          </FilterField>
          <FilterField
            label={t('mailLog.filter.type')}
            hint={t('mailLog.filter.typeHint')}
          >
            <SelectPicker
              block
              searchable={false}
              data={typeOptions}
              value={type}
              onChange={resetPageThen(setType)}
              placeholder={t('mailLog.filter.all')}
              // Manual vs. the three automatic origins is not self-evident
              // from the label alone, so spell each one out in the menu.
              renderOption={(label, item) => (
                <div style={{ paddingBlock: 2 }}>
                  <div>{label}</div>
                  <Typography
                    variant="caption"
                    display="block"
                    style={{
                      color: '#8e8e93',
                      whiteSpace: 'normal',
                      lineHeight: 1.35,
                    }}
                  >
                    {(item as MailTypeOption).description}
                  </Typography>
                </div>
              )}
            />
          </FilterField>
        </FilterGrid>
      </Panel>

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
                <strong>{t('mailLog.type')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('mailLog.state')}</strong>
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
        style={{ marginTop: 16 }}
        prev
        next
        maxButtons={7}
        size="sm"
        total={totalCount}
        limit={PAGE_SIZE}
        activePage={page}
        onChangePage={setPage}
      />
    </>
  );
}
