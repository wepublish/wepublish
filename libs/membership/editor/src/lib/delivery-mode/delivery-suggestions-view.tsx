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
  DeliverySuggestionFilter,
  DeliverySuggestionKind,
  DeliverySuggestionReasonsDocument,
  DeliverySuggestionsDocument,
  KeepDeliverySuggestionDocument,
  RecomputeDeliverySuggestionsDocument,
} from '@wepublish/editor/api';
import {
  DateRange,
  DateRangeFilter,
  enqueueSnackbar,
  humanizeError,
  MultiSelectFilter,
  Pagination,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdRefresh } from 'react-icons/md';
import { Link } from 'react-router-dom';

import { deliveryChannel, SUGGESTION_KINDS, suggestionMove } from './channels';
import { reasonKey } from './delivery-change';

const PAGE_SIZE = 20;

/** Everything a decision changes: both cards, the counts, the overview. */
const REFRESH = [
  'DeliverySuggestions',
  'DeliverySuggestionReasons',
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
        spacing={2}
        useFlexGap
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          marginBottom: 2,
        }}
      >
        {/* Said once here, so the cards need not repeat it. */}
        <Stack
          direction="row"
          spacing={1.5}
          useFlexGap
          sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}
        >
          <Typography variant="h6">
            {t('deliveryChannel.overview.suggestionsHeading')}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary' }}
          >
            {t('deliveryChannel.suggestions.recomputedDaily')}
          </Typography>
        </Stack>

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

const NO_RANGE: DateRange = { from: null, to: null };

/** Whole days: from the start of the first to the end of the last. */
const dayRange = ({ from, to }: DateRange) => {
  const start = from && new Date(from);
  const end = to && new Date(to);
  start?.setHours(0, 0, 0, 0);
  end?.setHours(23, 59, 59, 999);

  return { from: start?.toISOString(), to: end?.toISOString() };
};

type Filters = { reasons: string[]; emailSince: DateRange; created: DateRange };

const NO_FILTERS: Filters = {
  reasons: [],
  emailSince: NO_RANGE,
  created: NO_RANGE,
};

/** The filter as the API takes it; undefined when nothing is picked. */
const toApiFilter = ({
  reasons,
  emailSince,
  created,
}: Filters): DeliverySuggestionFilter | undefined => {
  const since = dayRange(emailSince);
  const added = dayRange(created);
  const filter = Object.fromEntries(
    Object.entries({
      reasons: reasons.length ? reasons : undefined,
      emailSinceFrom: since.from,
      emailSinceTo: since.to,
      createdFrom: added.from,
      createdTo: added.to,
    }).filter(([, value]) => value !== undefined)
  );

  return Object.keys(filter).length ? filter : undefined;
};

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
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [askAll, setAskAll] = useState(false);
  const [keeping, setKeeping] = useState<Row | null>(null);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const filter = useMemo(() => toApiFilter(filters), [filters]);

  const changeFilters = (change: Partial<Filters>) => {
    setFilters(current => ({ ...current, ...change }));
    setPage(1);
  };

  const list = useQuery(DeliverySuggestionsDocument, {
    variables: { kind, skip: (page - 1) * limit, take: limit, filter },
  });
  const reasons = useQuery(DeliverySuggestionReasonsDocument, {
    variables: { kind },
  });

  // A picked reason stays listed after its suggestions are gone, so the
  // filter never hides what it does.
  const reasonOptions = useMemo(() => {
    const counts = reasons.data?.deliverySuggestionReasons ?? [];
    const gone = filters.reasons
      .filter(reason => !counts.some(entry => entry.reason === reason))
      .map(reason => ({ reason, count: 0 }));

    return [...counts, ...gone].map(({ reason, count }) => ({
      value: reason,
      label: `${t(`deliveryChannel.suggestions.reasonFilter.${reason}`, {
        defaultValue: reason,
      })} (${count})`,
    }));
  }, [reasons.data, filters.reasons, t]);

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
  // With a filter, «apply all» means all that the filter lists.
  const applyCount = filter ? totalCount : count;

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
          applyCount > 0 && (
            <Button
              variant="contained"
              size="small"
              loading={confirmingAll}
              onClick={() => setAskAll(true)}
            >
              {filter ?
                t('deliveryChannel.suggestions.confirmAllFiltered', {
                  count: applyCount,
                })
              : t('deliveryMode.confirmAll', { count: applyCount })}
            </Button>
          )
        }
      />

      <CardContent>
        {(count > 0 || filter) && (
          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            sx={{ flexWrap: 'wrap', marginBottom: 2 }}
          >
            <MultiSelectFilter
              label={t('deliveryChannel.suggestions.filter.reason')}
              options={reasonOptions}
              value={filters.reasons}
              onChange={value => changeFilters({ reasons: value })}
            />
            <Box sx={{ minWidth: 220 }}>
              <DateRangeFilter
                label={t('deliveryChannel.suggestions.filter.emailSince')}
                value={filters.emailSince}
                onChange={value => changeFilters({ emailSince: value })}
                disableFuture
              />
            </Box>
            <Box sx={{ minWidth: 220 }}>
              <DateRangeFilter
                label={t('deliveryChannel.suggestions.filter.created')}
                value={filters.created}
                onChange={value => changeFilters({ created: value })}
                disableFuture
              />
            </Box>
          </Stack>
        )}

        {!list.loading && !nodes.length ?
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary' }}
          >
            {filter ?
              t('deliveryChannel.suggestions.emptyFiltered')
            : t('deliveryChannel.suggestions.empty', {
                channel: t(to.labelKey),
              })
            }
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

        {/* Also once the size was changed, so it can be changed back. */}
        {(totalCount > limit || limit !== PAGE_SIZE) && (
          <Box sx={{ marginTop: 1.5 }}>
            <Pagination
              state={{
                page,
                limit,
                setPage,
                setLimit,
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
          {t(`deliveryMode.confirmAllText.${kind}`, { count: applyCount })}
          {filter && (
            <Typography
              variant="body2"
              sx={{ marginTop: 1, color: 'text.secondary' }}
            >
              {t('deliveryChannel.suggestions.confirmAllFilteredText')}
            </Typography>
          )}
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
              confirmAll({
                variables: filter ? { kind, filter } : { kind },
              });
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
