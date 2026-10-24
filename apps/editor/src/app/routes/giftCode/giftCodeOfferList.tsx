import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  DeleteGiftCodeOfferDocument,
  FullGiftCodeOfferFragment,
  GiftCodeOfferListDocument,
  GiftCodeOfferSort,
} from '@wepublish/editor/api';
import {
  CanDeleteGiftCodes,
  CanGetGiftCodes,
  CanUpdateGiftCodes,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  enqueueSnackbar,
  humanizeError,
  IconButton,
  IconButtonTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  PageTitle,
  Pagination,
  PermissionControl,
  TableWrapper,
  useListViewState,
  useTableExportQuery,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

const SORT_FIELDS: Record<string, GiftCodeOfferSort> = {
  name: GiftCodeOfferSort.Name,
  createdAt: GiftCodeOfferSort.CreatedAt,
  modifiedAt: GiftCodeOfferSort.ModifiedAt,
};

const formatAmount = (amount: number, currency: string) =>
  `${(amount / 100).toFixed(2)} ${currency}`;

function GiftCodeOfferList() {
  const { t } = useTranslation();
  const { sortField, sortOrder, setSort, limit, setLimit } = useListViewState(
    'giftCodeOffers',
    { defaultSortField: 'modifiedAt' }
  );
  const [page, setPage] = useState(1);
  const [offerToDelete, setOfferToDelete] =
    useState<FullGiftCodeOfferFragment>();

  const sort = SORT_FIELDS[sortField];
  const order = mapTableSortTypeToGraphQLSortOrder(sortOrder);

  const { data, loading, refetch } = useQuery(GiftCodeOfferListDocument, {
    variables: {
      take: limit,
      skip: (page - 1) * limit,
      sort,
      order,
    },
  });

  const exportOffers = useTableExportQuery(
    GiftCodeOfferListDocument,
    { sort, order },
    data => data.giftCodeOffers
  );

  const [deleteOffer] = useMutation(DeleteGiftCodeOfferDocument, {
    onError: error =>
      enqueueSnackbar(humanizeError(error), {
        variant: 'error',
        autoHideDuration: 8000,
      }),
    onCompleted: () => refetch(),
  });

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('giftCodeOffer.overview.title')}</PageTitle>
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={[CanUpdateGiftCodes.id]}>
          <ListViewActions>
            <Button
              component={RouterLink}
              to="create"
              variant="contained"
              startIcon={<MdAdd />}
            >
              {t('giftCodeOffer.overview.createOffer')}
            </Button>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="gift-code-offers"
          exportRows={exportOffers}
          exportTotalCount={data?.giftCodeOffers.totalCount ?? 0}
          data={data?.giftCodeOffers.nodes ?? []}
          loading={loading}
          sortColumn={sortField}
          sortOrder={sortOrder}
          onSort={(sortColumn, sortType) => {
            setSort(sortColumn, sortType);
            setPage(1);
          }}
          sortable={['name', 'createdAt', 'modifiedAt']}
          columns={[
            {
              id: 'active',
              label: t('giftCodeOffer.overview.active'),
              width: 90,
              render: offer => (offer.active ? '✅' : '❌'),
              exportValue: offer => offer.active,
            },
            {
              id: 'name',
              sortKey: 'name',
              alwaysVisible: true,
              label: t('giftCodeOffer.overview.name'),
              width: 220,
              render: offer => (
                <Link to={`edit/${offer.id}`}>{offer.name}</Link>
              ),
              exportValue: offer => offer.name,
            },
            {
              id: 'memberplan',
              label: t('giftCodeOffer.overview.memberPlan'),
              width: 180,
              render: offer => offer.memberPlan.name,
              exportValue: offer => offer.memberPlan.name,
            },
            {
              id: 'periodicity',
              label: t('giftCodeOffer.overview.periodicity'),
              width: 140,
              render: offer =>
                t(`memberPlanList.paymentPeriodicity.${offer.periodicity}`),
            },
            {
              id: 'price',
              label: t('giftCodeOffer.overview.price'),
              width: 120,
              align: 'right',
              render: offer =>
                formatAmount(offer.price.amount, offer.price.currency),
              exportValue: offer => offer.price.amount / 100,
            },
            {
              id: 'redemptionwindow',
              label: t('giftCodeOffer.overview.redemptionWindow'),
              width: 160,
              render: offer =>
                offer.redemptionWindowMonths != null ?
                  t('giftCodeOffer.overview.months', {
                    count: offer.redemptionWindowMonths,
                  })
                : t('giftCodeOffer.overview.unlimited'),
              exportValue: offer => offer.redemptionWindowMonths,
            },
            {
              id: 'issuebeforepayment',
              label: t('giftCodeOffer.overview.issueBeforePayment'),
              width: 160,
              render: offer => (offer.issueBeforePayment ? '✅' : '❌'),
              exportValue: offer => offer.issueBeforePayment,
            },
            {
              id: 'paymentmethods',
              label: t('giftCodeOffer.overview.paymentMethods'),
              width: 200,
              render: offer =>
                offer.paymentMethods.map(method => method.name).join(', '),
            },
            {
              id: 'modifiedat',
              sortKey: 'modifiedAt',
              label: t('giftCodeOffer.overview.modifiedAt'),
              width: 200,
              render: offer =>
                t('giftCodeOffer.overview.modifiedAtDate', {
                  modifiedAt: new Date(offer.modifiedAt),
                }),
              exportValue: offer => new Date(offer.modifiedAt),
            },
            {
              id: 'action',
              label: t('action'),
              width: 90,
              align: 'center',
              fixed: true,
              exportValue: false,
              render: offer => (
                <PermissionControl
                  qualifyingPermissions={[CanDeleteGiftCodes.id]}
                >
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      color="error"
                      size="small"
                      aria-label={t('delete')}
                      onClick={() =>
                        setOfferToDelete(offer as FullGiftCodeOfferFragment)
                      }
                    >
                      <MdDelete />
                    </IconButton>
                  </IconButtonTooltip>
                </PermissionControl>
              ),
            },
          ]}
        />
      </TableWrapper>

      <Pagination
        state={{ page, limit, setPage, setLimit }}
        totalCount={data?.giftCodeOffers.totalCount ?? 0}
      />

      <Dialog
        fullWidth
        open={!!offerToDelete}
        maxWidth="xs"
        onClose={() => setOfferToDelete(undefined)}
      >
        <DialogTitle>{t('giftCodeOffer.overview.areYouSure')}</DialogTitle>

        <DialogContent>
          {offerToDelete &&
            t('giftCodeOffer.overview.areYouSureBody', {
              offer: offerToDelete.name,
            })}
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setOfferToDelete(undefined)}
          >
            {t('cancel')}
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (offerToDelete) {
                deleteOffer({ variables: { id: offerToDelete.id } });
              }

              setOfferToDelete(undefined);
            }}
          >
            {t('giftCodeOffer.overview.areYouSureConfirmation')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetGiftCodes.id,
  CanUpdateGiftCodes.id,
  CanDeleteGiftCodes.id,
])(GiftCodeOfferList);

export { CheckedPermissionComponent as GiftCodeOfferList };
