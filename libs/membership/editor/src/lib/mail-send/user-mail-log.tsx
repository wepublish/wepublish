import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useMailLogsQuery } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { Message } from 'rsuite';
import { DEFAULT_QUERY_OPTIONS } from '../common';
import { formatDateTime, MailLogStateTag } from './mail-log-common';

interface UserMailLogPanelProps {
  userId: string;
}

/** Shows the mails that have been sent to a single user. */
export function UserMailLogPanel({ userId }: UserMailLogPanelProps) {
  const { t } = useTranslation();

  const { data } = useMailLogsQuery({
    ...DEFAULT_QUERY_OPTIONS(),
    variables: { filter: { recipientId: userId }, take: 20 },
  });

  const logs = data?.mailLogs.nodes ?? [];

  if (logs.length === 0) {
    return <Message type="info">{t('mailLog.empty')}</Message>;
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>
              <strong>{t('mailLog.sentDate')}</strong>
            </TableCell>
            <TableCell>
              <strong>{t('mailLog.template')}</strong>
            </TableCell>
            <TableCell>
              <strong>{t('mailLog.subject')}</strong>
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
              <TableCell>{log.mailTemplate.name}</TableCell>
              <TableCell>{log.subject ?? '—'}</TableCell>
              <TableCell>
                <MailLogStateTag state={log.state} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
