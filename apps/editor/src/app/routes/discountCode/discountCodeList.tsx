import styled from '@emotion/styled';
import {
  DiscountCode,
  DiscountCodesort,
  useDeleteDiscountCodeMutation,
  useDiscountCodeListQuery,
} from '@wepublish/editor/api';
import {
  CanCreateDiscountCode,
  CanDeleteDiscountCode,
  CanGetInvoices,
  CanUpdateDiscountCode,
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
  useAuthorisation,
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

function DiscountCodeList() {
  const { t } = useTranslation();
  const canSeeUsages = useAuthorisation(CanGetInvoices.id);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [sortField, setSortField] = useState<DiscountCodesort>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [discountCodeToDelete, setDiscountCodeToDelete] = useState<
    DiscountCode | undefined
  >(undefined);

  const { data, loading, refetch } = useDiscountCodeListQuery({
    variables: {
      take: limit,
      skip: (page - 1) * limit,
      sort: sortField,
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    },
  });
  const [deleteDiscountCode] = useDeleteDiscountCodeMutation({
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
          <h2>{t('discountCode.overview.title')}</h2>
        </ListViewHeader>

        <ListViewActions>
          <Link to="create">
            <IconButton
              appearance="primary"
              loading={false}
            >
              <MdAdd />
              {t('discountCode.overview.createDiscountCode')}
            </IconButton>
          </Link>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={loading}
          data={data?.discountCodes.nodes ?? []}
          sortColumn={sortField}
          sortType={sortOrder}
          onSortColumn={(sortColumn, sortType) => {
            setSortOrder(sortType ?? 'asc');
            setSortField(sortColumn as DiscountCodesort);
          }}
        >
          <Column
            width={75}
            resizable
          >
            <HeaderCell>{t('discountCode.overview.valid')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<DiscountCode>) =>
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
            <HeaderCell>{t('discountCode.overview.code')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<DiscountCode>) => (
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
            <HeaderCell>
              {t('discountCode.overview.discountPercent')}
            </HeaderCell>

            <RCell dataKey={DiscountCodesort.Discount}>
              {(rowData: DiscountCode) => `${rowData.discountPercent}%`}
            </RCell>
          </Column>

          <Column
            width={160}
            resizable
          >
            <HeaderCell>{t('discountCode.overview.usage')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<DiscountCode>) => {
                const usage = t('discountCode.overview.usageValue', {
                  total: rowData.usageCount,
                  paid: rowData.paidUsageCount,
                });

                if (!canSeeUsages) {
                  return usage;
                }

                return <Link to={`usage/${rowData.id}`}>{usage}</Link>;
              }}
            </RCell>
          </Column>

          <Column
            width={150}
            resizable
          >
            <HeaderCell>{t('discountCode.overview.memberPlan')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<DiscountCode>) => rowData.memberPlan.name}
            </RCell>
          </Column>

          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('discountCode.overview.validFrom')}</HeaderCell>

            <RCell>
              {(rowData: DiscountCode) =>
                `${new Date(rowData.validFrom).toDateString()}`
              }
            </RCell>
          </Column>

          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('discountCode.overview.validTo')}</HeaderCell>

            <RCell>
              {(rowData: DiscountCode) =>
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
              {(discountCode: RowDataType<DiscountCode>) => (
                <IconButton
                  icon={<MdDelete />}
                  circle
                  appearance="ghost"
                  color="red"
                  size="sm"
                  onClick={() =>
                    setDiscountCodeToDelete(discountCode as DiscountCode)
                  }
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
        total={data?.discountCodes?.totalCount ?? 0}
        activePage={page}
        onChangePage={page => setPage(page)}
        onChangeLimit={limit => setLimit(limit)}
      />

      <Modal
        open={!!discountCodeToDelete}
        backdrop="static"
        size="xs"
        onClose={() => setDiscountCodeToDelete(undefined)}
      >
        <Modal.Title>{t('discountCode.overview.areYouSure')}</Modal.Title>

        <Modal.Body>
          {discountCodeToDelete &&
            t('discountCode.overview.areYouSureBody', {
              discountCode: discountCodeToDelete.code,
            })}
        </Modal.Body>

        <Modal.Footer>
          <Button
            color="red"
            appearance="primary"
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

          <Button
            appearance="subtle"
            onClick={() => setDiscountCodeToDelete(undefined)}
          >
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateDiscountCode.id,
  CanUpdateDiscountCode.id,
  CanDeleteDiscountCode.id,
])(DiscountCodeList);

export { CheckedPermissionComponent as DiscountCodeList };
