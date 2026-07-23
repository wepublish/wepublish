import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  MailLogState,
  MailLogType,
  useMailLogsQuery,
  useMailTemplateQuery,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  ListViewContainer,
  ListViewHeader,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pagination, SelectPicker, Stack } from 'rsuite';
import { DEFAULT_QUERY_OPTIONS } from '../common';
import {
  formatDateTime,
  mailLogTypeLabel,
  MailLogStateTag,
} from './mail-log-common';

const PAGE_SIZE = 50;

function MailLogList() {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [state, setState] = useState<MailLogState | null>(null);
  const [type, setType] = useState<MailLogType | null>(null);

  const { data: templateData } = useMailTemplateQuery(DEFAULT_QUERY_OPTIONS());
  const { data } = useMailLogsQuery({
    ...DEFAULT_QUERY_OPTIONS(),
    variables: {
      filter: {
        mailTemplateId: templateId ?? undefined,
        state: state ?? undefined,
        type: type ?? undefined,
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
    value,
  }));
  const templateOptions = (templateData?.mailTemplates ?? []).map(template => ({
    label: template.name,
    value: template.id,
  }));

  const resetPageThen =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setPage(1);
      setter(value);
    };

  return (
    <div style={{ flexShrink: 0 }}>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('mailLog.title')}</h2>
        </ListViewHeader>
      </ListViewContainer>

      <Stack
        spacing={12}
        style={{ marginTop: 16, marginBottom: 16 }}
      >
        <SelectPicker
          data={templateOptions}
          value={templateId}
          onChange={resetPageThen(setTemplateId)}
          placeholder={t('mailLog.filter.template')}
          style={{ width: 220 }}
        />
        <SelectPicker
          data={stateOptions}
          value={state}
          onChange={resetPageThen(setState)}
          placeholder={t('mailLog.filter.state')}
          style={{ width: 180 }}
        />
        <SelectPicker
          data={typeOptions}
          value={type}
          onChange={resetPageThen(setType)}
          placeholder={t('mailLog.filter.type')}
          style={{ width: 180 }}
        />
      </Stack>

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
    </div>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MAIL-LOGS',
])(MailLogList);
export { CheckedPermissionComponent as MailLogList };
