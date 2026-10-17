import { useQuery } from '@apollo/client/react';
import {
  MailAudienceInput,
  MailChannel,
  MailEmailSegment,
  MailSendRecipientsDocument,
} from '@wepublish/editor/api';
import { Pagination } from '@wepublish/ui/editor';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdCancel, MdCheckCircle } from 'react-icons/md';

/** Row tint for recipients a mail would not reach. */
export const SEGMENT_ROW_TINT: Partial<Record<MailEmailSegment, string>> = {
  [MailEmailSegment.Placeholder]: 'rgba(244, 67, 54, 0.08)',
  [MailEmailSegment.Dead]: 'rgba(244, 67, 54, 0.08)',
  [MailEmailSegment.Unresponsive]: 'rgba(255, 152, 0, 0.1)',
};

export const RECIPIENTS_PAGE_SIZE = 50;

export function RecipientListModal({
  open,
  onClose,
  audience,
  channel,
  totalCount,
}: {
  open: boolean;
  onClose: () => void;
  audience: MailAudienceInput;
  channel: MailChannel;
  totalCount: number;
}) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  // Changing the audience while the modal is closed must not leave the user on
  // a page that no longer exists.
  const [pagedAudience, setPagedAudience] = useState({ audience, channel });

  if (
    audience !== pagedAudience.audience ||
    channel !== pagedAudience.channel
  ) {
    setPagedAudience({ audience, channel });
    setPage(1);
  }

  const { data, loading, error } = useQuery(MailSendRecipientsDocument, {
    skip: !open,
    variables: {
      audience,
      channel,
      skip: (page - 1) * RECIPIENTS_PAGE_SIZE,
      take: RECIPIENTS_PAGE_SIZE,
    },
  });

  const recipients = data?.mailSendRecipients.nodes ?? [];
  // Only a letter needs an address; for a mail the column would be noise.
  const isLetter = channel === MailChannel.Letter;

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={onClose}
      maxWidth="md"
    >
      <DialogTitle>
        {t('mailSend.recipientList.title', { count: totalCount })}
      </DialogTitle>
      <DialogContent style={{ maxHeight: '65vh' }}>
        {loading && !recipients.length ?
          <span>{t('mailSend.recipientList.loading')}</span>
        : <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>{t('mailSend.recipientList.email')}</strong>
                </TableCell>
                <TableCell>
                  <strong>{t('mailSend.recipientList.name')}</strong>
                </TableCell>
                <TableCell>
                  <strong>{t('mailSend.recipientList.memberPlan')}</strong>
                </TableCell>
                <TableCell>
                  <strong>{t('mailSend.recipientList.emailSegment')}</strong>
                </TableCell>
                {isLetter && (
                  <TableCell align="center">
                    <strong>{t('mailSend.recipientList.address')}</strong>
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {recipients.map(recipient => (
                <TableRow
                  key={recipient.id}
                  sx={{
                    // for a letter the address decides; for a mail the status
                    backgroundColor:
                      isLetter ?
                        recipient.hasAddress ?
                          undefined
                        : 'rgba(244, 67, 54, 0.08)'
                      : SEGMENT_ROW_TINT[recipient.emailSegment],
                  }}
                >
                  <TableCell>{recipient.email}</TableCell>
                  <TableCell>
                    {[recipient.firstName, recipient.name]
                      .filter(Boolean)
                      .join(' ') || '—'}
                  </TableCell>
                  <TableCell>{recipient.memberPlanName ?? '—'}</TableCell>
                  <TableCell>
                    {t(`mailSend.emailSegments.${recipient.emailSegment}`)}
                  </TableCell>
                  {isLetter && (
                    <TableCell align="center">
                      {recipient.hasAddress ?
                        <MdCheckCircle
                          size={18}
                          color="#4caf50"
                          title={t('mailSend.recipientList.withAddress')}
                        />
                      : <MdCancel
                          size={18}
                          color="#f44336"
                          title={t('mailSend.recipientList.withoutAddress')}
                        />
                      }
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        }
      </DialogContent>
      <DialogActions>
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Pagination
            state={{
              page,
              limit: RECIPIENTS_PAGE_SIZE,
              setPage,
              setLimit: () => undefined /* page size was fixed here */,
            }}
            totalCount={data?.mailSendRecipients.totalCount ?? totalCount}
          />
          <Button
            variant="text"
            onClick={onClose}
          >
            {t('mailSend.cancel')}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
