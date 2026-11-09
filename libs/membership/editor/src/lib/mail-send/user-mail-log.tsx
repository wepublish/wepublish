import { useQuery } from '@apollo/client/react';
import {
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { MailLogsDocument } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { deliveryChannel } from '../delivery-mode/channels';
import { useLetterChannel } from '../mail-template/use-letter-channel';
import { formatDateTime, MailLogStateTag } from './mail-log-common';

interface UserMailLogPanelProps {
  userId: string;
}

/** Shows the mails that have been sent to a single user. */
export function UserMailLogPanel({ userId }: UserMailLogPanelProps) {
  const { t } = useTranslation();
  // With letters, the log holds both channels; the feature alone decides, so
  // old letters stay labelled even once the integration is gone.
  const { paperLetters } = useLetterChannel();

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
            {paperLetters && (
              <TableCell>
                <strong>{t('mailSend.mailHistory.channel')}</strong>
              </TableCell>
            )}
            <TableCell>
              <strong>{t('mailLog.state')}</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map(log => {
            const channel = deliveryChannel(log.channel);

            return (
              <TableRow key={log.id}>
                <TableCell>{formatDateTime(log.sentDate)}</TableCell>
                <TableCell>{log.mailTemplate.name}</TableCell>
                <TableCell>{log.subject ?? '—'}</TableCell>
                {paperLetters && (
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {t(channel.labelKey)}
                  </TableCell>
                )}
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <MailLogStateTag state={log.state} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
