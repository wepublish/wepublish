import { useMutation, useQuery } from '@apollo/client/react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ConfirmAllDeliverySuggestionsDocument,
  ConfirmDeliverySuggestionDocument,
  DeliverySuggestionCountsDocument,
  DeliverySuggestionKind,
  DeliverySuggestionsDocument,
  KeepDeliverySuggestionDocument,
  RecomputeDeliverySuggestionsDocument,
} from '@wepublish/editor/api';
import {
  enqueueSnackbar,
  humanizeError,
  Pagination,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdRefresh } from 'react-icons/md';
import { Link } from 'react-router-dom';

import { deliveryChannel, SUGGESTION_KINDS, suggestionMove } from './channels';
import { reasonKey } from './delivery-change';

const PAGE_SIZE = 20;

/** Everything a decision changes: both cards, the counts, the overview. */
const REFRESH = [
  'DeliverySuggestions',
  'DeliverySuggestionCounts',
  'DeliveryChannelCounts',
  'UsersByDeliveryChannel',
];

const showError = (error: unknown) =>
  enqueueSnackbar(humanizeError(error as never), { variant: 'error' });

const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

const fullName = (user: { firstName?: string | null; name: string }) =>
  [user.firstName, user.name].filter(Boolean).join(' ');

/**
 * What the nightly run proposes, one card per move. Nothing changes until
 * someone applies a suggestion (Übernehmen) or answers it with «stay»
 * (Beibehalten), one by one or all of a move.
 */
export function DeliverySuggestionsView() {
  const { t } = useTranslation();
  const canManage = useAuthorisation('CAN_MANAGE_USER-DELIVERY-MODE');
  const { data } = useQuery(DeliverySuggestionCountsDocument);
  const [recompute, { loading: recomputing }] = useMutation(
    RecomputeDeliverySuggestionsDocument,
    {
      refetchQueries: REFRESH,
      onError: showError,
      onCompleted: ({ recomputeDeliverySuggestions: result }) =>
        enqueueSnackbar(t('deliveryMode.recomputed', result), {
          variant: 'success',
          autoHideDuration: 6000,
        }),
    }
  );

  return (
    <div>
      <Stack
        direction="row"
        sx={{ justifyContent: 'flex-end', marginBottom: 2 }}
      >
        {canManage ?
          <Button
            variant="outlined"
            size="small"
            loading={recomputing}
            startIcon={<MdRefresh />}
            onClick={() => recompute({})}
          >
            {t('deliveryMode.recompute')}
          </Button>
        : <Typography
            variant="body2"
            sx={{ color: 'text.secondary' }}
          >
            {t('deliveryChannel.suggestions.readOnly')}
          </Typography>
        }
      </Stack>

      <Stack spacing={3}>
        {SUGGESTION_KINDS.map(kind => (
          <SuggestionCard
            key={kind}
            kind={kind}
            count={data?.deliverySuggestionCounts[kind] ?? 0}
            canManage={!!canManage}
          />
        ))}
      </Stack>
    </div>
  );
}

type Row = {
  id: string;
  user: { id: string; email: string; name: string; firstName?: string | null };
};

