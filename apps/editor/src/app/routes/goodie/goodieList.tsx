import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  DeleteGoodieDocument,
  FullGoodieFragment,
  GoodieListDocument,
  GoodieSort,
} from '@wepublish/editor/api';
import {
  CanCreateGoodie,
  CanDeleteGoodie,
  CanUpdateGoodie,
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
  useTableExportQuery,
  PageTitle,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

function GoodieList() {
  const { t } = useTranslation();
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [sortField, setSortField] = useState<GoodieSort>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [goodieToDelete, setGoodieToDelete] = useState<
    FullGoodieFragment | undefined
  >(undefined);

  const { data, loading, refetch } = useQuery(GoodieListDocument, {
    variables: {
      take: limit,
      skip: (page - 1) * limit,
      sort: sortField,
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    },
  });
  const exportGoodies = useTableExportQuery(
    GoodieListDocument,
    {
      sort: sortField,
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    },
    data => data.goodies
  );
  const [deleteGoodie] = useMutation(DeleteGoodieDocument, {
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
          <PageTitle>{t('goodie.overview.title')}</PageTitle>
        </ListViewHeader>

        <ListViewActions>
          <Button
            component={RouterLink}
            to="create"
            variant="contained"
            loading={false}
            startIcon={<MdAdd />}
          >
            {t('goodie.overview.createGoodie')}
          </Button>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="goodies"
          exportRows={exportGoodies}
          exportTotalCount={data?.goodies?.totalCount ?? 0}
          data={data?.goodies.nodes ?? []}
          loading={loading}
          sortColumn={sortField}
          sortOrder={sortOrder}
          onSort={(sortColumn, sortType) => {
            setSortOrder(sortType);
            setSortField(sortColumn as GoodieSort);
          }}
          sortable={['name', 'createdat']}
          columns={[
            {
              id: 'active',
              label: t('goodie.overview.active'),
              width: 75,
              render: rowData => (rowData.active ? `✅` : `❌`),
              exportValue: rowData => rowData.active,
            },
            {
              id: 'name',
              alwaysVisible: true,
              label: t('goodie.overview.name'),
              width: 200,
              render: rowData => (
                <Link to={`edit/${rowData.id}`}>{rowData.name}</Link>
              ),
              exportValue: rowData => rowData.name,
            },
            {
              id: 'memberplans',
              label: t('goodie.overview.memberPlans'),
              width: 250,
              render: rowData =>
                rowData.memberPlans
                  .map((memberPlan: { name: string }) => memberPlan.name)
                  .join(', '),
            },
            {
              id: 'stock',
              label: t('goodie.overview.stock'),
              width: 120,
              render: rowData =>
                rowData.stock ?? t('goodie.overview.unlimited'),
            },
            {
              id: 'availablestock',
              columnLabel: t('goodie.overview.availableStock'),
              label: (
                <>
                  {t('goodie.overview.availableStock')}{' '}
                  <InfoTooltip text={t('goodie.overview.availableStockInfo')} />
                </>
              ),
              width: 120,
              render: rowData =>
                rowData.availableStock ?? t('goodie.overview.unlimited'),
            },
            {
              id: 'createdat',
              label: t('goodie.overview.createdAt'),
              width: 200,
              render: rowData =>
                `${new Date(rowData.createdAt).toDateString()}`,
              exportValue: rowData => new Date(rowData.createdAt),
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: goodie => (
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    color="error"
                    size="small"
                    aria-label={t('delete')}
                    onClick={() =>
                      setGoodieToDelete(goodie as FullGoodieFragment)
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
        totalCount={data?.goodies?.totalCount ?? 0}
      />

      <Dialog
        fullWidth
        open={!!goodieToDelete}
        maxWidth="xs"
        onClose={() => setGoodieToDelete(undefined)}
      >
        <DialogTitle>{t('goodie.overview.areYouSure')}</DialogTitle>

        <DialogContent>
          {goodieToDelete &&
            t('goodie.overview.areYouSureBody', {
              goodie: goodieToDelete.name,
            })}
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setGoodieToDelete(undefined)}
          >
            {t('cancel')}
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={() => {
              deleteGoodie({
                variables: {
                  id: goodieToDelete?.id ?? '',
                },
              });
              setGoodieToDelete(undefined);
            }}
          >
            {t('goodie.overview.areYouSureConfirmation')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateGoodie.id,
  CanUpdateGoodie.id,
  CanDeleteGoodie.id,
])(GoodieList);

export { CheckedPermissionComponent as GoodieList };
