import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  CancelGiftCodeDocument,
  GiftCodeFilter,
  GiftCodeListDocument,
  GiftCodeListItemFragment,
  GiftCodeOfferListDocument,
  GiftCodeSort,
  GiftCodeStatus,
  MarkInvoiceAsPaidDocument,
  MemberPlanListDocument,
} from '@wepublish/editor/api';
import {
  CanCreateInvoice,
  CanGetGiftCodes,
  CanUpdateGiftCodes,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  DateRangeFilter,
  enqueueSnackbar,
  humanizeError,
  IconButton,
  IconButtonTooltip,
  Link,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  PageTitle,
  Pagination,
  TableWrapper,
  useAuthorisation,
  useListViewState,
  useTableExportQuery,
} from '@wepublish/ui/editor';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdBlock, MdPaid, MdSearch } from 'react-icons/md';

const STATUSES = [
  GiftCodeStatus.Ordered,
  GiftCodeStatus.Issued,
  GiftCodeStatus.Redeemed,
  GiftCodeStatus.Expired,
  GiftCodeStatus.Canceled,
];

const STATUS_COLORS: Record<
  GiftCodeStatus,
  'default' | 'info' | 'success' | 'warning' | 'error'
> = {
  [GiftCodeStatus.Ordered]: 'info',
  [GiftCodeStatus.Issued]: 'success',
  [GiftCodeStatus.Redeemed]: 'default',
  [GiftCodeStatus.Expired]: 'warning',
  [GiftCodeStatus.Canceled]: 'error',
};

const SORT_FIELDS: Record<string, GiftCodeSort> = {
  createdAt: GiftCodeSort.CreatedAt,
  issuedAt: GiftCodeSort.IssuedAt,
};

const OPEN_STATUSES = [GiftCodeStatus.Ordered, GiftCodeStatus.Issued];

const Filters = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  align-items: start;
  gap: 12px;

  > * {
    min-width: 0;
  }
`;

const WideFilter = styled.div`
  grid-column: span 2;

  @media (max-width: 640px) {
    grid-column: span 1;
  }
`;

const Code = styled.span`
  font-family: monospace;
  white-space: nowrap;
`;

const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 4px;
`;

type PendingAction = {
  kind: 'cancel' | 'markAsPaid';
  giftCode: GiftCodeListItemFragment;
};

const formatAmount = (amount: number, currency?: string | null) =>
  `${(amount / 100).toFixed(2)}${currency ? ` ${currency}` : ''}`;

const withoutEmpty = (filter: GiftCodeFilter) =>
  Object.fromEntries(
    Object.entries(filter).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  ) as GiftCodeFilter;

type GiftCodeListFilterProps = {
  filter: GiftCodeFilter;
  onSetFilter(filter: GiftCodeFilter): void;
};

