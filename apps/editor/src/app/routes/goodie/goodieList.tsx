import styled from '@emotion/styled';
import {
  Goodie,
  GoodieSort,
  useDeleteGoodieMutation,
  useGoodieListQuery,
} from '@wepublish/editor/api';
import {
  CanCreateGoodie,
  CanDeleteGoodie,
  CanUpdateGoodie,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  PaddedCell,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link } from 'react-router-dom';
import {
  Button,
  IconButton as RIconButton,
  Modal,
  Pagination,
  Table as RTable,
} from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';

const IconButton = styled(RIconButton)`
  margin-left: 12px;
`;

const { Column, HeaderCell, Cell: RCell } = RTable;

function GoodieList() {
  const { t } = useTranslation();
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [sortField, setSortField] = useState<GoodieSort>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [goodieToDelete, setGoodieToDelete] = useState<Goodie | undefined>(
    undefined
  );

  const { data, loading, refetch } = useGoodieListQuery({
    variables: {
      take: limit,
      skip: (page - 1) * limit,
      sort: sortField,
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    },
  });
  const [deleteGoodie] = useDeleteGoodieMutation({
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
            <IconButton
              appearance="primary"
              loading={false}
            >
              <MdAdd />
              {t('goodie.overview.createGoodie')}
            </IconButton>
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
              {(rowData: RowDataType<Goodie>) => (rowData.active ? `✅` : `❌`)}
            </RCell>
          </Column>

          <Column
            width={200}
            resizable
            sortable
          >
            <HeaderCell>{t('goodie.overview.name')}</HeaderCell>

            <RCell dataKey={GoodieSort.Name}>
              {(rowData: RowDataType<Goodie>) => (
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
              {(rowData: RowDataType<Goodie>) =>
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
              {(rowData: RowDataType<Goodie>) =>
                rowData.stock ?? t('goodie.overview.unlimited')
              }
            </RCell>
          </Column>

          <Column
            width={120}
            resizable
          >
            <HeaderCell>{t('goodie.overview.availableStock')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<Goodie>) =>
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
              {(rowData: Goodie) =>
                `${new Date(rowData.createdAt).toDateString()}`
              }
            </RCell>
          </Column>

          <Column
            resizable
            fixed="right"
          >
            <HeaderCell align={'center'}>{t('delete')}</HeaderCell>
            <PaddedCell align={'center'}>
              {(goodie: RowDataType<Goodie>) => (
                <IconButton
                  icon={<MdDelete />}
                  circle
                  appearance="ghost"
                  color="red"
                  size="sm"
                  onClick={() => setGoodieToDelete(goodie as Goodie)}
                />
              )}
            </PaddedCell>
          </Column>
        </Table>
      </TableWrapper>

      <Pagination
        limit={limit}
        limitOptions={DEFAULT_TABLE_PAGE_SIZES}
        maxButtons={DEFAULT_MAX_TABLE_PAGES}
        first
        last
        prev
        next
        ellipsis
        boundaryLinks
        layout={['total', '-', 'limit', '|', 'pager', 'skip']}
        total={data?.goodies?.totalCount ?? 0}
        activePage={page}
        onChangePage={page => setPage(page)}
        onChangeLimit={limit => setLimit(limit)}
      />

      <Modal
        open={!!goodieToDelete}
        backdrop="static"
        size="xs"
        onClose={() => setGoodieToDelete(undefined)}
      >
        <Modal.Title>{t('goodie.overview.areYouSure')}</Modal.Title>

        <Modal.Body>
          {goodieToDelete &&
            t('goodie.overview.areYouSureBody', {
              goodie: goodieToDelete.name,
            })}
        </Modal.Body>

        <Modal.Footer>
          <Button
            color="red"
            appearance="primary"
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
            appearance="subtle"
            onClick={() => setGoodieToDelete(undefined)}
          >
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateGoodie.id,
  CanUpdateGoodie.id,
  CanDeleteGoodie.id,
])(GoodieList);

export { CheckedPermissionComponent as GoodieList };
