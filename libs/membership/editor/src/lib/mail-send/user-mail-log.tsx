import { useQuery } from '@apollo/client/react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import { MailLogsDocument } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { formatDateTime, MailLogStateTag } from './mail-log-common';

interface UserMailLogPanelProps {
  userId: string;
}

/** Shows the mails that have been sent to a single user. */
export function UserMailLogPanel({ userId }: UserMailLogPanelProps) {
  const { t } = useTranslation();

  const { data } = useQuery(MailLogsDocument, {
    variables: { filter: { recipientId: userId }, take: 20 },
  });

  const logs = data?.mailLogs.nodes ?? [];

  if (logs.length === 0) {
    return <Alert severity="info">{t('mailLog.empty')}</Alert>;
  }

  return (
    <TableContainer
      sx={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 300 }}
    >
      <Table
        size="small"
        stickyHeader
      >
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
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                <MailLogStateTag state={log.state} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
