import { useMutation, useQuery } from '@apollo/client/react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import {
  ConfirmAllDeliverySuggestionsDocument,
  ConfirmDeliverySuggestionDocument,
  DeliverySuggestionCountsDocument,
  DeliverySuggestionKind,
  DeliverySuggestionsDocument,
  RecomputeDeliverySuggestionsDocument,
} from '@wepublish/editor/api';
import {
  enqueueSnackbar,
  humanizeError,
  ListViewContainer,
  ListViewHeader,
  PageTitle,
  Pagination,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdRefresh } from 'react-icons/md';
import { Link } from 'react-router-dom';

const PAGE_SIZE = 50;

const showError = (error: unknown) =>
  enqueueSnackbar(humanizeError(error as never), { variant: 'error' });

/** `emailQuality:dead` → `emailQuality_dead`: a colon would be a namespace to i18next. */
const reasonKey = (reason: string) => reason.replace(':', '_');

/**
 * What the nightly step proposes: who should get letters instead of mails,
 * and who could go back. Nothing happens until an admin confirms, one by one
 * or all of a kind.
 */
export function DeliverySuggestionsPage() {
  const { t } = useTranslation();
  const [kind, setKind] = useState<DeliverySuggestionKind>(
    DeliverySuggestionKind.ToLetter
  );
  const [page, setPage] = useState(1);
  const [askAll, setAskAll] = useState(false);

  const counts = useQuery(DeliverySuggestionCountsDocument);
  const list = useQuery(DeliverySuggestionsDocument, {
    variables: { kind, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE },
  });

  const refresh = () => {
    counts.refetch();
    list.refetch();
  };

  const [confirmOne, { loading: confirmingOne }] = useMutation(
    ConfirmDeliverySuggestionDocument,
    { onCompleted: refresh, onError: showError }
  );
  const [confirmAll, { loading: confirmingAll }] = useMutation(
    ConfirmAllDeliverySuggestionsDocument,
    {
      onError: showError,
      onCompleted: ({ confirmAllDeliverySuggestions: result }) => {
        enqueueSnackbar(t('deliveryMode.confirmedAll', result), {
          variant: 'success',
          autoHideDuration: 6000,
        });
        refresh();
      },
    }
  );
  const [recompute, { loading: recomputing }] = useMutation(
    RecomputeDeliverySuggestionsDocument,
    {
      onError: showError,
      onCompleted: ({ recomputeDeliverySuggestions: result }) => {
        enqueueSnackbar(t('deliveryMode.recomputed', result), {
          variant: 'success',
          autoHideDuration: 6000,
        });
        refresh();
      },
    }
  );

  const total = counts.data?.deliverySuggestionCounts;
  const shown =
    total?.[kind === DeliverySuggestionKind.ToLetter ? 'toLetter' : 'toMail'] ??
    0;
  const nodes = list.data?.deliverySuggestions.nodes ?? [];
  const totalCount = list.data?.deliverySuggestions.totalCount ?? 0;

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('deliveryMode.suggestionsTitle')}</PageTitle>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary' }}
          >
            {t('deliveryMode.suggestionsIntro')}
          </Typography>
        </ListViewHeader>
      </ListViewContainer>

      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <Tabs
          value={kind}
          onChange={(_event, value) => {
            setKind(value as DeliverySuggestionKind);
            setPage(1);
          }}
        >
          <Tab
            value={DeliverySuggestionKind.ToLetter}
            label={t('deliveryMode.kind.toLetter', {
              count: total?.toLetter ?? 0,
            })}
          />
          <Tab
            value={DeliverySuggestionKind.ToMail}
            label={t('deliveryMode.kind.toMail', {
              count: total?.toMail ?? 0,
            })}
          />
        </Tabs>

        <Stack
          direction="row"
          spacing={1}
        >
          <Button
            variant="outlined"
            size="small"
            loading={recomputing}
            startIcon={<MdRefresh />}
            onClick={() => recompute()}
          >
            {t('deliveryMode.recompute')}
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={!shown}
            loading={confirmingAll}
            onClick={() => setAskAll(true)}
          >
            {t('deliveryMode.confirmAll', { count: shown })}
          </Button>
        </Stack>
      </Stack>

      <TableContainer sx={{ marginTop: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>{t('deliveryMode.table.user')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('deliveryMode.table.emailQuality')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('deliveryMode.table.reason')}</strong>
              </TableCell>
              <TableCell>
                <strong>{t('deliveryMode.table.since')}</strong>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {nodes.map(row => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link to={`/users/edit/${row.user.id}`}>
                    {[row.user.firstName, row.user.name]
                      .filter(Boolean)
                      .join(' ')}{' '}
                    <Box
                      component="span"
                      sx={{ color: 'text.secondary' }}
                    >
                      {row.user.email}
                    </Box>
                  </Link>
                </TableCell>
                <TableCell>
                  {row.emailQuality ?
                    `${t(`mailSend.emailSegments.${row.emailQuality.level}`)} · ${row.emailQuality.reason} · ${new Date(row.emailQuality.since).toLocaleDateString()}`
                  : '–'}
                </TableCell>
                <TableCell>
                  {t(`deliveryMode.reason.${reasonKey(row.reason)}`)}
                </TableCell>
                <TableCell>
                  {new Date(row.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <Button
                    variant="contained"
                    size="small"
                    loading={confirmingOne}
                    onClick={() => confirmOne({ variables: { id: row.id } })}
                  >
                    {t('deliveryMode.confirm')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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

      <Dialog
        open={askAll}
        onClose={() => setAskAll(false)}
      >
        <DialogTitle>{t('deliveryMode.confirmAllTitle')}</DialogTitle>
        <DialogContent>
          {t(`deliveryMode.confirmAllText.${kind}`, { count: shown })}
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
    </>
  );
}