function SuggestionCard({
  kind,
  count,
  canManage,
}: {
  kind: DeliverySuggestionKind;
  count: number;
  canManage: boolean;
}) {
  const { t } = useTranslation();
  const move = suggestionMove(kind);
  const from = deliveryChannel(move.from);
  const to = deliveryChannel(move.to);

  const [page, setPage] = useState(1);
  const [askAll, setAskAll] = useState(false);
  const [keeping, setKeeping] = useState<Row | null>(null);

  const list = useQuery(DeliverySuggestionsDocument, {
    variables: { kind, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE },
  });

  const [confirmOne, { loading: confirming }] = useMutation(
    ConfirmDeliverySuggestionDocument,
    { refetchQueries: REFRESH, onError: showError }
  );
  const [keep, { loading: keepLoading }] = useMutation(
    KeepDeliverySuggestionDocument,
    { refetchQueries: REFRESH, onError: showError }
  );
  const [confirmAll, { loading: confirmingAll }] = useMutation(
    ConfirmAllDeliverySuggestionsDocument,
    {
      refetchQueries: REFRESH,
      onError: showError,
      onCompleted: ({ confirmAllDeliverySuggestions: result }) =>
        enqueueSnackbar(t('deliveryMode.confirmedAll', result), {
          variant: 'success',
          autoHideDuration: 6000,
        }),
    }
  );

  const nodes = list.data?.deliverySuggestions.nodes ?? [];
  const totalCount = list.data?.deliverySuggestions.totalCount ?? 0;

  return (
    <Card variant="outlined">
      <CardHeader
        title={t('deliveryChannel.suggestions.cardTitle', {
          move: t(to.switchToKey),
          count,
        })}
        slotProps={{ title: { variant: 'h6' } }}
        action={
          canManage &&
          count > 0 && (
            <Button
              variant="contained"
              size="small"
              loading={confirmingAll}
              onClick={() => setAskAll(true)}
            >
              {t('deliveryMode.confirmAll', { count })}
            </Button>
          )
        }
      />

      <CardContent>
        {!list.loading && !nodes.length ?
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary' }}
          >
            {t('deliveryChannel.suggestions.empty', {
              channel: t(to.labelKey),
            })}
          </Typography>
        : <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>{t('deliveryMode.table.user')}</strong>
                  </TableCell>
                  <TableCell>
                    <strong>{t('deliveryMode.table.reason')}</strong>
                  </TableCell>
                  <TableCell>
                    <strong>{t('deliveryMode.table.emailQuality')}</strong>
                  </TableCell>
                  <TableCell>
                    <strong>{t('deliveryMode.table.since')}</strong>
                  </TableCell>
                  {canManage && <TableCell />}
                </TableRow>
              </TableHead>
              <TableBody>
                {nodes.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link to={`/users/edit/${row.user.id}`}>
                        {fullName(row.user)}{' '}
                        <Box
                          component="span"
                          sx={{ color: 'text.secondary' }}
                        >
                          {row.user.email}
                        </Box>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t(
                          `deliveryMode.reason.${reasonKey(row.reason)}`
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      {row.emailQuality ?
                        <Tooltip title={row.emailQuality.reason}>
                          <span>
                            {t(
                              `deliveryChannel.suggestions.emailStatus.${row.emailQuality.level}`,
                              { date: formatDate(row.emailQuality.since) }
                            )}
                          </span>
                        </Tooltip>
                      : '–'}
                    </TableCell>
                    <TableCell>{formatDate(row.createdAt)}</TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ justifyContent: 'flex-end' }}
                        >
                          <Button
                            variant="outlined"
                            size="small"
                            loading={confirming}
                            onClick={() =>
                              confirmOne({ variables: { id: row.id } })
                            }
                          >
                            {t('deliveryMode.confirm')}
                          </Button>
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => setKeeping(row)}
                          >
                            {t('deliveryChannel.suggestions.keep')}
                          </Button>
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        }

        {totalCount > PAGE_SIZE && (
          <Box sx={{ marginTop: 1.5 }}>
            <Pagination
              state={{
                page,
                limit: PAGE_SIZE,
                setPage,
                setLimit: () => undefined /* page size is fixed here */,
              }}
              totalCount={totalCount}
            />
          </Box>
        )}
      </CardContent>

      <Dialog
        open={askAll}
        onClose={() => setAskAll(false)}
      >
        <DialogTitle>{t('deliveryMode.confirmAllTitle')}</DialogTitle>
        <DialogContent>
          {t(`deliveryMode.confirmAllText.${kind}`, { count })}
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            onClick={() => setAskAll(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setAskAll(false);
              confirmAll({ variables: { kind } });
            }}
          >
            {t('deliveryMode.confirmAllYes')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Keeping is a manual decision: the nightly run never proposes this
          person again, in either direction. Say so before it happens. */}
      <Dialog
        open={!!keeping}
        onClose={() => setKeeping(null)}
      >
        <DialogTitle>{t('deliveryChannel.suggestions.keepTitle')}</DialogTitle>
        <DialogContent>
          {keeping &&
            t('deliveryChannel.suggestions.keepText', {
              name: fullName(keeping.user),
              channel: t(from.labelKey),
            })}
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            onClick={() => setKeeping(null)}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            loading={keepLoading}
            onClick={() => {
              const id = keeping?.id;
              setKeeping(null);

              if (id) {
                keep({ variables: { id } });
              }
            }}
          >
            {t('deliveryChannel.suggestions.keepYes')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
