import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  DeleteDiscountCodeDocument,
  DiscountCodeListDocument,
  DiscountCodesort,
  FullDiscountCodeFragment,
} from '@wepublish/editor/api';
import {
  CanCreateDiscountCode,
  CanDeleteDiscountCode,
  CanGetInvoices,
  CanUpdateDiscountCode,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  IconButton,
  IconButtonTooltip,
  InfoTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  Pagination,
  TableWrapper,
  useAuthorisation,
  useListViewState,
  useTableExportQuery,
  PageTitle,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

function DiscountCodeList() {
  const { t } = useTranslation();
  const canSeeUsages = useAuthorisation(CanGetInvoices.id);
  const { sortField, sortOrder, setSort, limit, setLimit } = useListViewState(
    'discountCodes',
    { defaultSortField: '' }
  );
  const [page, setPage] = useState<number>(1);

  const [discountCodeToDelete, setDiscountCodeToDelete] = useState<
    FullDiscountCodeFragment | undefined
  >(undefined);

  const { data, loading, refetch } = useQuery(DiscountCodeListDocument, {
    variables: {
      take: limit,
      skip: (page - 1) * limit,
      sort: sortField ? (sortField as DiscountCodesort) : undefined,
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    },
  });
  const exportDiscountCodes = useTableExportQuery(
    DiscountCodeListDocument,
    {
      sort: sortField ? (sortField as DiscountCodesort) : undefined,
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    },
    data => data.discountCodes
  );
  const [deleteDiscountCode] = useMutation(DeleteDiscountCodeDocument, {
    onCompleted() {
      refetch();
    },
  });

  useEffect(() => {
    refetch({
      take: limit,
      skip: (page - 1) * limit,
    });
  }, [page, limit, refetch]);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('discountCode.overview.title')}</PageTitle>
        </ListViewHeader>

        <ListViewActions>
          <Button
            component={RouterLink}
            to="create"
            variant="contained"
            loading={false}
            startIcon={<MdAdd />}
          >
            {t('discountCode.overview.createDiscountCode')}
          </Button>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="discount-codes"
          exportRows={exportDiscountCodes}
          exportTotalCount={data?.discountCodes?.totalCount ?? 0}
          data={data?.discountCodes.nodes ?? []}
          loading={loading}
          sortColumn={sortField}
          sortOrder={sortOrder}
          onSort={(sortColumn, sortType) => {
            setSort(sortColumn, sortType);
            setPage(1);
          }}
          sortable={['discountpercent']}
          columns={[
            {
              id: 'valid',
              label: (
                <>
                  {t('discountCode.overview.valid')}{' '}
                  <InfoTooltip text={t('discountCode.overview.validInfo')} />
                </>
              ),
              width: 100,
              render: rowData =>
                (
                  new Date() > new Date(rowData.validFrom) &&
                  new Date(rowData.validTo) > new Date()
                ) ?
                  `✅`
                : `❌`,
              exportValue: rowData =>
                new Date() > new Date(rowData.validFrom) &&
                new Date(rowData.validTo) > new Date(),
            },
            {
              id: 'code',
              alwaysVisible: true,
              label: t('discountCode.overview.code'),
              width: 150,
              render: rowData => (
                <Link to={`edit/${rowData.id}`}>
                  {rowData.code.toUpperCase()}
                </Link>
              ),
              exportValue: rowData => rowData.code.toUpperCase(),
            },
            {
              id: 'discountpercent',
              label: t('discountCode.overview.discountPercent'),
              width: 100,
              render: rowData => `${rowData.discountPercent}%`,
              exportValue: rowData => rowData.discountPercent,
            },
            {
              id: 'usage',
              label: t('discountCode.overview.usage'),
              width: 160,
              render: rowData => {
                const usage = t('discountCode.overview.usageValue', {
                  total: rowData.usageCount,
                  paid: rowData.paidUsageCount,
                });

                if (!canSeeUsages) {
                  return usage;
                }

                return <Link to={`usage/${rowData.id}`}>{usage}</Link>;
              },
              exportValue: rowData =>
                t('discountCode.overview.usageValue', {
                  total: rowData.usageCount,
                  paid: rowData.paidUsageCount,
                }),
            },
            {
              id: 'memberplan',
              label: t('discountCode.overview.memberPlan'),
              width: 150,
              render: rowData => rowData.memberPlan.name,
            },
            {
              id: 'validfrom',
              label: t('discountCode.overview.validFrom'),
              width: 200,
              render: rowData =>
                `${new Date(rowData.validFrom).toDateString()}`,
              exportValue: rowData => new Date(rowData.validFrom),
            },
            {
              id: 'validto',
              label: t('discountCode.overview.validTo'),
              width: 200,
              render: rowData => `${new Date(rowData.validTo).toDateString()}`,
              exportValue: rowData => new Date(rowData.validTo),
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: discountCode => (
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    color="error"
                    size="small"
                    aria-label={t('delete')}
                    onClick={() =>
                      setDiscountCodeToDelete(
                        discountCode as FullDiscountCodeFragment
                      )
                    }
                  >
                    <MdDelete />
                  </IconButton>
                </IconButtonTooltip>
              ),
            },
          ]}
        />
      </TableWrapper>

      <Pagination
        state={{
          page,
          limit,
          setPage,
          setLimit,
        }}
        totalCount={data?.discountCodes?.totalCount ?? 0}
      />

      <Dialog
        fullWidth
        open={!!discountCodeToDelete}
        maxWidth="xs"
        onClose={() => setDiscountCodeToDelete(undefined)}
      >
        <DialogTitle>{t('discountCode.overview.areYouSure')}</DialogTitle>

        <DialogContent>
          {discountCodeToDelete &&
            t('discountCode.overview.areYouSureBody', {
              discountCode: discountCodeToDelete.code,
            })}
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setDiscountCodeToDelete(undefined)}
          >
            {t('cancel')}
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={() => {
              deleteDiscountCode({
                variables: {
                  id: discountCodeToDelete?.id ?? '',
                },
              });
              setDiscountCodeToDelete(undefined);
            }}
          >
            {t('discountCode.overview.areYouSureConfirmation')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateDiscountCode.id,
  CanUpdateDiscountCode.id,
  CanDeleteDiscountCode.id,
])(DiscountCodeList);

export { CheckedPermissionComponent as DiscountCodeList };
