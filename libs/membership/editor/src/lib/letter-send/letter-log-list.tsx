import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  LetterLogState,
  useCancelLetterMutation,
  useDispatchLetterMutation,
  useLetterLogsQuery,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
} from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdCancel, MdSend } from 'react-icons/md';
import { Button, SelectPicker, Stack, Tag } from 'rsuite';
import { DEFAULT_MUTATION_OPTIONS, DEFAULT_QUERY_OPTIONS } from '../common';
import { useState } from 'react';

const STATE_COLORS: Record<
  LetterLogState,
  'green' | 'blue' | 'orange' | 'red' | 'violet'
> = {
  [LetterLogState.Pending]: 'orange',
  [LetterLogState.Submitted]: 'blue',
  [LetterLogState.Accepted]: 'blue',
  [LetterLogState.Dispatched]: 'violet',
  [LetterLogState.Delivered]: 'green',
  [LetterLogState.Undeliverable]: 'red',
  [LetterLogState.Rejected]: 'red',
  [LetterLogState.Canceled]: 'orange',
};

/** States a letter can still be sent or called back from. */
const HOLDING_STATES: LetterLogState[] = [
  LetterLogState.Accepted,
  LetterLogState.Submitted,
];

function LetterLogList() {
  const { t } = useTranslation();
  const [state, setState] = useState<LetterLogState | null>(null);

  const { data, refetch } = useLetterLogsQuery({
    ...DEFAULT_QUERY_OPTIONS(),
    variables: { take: 100, state },
  });

  const [dispatchLetter, { loading: dispatching }] = useDispatchLetterMutation(
    DEFAULT_MUTATION_OPTIONS(t)
  );
  const [cancelLetter, { loading: canceling }] = useCancelLetterMutation(
    DEFAULT_MUTATION_OPTIONS(t)
  );

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleString('de-CH') : '—';

  return (
    <>
      <Stack justifyContent="space-between">
        <ListViewContainer>
          <ListViewHeader>
            <h2>{t('letterLog.title')}</h2>
          </ListViewHeader>
        </ListViewContainer>

        <SelectPicker
          data={Object.values(LetterLogState).map(value => ({
            label: t(`letterLog.states.${value}`),
            value,
          }))}
          value={state}
          onChange={value => setState((value as LetterLogState) ?? null)}
          placeholder={t('letterLog.allStates')}
          style={{ width: 220 }}
        />
      </Stack>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('letterLog.created')}</TableCell>
              <TableCell>{t('letterLog.state')}</TableCell>
              <TableCell>{t('letterLog.recipient')}</TableCell>
              <TableCell>{t('letterLog.pages')}</TableCell>
              <TableCell>{t('letterLog.tracking')}</TableCell>
              <TableCell align="right">{t('letterLog.actions')}</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data?.letterLogs.map(letterLog => (
              <TableRow key={letterLog.id}>
                <TableCell>{formatDate(letterLog.createdAt)}</TableCell>

                <TableCell>
                  <Tag color={STATE_COLORS[letterLog.state]}>
                    {t(`letterLog.states.${letterLog.state}`)}
                  </Tag>
                  {letterLog.error && (
                    <div style={{ color: '#d9534f', fontSize: '0.85em' }}>
                      {letterLog.error}
                    </div>
                  )}
                </TableCell>

                <TableCell>{letterLog.recipientID}</TableCell>
                <TableCell>{letterLog.pageCount ?? '—'}</TableCell>
                <TableCell>{letterLog.trackingNumber ?? '—'}</TableCell>

                <TableCell align="right">
                  {HOLDING_STATES.includes(letterLog.state) && (
                    <PermissionControl
                      qualifyingPermissions={['CAN_SEND_TEST_MAIL_TEMPLATES']}
                    >
                      <Button
                        size="xs"
                        appearance="primary"
                        loading={dispatching}
                        startIcon={<MdSend />}
                        onClick={async () => {
                          await dispatchLetter({
                            variables: { id: letterLog.id },
                          });
                          refetch();
                        }}
                      >
                        {t('letterLog.dispatch')}
                      </Button>

                      <Button
                        size="xs"
                        appearance="ghost"
                        color="red"
                        loading={canceling}
                        startIcon={<MdCancel />}
                        style={{ marginLeft: 8 }}
                        onClick={async () => {
                          await cancelLetter({
                            variables: { id: letterLog.id },
                          });
                          refetch();
                        }}
                      >
                        {t('letterLog.cancel')}
                      </Button>
                    </PermissionControl>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MAIL_TEMPLATES',
])(LetterLogList);

export { CheckedPermissionComponent as LetterLogList };