function GiftCodeListFilter({ filter, onSetFilter }: GiftCodeListFilterProps) {
  const { t } = useTranslation();

  const { data: offerData } = useQuery(GiftCodeOfferListDocument, {
    variables: { take: 100 },
  });
  const { data: memberPlanData } = useQuery(MemberPlanListDocument, {
    variables: { take: 200 },
  });

  const updateFilter = (value: GiftCodeFilter) =>
    onSetFilter(withoutEmpty({ ...filter, ...value }));

  return (
    <Filters>
      <TextField
        label={t('giftCode.filters.search')}
        value={filter.search ?? ''}
        onChange={event => updateFilter({ search: event.target.value })}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <MdSearch />
              </InputAdornment>
            ),
          },
        }}
        fullWidth
      />

      <TextField
        select
        label={t('giftCode.filters.status')}
        value={filter.status ?? ''}
        onChange={event =>
          updateFilter({
            status: (event.target.value as GiftCodeStatus) || undefined,
          })
        }
        fullWidth
      >
        {STATUSES.map(status => (
          <MenuItem
            key={status}
            value={status}
          >
            {t(`giftCode.status.${status}`)}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label={t('giftCode.filters.offer')}
        value={filter.offerId ?? ''}
        onChange={event =>
          updateFilter({ offerId: event.target.value || undefined })
        }
        fullWidth
      >
        {(offerData?.giftCodeOffers.nodes ?? []).map(offer => (
          <MenuItem
            key={offer.id}
            value={offer.id}
          >
            {offer.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label={t('giftCode.filters.memberPlan')}
        value={filter.memberPlanId ?? ''}
        onChange={event =>
          updateFilter({ memberPlanId: event.target.value || undefined })
        }
        fullWidth
      >
        {(memberPlanData?.memberPlans.nodes ?? []).map(plan => (
          <MenuItem
            key={plan.id}
            value={plan.id}
          >
            {plan.name}
          </MenuItem>
        ))}
      </TextField>

      <WideFilter>
        <DateRangeFilter
          label={t('giftCode.filters.createdAt')}
          value={{
            from: filter.createdFrom ? new Date(filter.createdFrom) : null,
            to: filter.createdTo ? new Date(filter.createdTo) : null,
          }}
          onChange={range =>
            updateFilter({
              createdFrom: range.from?.toISOString(),
              createdTo: range.to?.toISOString(),
            })
          }
        />
      </WideFilter>
    </Filters>
  );
}

function GiftCodeList() {
  const { t } = useTranslation();
  const canUpdate = useAuthorisation(CanUpdateGiftCodes.id);
  const canMarkAsPaid = useAuthorisation(CanCreateInvoice.id);
  const { filter, setFilter, sortField, sortOrder, setSort, limit, setLimit } =
    useListViewState<GiftCodeFilter>('giftCodes', {
      defaultSortField: 'createdAt',
    });
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<PendingAction>();
  const [isDialogOpen, setDialogOpen] = useState(false);

  const ask = (action: PendingAction) => {
    setPending(action);
    setDialogOpen(true);
  };

  const activeFilter = useMemo(() => withoutEmpty(filter), [filter]);
  const sort = SORT_FIELDS[sortField];
  const order = mapTableSortTypeToGraphQLSortOrder(sortOrder);

  const { data, loading, refetch } = useQuery(GiftCodeListDocument, {
    variables: {
      filter: activeFilter,
      take: limit,
      skip: (page - 1) * limit,
      sort,
      order,
    },
  });

  const exportGiftCodes = useTableExportQuery(
    GiftCodeListDocument,
    { filter: activeFilter, sort, order },
    data => data.giftCodes
  );

  const onError = (error: Error) =>
    enqueueSnackbar(humanizeError(error), {
      variant: 'error',
      autoHideDuration: 8000,
    });

  const [cancelGiftCode, { loading: isCanceling }] = useMutation(
    CancelGiftCodeDocument,
    { onError }
  );
  const [markInvoiceAsPaid, { loading: isMarkingAsPaid }] = useMutation(
    MarkInvoiceAsPaidDocument,
    { onError }
  );

  const confirm = async () => {
    if (!pending) {
      return;
    }

    const { kind, giftCode } = pending;
    setDialogOpen(false);

    if (kind === 'cancel') {
      await cancelGiftCode({ variables: { id: giftCode.id } });
    } else if (giftCode.invoiceId) {
      await markInvoiceAsPaid({
        variables: { id: giftCode.invoiceId, sendMail: false },
      });
    }

    refetch();
  };

  const dateColumn = (
    id: string,
    label: string,
    value: (giftCode: GiftCodeListItemFragment) => string | null | undefined,
    sortKey?: string
  ) => ({
    id,
    sortKey,
    label,
    width: 140,
    render: (giftCode: GiftCodeListItemFragment) => {
      const date = value(giftCode);

      return date ? t('giftCode.list.date', { date: new Date(date) }) : '–';
    },
    exportValue: (giftCode: GiftCodeListItemFragment) => {
      const date = value(giftCode);

      return date ? new Date(date) : null;
    },
  });

  const pendingName =
    pending && (pending.giftCode.code ?? pending.giftCode.recipientName);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('giftCode.list.title')}</PageTitle>
        </ListViewHeader>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="gift-codes"
          filters={
            <GiftCodeListFilter
              filter={filter}
              onSetFilter={nextFilter => {
                setFilter(nextFilter);
                setPage(1);
              }}
            />
          }
          filterCount={Object.keys(activeFilter).length}
          onResetFilters={() => {
            setFilter({});
            setPage(1);
          }}
          exportRows={exportGiftCodes}
          exportTotalCount={data?.giftCodes.totalCount ?? 0}
          data={data?.giftCodes.nodes ?? []}
          loading={loading}
          sortColumn={sortField}
          sortOrder={sortOrder}
          onSort={(sortColumn, sortType) => {
            setSort(sortColumn, sortType);
            setPage(1);
          }}
          sortable={['createdAt', 'issuedAt']}
          columns={[
            {
              id: 'code',
              alwaysVisible: true,
              label: t('giftCode.list.code'),
              width: 170,
              render: giftCode =>
                giftCode.code ?
                  <Code>{giftCode.code}</Code>
                : <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {t('giftCode.list.noCodeYet')}
                  </Typography>,
              exportValue: giftCode => giftCode.code ?? null,
            },
            {
              id: 'status',
              label: t('giftCode.list.status'),
              width: 190,
              render: giftCode => (
                <Stack
                  direction="row"
                  spacing={0.5}
                >
                  <Chip
                    size="small"
                    color={STATUS_COLORS[giftCode.status]}
                    label={t(`giftCode.status.${giftCode.status}`)}
                  />

                  {giftCode.status === GiftCodeStatus.Issued &&
                    !giftCode.paid && (
                      <Chip
                        size="small"
                        variant="outlined"
                        color="warning"
                        label={t('giftCode.list.unpaid')}
                      />
                    )}
                </Stack>
              ),
              exportValue: giftCode => giftCode.status,
            },
            {
              id: 'paid',
              label: t('giftCode.list.paid'),
              width: 80,
              render: giftCode => (giftCode.paid ? '✅' : '❌'),
              exportValue: giftCode => giftCode.paid,
            },
            {
              id: 'buyer',
              label: t('giftCode.list.buyer'),
              width: 180,
              render: giftCode =>
                giftCode.buyer ?
                  <Link to={`/users/edit/${giftCode.buyer.id}`}>
                    {[giftCode.buyer.firstName, giftCode.buyer.name]
                      .filter(Boolean)
                      .join(' ')}
                  </Link>
                : '–',
              exportValue: giftCode =>
                giftCode.buyer ?
                  [giftCode.buyer.firstName, giftCode.buyer.name]
                    .filter(Boolean)
                    .join(' ')
                : null,
            },
            {
              id: 'buyeremail',
              label: t('giftCode.list.buyerEmail'),
              width: 220,
              render: giftCode => giftCode.buyer?.email ?? '–',
              exportValue: giftCode => giftCode.buyer?.email ?? null,
            },
            {
              id: 'recipient',
              label: t('giftCode.list.recipient'),
              width: 160,
              render: giftCode => giftCode.recipientName,
              exportValue: giftCode => giftCode.recipientName,
            },
            {
              id: 'offer',
              label: t('giftCode.list.offer'),
              width: 240,
              render: giftCode => (
                <div>
                  <Link to={`/gift-codes/offers/edit/${giftCode.offer.id}`}>
                    {giftCode.offer.name}
                  </Link>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {giftCode.memberPlan.name} ·{' '}
                    {t(
                      `memberPlanList.paymentPeriodicity.${giftCode.periodicity}`
                    )}
                  </Typography>
                </div>
              ),
              exportValue: giftCode => giftCode.offer.name,
            },
            {
              id: 'amount',
              label: t('giftCode.list.amount'),
              width: 120,
              align: 'right',
              render: giftCode =>
                formatAmount(giftCode.amount, giftCode.currency),
              exportValue: giftCode => giftCode.amount / 100,
            },
            dateColumn(
              'createdat',
              t('giftCode.list.createdAt'),
              giftCode => giftCode.createdAt,
              'createdAt'
            ),
            dateColumn(
              'issuedat',
              t('giftCode.list.issuedAt'),
              giftCode => giftCode.issuedAt,
              'issuedAt'
            ),
            dateColumn(
              'expiresat',
              t('giftCode.list.expiresAt'),
              giftCode => giftCode.expiresAt
            ),
            dateColumn(
              'redeemedat',
              t('giftCode.list.redeemedAt'),
              giftCode => giftCode.redeemedAt
            ),
            {
              id: 'canceledat',
              label: t('giftCode.list.canceledAt'),
              width: 200,
              render: giftCode =>
                giftCode.canceledAt ?
                  <div>
                    {t('giftCode.list.date', {
                      date: new Date(giftCode.canceledAt),
                    })}

                    {giftCode.cancellationReason && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {t(
                          `giftCode.cancellationReason.${giftCode.cancellationReason}`
                        )}
                      </Typography>
                    )}
                  </div>
                : '–',
              exportValue: giftCode =>
                giftCode.canceledAt ? new Date(giftCode.canceledAt) : null,
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              exportValue: false,
              render: giftCode => {
                const isOpen = OPEN_STATUSES.includes(giftCode.status);

                return (
                  <Actions>
                    {canMarkAsPaid &&
                      isOpen &&
                      !giftCode.paid &&
                      giftCode.invoiceId && (
                        <IconButtonTooltip
                          caption={t('giftCode.actions.markAsPaid')}
                        >
                          <IconButton
                            size="small"
                            color="primary"
                            aria-label={t('giftCode.actions.markAsPaid')}
                            disabled={isMarkingAsPaid}
                            onClick={() =>
                              ask({ kind: 'markAsPaid', giftCode })
                            }
                          >
                            <MdPaid />
                          </IconButton>
                        </IconButtonTooltip>
                      )}

                    {canUpdate && isOpen && (
                      <IconButtonTooltip caption={t('giftCode.actions.cancel')}>
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={t('giftCode.actions.cancel')}
                          disabled={isCanceling}
                          onClick={() => ask({ kind: 'cancel', giftCode })}
                        >
                          <MdBlock />
                        </IconButton>
                      </IconButtonTooltip>
                    )}
                  </Actions>
                );
              },
            },
          ]}
        />
      </TableWrapper>

      <Pagination
        state={{ page, limit, setPage, setLimit }}
        totalCount={data?.giftCodes.totalCount ?? 0}
      />

      <Dialog
        fullWidth
        open={isDialogOpen}
        maxWidth="xs"
        onClose={() => setDialogOpen(false)}
      >
        <DialogTitle>
          {pending?.kind === 'markAsPaid' ?
            t('giftCode.dialogs.markAsPaidTitle')
          : t('giftCode.dialogs.cancelTitle')}
        </DialogTitle>

        <DialogContent>
          {pending?.kind === 'markAsPaid' ?
            t('giftCode.dialogs.markAsPaidBody', { giftCode: pendingName })
          : t('giftCode.dialogs.cancelBody', { giftCode: pendingName })}
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setDialogOpen(false)}
          >
            {t('cancel')}
          </Button>

          {pending?.kind === 'markAsPaid' ?
            <Button
              variant="contained"
              onClick={confirm}
            >
              {t('giftCode.dialogs.markAsPaidConfirm')}
            </Button>
          : <Button
              variant="contained"
              color="error"
              onClick={confirm}
            >
              {t('giftCode.dialogs.cancelConfirm')}
            </Button>
          }
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetGiftCodes.id,
])(GiftCodeList);

export { CheckedPermissionComponent as GiftCodeList };
