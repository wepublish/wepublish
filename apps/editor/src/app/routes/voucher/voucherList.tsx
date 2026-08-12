import styled from '@emotion/styled';
import {
  useDeleteVoucherMutation,
  useVoucherListQuery,
  Voucher,
  VoucherSort,
} from '@wepublish/editor/api';
import {
  CanCreateVoucher,
  CanDeleteVoucher,
  CanUpdateVoucher,
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
  useListViewState,
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

function VoucherList() {
  const { t } = useTranslation();
  const { sortField, sortOrder, setSort, limit, setLimit } = useListViewState(
    'vouchers',
    { defaultSortField: '' }
  );
  const [page, setPage] = useState<number>(1);

  const [voucherToDelete, setVoucherToDelete] = useState<Voucher | undefined>(
    undefined
  );

  const { data, loading, refetch } = useVoucherListQuery({
    variables: {
      take: limit,
      skip: (page - 1) * limit,
      sort: sortField ? (sortField as VoucherSort) : undefined,
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    },
  });
  const [deleteVoucher] = useDeleteVoucherMutation({
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
          <h2>{t('voucher.overview.title')}</h2>
        </ListViewHeader>

        <ListViewActions>
          <Link to="create">
            <IconButton
              appearance="primary"
              loading={false}
            >
              <MdAdd />
              {t('voucher.overview.createVoucher')}
            </IconButton>
          </Link>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={loading}
          data={data?.vouchers.nodes ?? []}
          sortColumn={sortField}
          sortType={sortOrder}
          onSortColumn={(sortColumn, sortType) => {
            setSort(sortColumn, sortType ?? 'asc');
            setPage(1);
          }}
        >
          <Column
            width={75}
            resizable
          >
            <HeaderCell>{t('voucher.overview.valid')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<Voucher>) =>
                (
                  new Date() > new Date(rowData.validFrom) &&
                  new Date(rowData.validTo) > new Date()
                ) ?
                  `✅`
                : `❌`
              }
            </RCell>
          </Column>

          <Column
            width={150}
            resizable
          >
            <HeaderCell>{t('voucher.overview.code')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<Voucher>) => (
                <Link to={`edit/${rowData.id}`}>
                  {rowData.code.toUpperCase()}
                </Link>
              )}
            </RCell>
          </Column>

          <Column
            width={100}
            resizable
            sortable
          >
            <HeaderCell>{t('voucher.overview.discountPercent')}</HeaderCell>

            <RCell dataKey={VoucherSort.Discount}>
              {(rowData: Voucher) => `${rowData.discountPercent}%`}
            </RCell>
          </Column>

          <Column
            width={150}
            resizable
          >
            <HeaderCell>{t('voucher.overview.memberPlan')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<Voucher>) => rowData.memberPlan.name}
            </RCell>
          </Column>

          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('voucher.overview.validFrom')}</HeaderCell>

            <RCell>
              {(rowData: Voucher) =>
                `${new Date(rowData.validFrom).toDateString()}`
              }
            </RCell>
          </Column>

          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('voucher.overview.validTo')}</HeaderCell>

            <RCell>
              {(rowData: Voucher) =>
                `${new Date(rowData.validTo).toDateString()}`
              }
            </RCell>
          </Column>

          <Column
            resizable
            fixed="right"
          >
            <HeaderCell align={'center'}>{t('delete')}</HeaderCell>
            <PaddedCell align={'center'}>
              {(voucher: RowDataType<Voucher>) => (
                <IconButton
                  icon={<MdDelete />}
                  circle
                  appearance="ghost"
                  color="red"
                  size="sm"
                  onClick={() => setVoucherToDelete(voucher as Voucher)}
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
        total={data?.vouchers?.totalCount ?? 0}
        activePage={page}
        onChangePage={page => setPage(page)}
        onChangeLimit={limit => {
          setLimit(limit);
          setPage(1);
        }}
      />

      <Modal
        open={!!voucherToDelete}
        backdrop="static"
        size="xs"
        onClose={() => setVoucherToDelete(undefined)}
      >
        <Modal.Title>{t('voucher.overview.areYouSure')}</Modal.Title>

        <Modal.Body>
          {voucherToDelete &&
            t('voucher.overview.areYouSureBody', {
              voucher: voucherToDelete.code,
            })}
        </Modal.Body>

        <Modal.Footer>
          <Button
            color="red"
            appearance="primary"
            onClick={() => {
              deleteVoucher({
                variables: {
                  id: voucherToDelete?.id ?? '',
                },
              });
              setVoucherToDelete(undefined);
            }}
          >
            {t('voucher.overview.areYouSureConfirmation')}
          </Button>

          <Button
            appearance="subtle"
            onClick={() => setVoucherToDelete(undefined)}
          >
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateVoucher.id,
  CanUpdateVoucher.id,
  CanDeleteVoucher.id,
])(VoucherList);

export { CheckedPermissionComponent as VoucherList };
