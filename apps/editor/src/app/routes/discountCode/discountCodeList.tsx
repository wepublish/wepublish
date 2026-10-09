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
  useAuthorisation,
  useListViewState,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Table as RTable } from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';

const { Column, HeaderCell, Cell: RCell } = RTable;

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
          <h2>{t('discountCode.overview.title')}</h2>
        </ListViewHeader>

        <ListViewActions>
          <Link to="create">
            <Button
              variant="contained"
              loading={false}
              startIcon={<MdAdd />}
            >
              {t('discountCode.overview.createDiscountCode')}
            </Button>
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
            setSort(sortColumn, sortType ?? 'asc');
            setPage(1);
          }}
        >
          <Column
            width={100}
            resizable
          >
            <HeaderCell>
              {t('discountCode.overview.valid')}{' '}
              <InfoTooltip text={t('discountCode.overview.validInfo')} />
            </HeaderCell>

            <RCell>
              {(rowData: RowDataType<FullDiscountCodeFragment>) =>
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
              {(rowData: RowDataType<FullDiscountCodeFragment>) => (
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
              {(rowData: FullDiscountCodeFragment) =>
                `${rowData.discountPercent}%`
              }
            </RCell>
          </Column>

          <Column
            width={160}
            resizable
          >
            <HeaderCell>{t('discountCode.overview.usage')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<FullDiscountCodeFragment>) => {
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
              {(rowData: RowDataType<FullDiscountCodeFragment>) =>
                rowData.memberPlan.name
              }
            </RCell>
          </Column>

          <Column
            width={200}
            resizable
          >
            <HeaderCell>{t('discountCode.overview.validFrom')}</HeaderCell>

            <RCell>
              {(rowData: FullDiscountCodeFragment) =>
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
              {(rowData: FullDiscountCodeFragment) =>
                `${new Date(rowData.validTo).toDateString()}`
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
              {(discountCode: RowDataType<FullDiscountCodeFragment>) => (
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
          setLimit: limit => {
            setLimit(limit);
            setPage(1);
          },
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

          <Button
            variant="text"
            onClick={() => setDiscountCodeToDelete(undefined)}
          >
            {t('cancel')}
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
