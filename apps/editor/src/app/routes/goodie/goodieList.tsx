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
  IconButton,
  IconButtonTooltip,
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  PaddedCell,
  Pagination,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Table as RTable } from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';

const { Column, HeaderCell, Cell: RCell } = RTable;

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
          <h2>{t('goodie.overview.title')}</h2>
        </ListViewHeader>

        <ListViewActions>
          <Link to="create">
            <Button
              variant="contained"
              loading={false}
              startIcon={<MdAdd />}
            >
              {t('goodie.overview.createGoodie')}
            </Button>
          </Link>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={loading}
          data={data?.goodies.nodes ?? []}
          sortColumn={sortField}
          sortType={sortOrder}
          onSortColumn={(sortColumn, sortType) => {
            setSortOrder(sortType ?? 'asc');
            setSortField(sortColumn as GoodieSort);
          }}
        >
          <Column
            width={75}
            resizable
          >
            <HeaderCell>{t('goodie.overview.active')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<FullGoodieFragment>) =>
                rowData.active ? `✅` : `❌`
              }
            </RCell>
          </Column>

          <Column
            width={200}
            resizable
            sortable
          >
            <HeaderCell>{t('goodie.overview.name')}</HeaderCell>

            <RCell dataKey={GoodieSort.Name}>
              {(rowData: RowDataType<FullGoodieFragment>) => (
                <Link to={`edit/${rowData.id}`}>{rowData.name}</Link>
              )}
            </RCell>
          </Column>

          <Column
            width={250}
            resizable
          >
            <HeaderCell>{t('goodie.overview.memberPlans')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<FullGoodieFragment>) =>
                rowData.memberPlans
                  .map((memberPlan: { name: string }) => memberPlan.name)
                  .join(', ')
              }
            </RCell>
          </Column>

          <Column
            width={120}
            resizable
          >
            <HeaderCell>{t('goodie.overview.stock')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<FullGoodieFragment>) =>
                rowData.stock ?? t('goodie.overview.unlimited')
              }
            </RCell>
          </Column>

          <Column
            width={120}
            resizable
          >
            <HeaderCell>
              {t('goodie.overview.availableStock')}{' '}
              <InfoTooltip text={t('goodie.overview.availableStockInfo')} />
            </HeaderCell>

            <RCell>
              {(rowData: RowDataType<FullGoodieFragment>) =>
                rowData.availableStock ?? t('goodie.overview.unlimited')
              }
            </RCell>
          </Column>

          <Column
            width={200}
            resizable
            sortable
          >
            <HeaderCell>{t('goodie.overview.createdAt')}</HeaderCell>

            <RCell dataKey={GoodieSort.CreatedAt}>
              {(rowData: FullGoodieFragment) =>
                `${new Date(rowData.createdAt).toDateString()}`
              }
            </RCell>
          </Column>

          <Column
            width={100}
            align="center"
            fixed="right"
          >
            <HeaderCell align="center">{t('action')}</HeaderCell>
            <PaddedCell>
              {(goodie: RowDataType<FullGoodieFragment>) => (
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
              )}
            </PaddedCell>
          </Column>
        </Table>
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

          <Button
            variant="text"
            onClick={() => setGoodieToDelete(undefined)}
          >
            {t('cancel')}
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
