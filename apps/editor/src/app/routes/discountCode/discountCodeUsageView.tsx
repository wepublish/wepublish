import {
  Currency,
  DiscountCodeUsagesQuery,
  InvoiceSort,
  useDiscountCodeQuery,
  useDiscountCodeUsagesQuery,
} from '@wepublish/editor/api';
import { CanGetInvoices } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  Table,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdChevronLeft } from 'react-icons/md';
import { Link, useParams } from 'react-router-dom';
import { IconButton, Pagination, Table as RTable } from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';

const { Column, HeaderCell, Cell: RCell } = RTable;

type Usage = DiscountCodeUsagesQuery['invoices']['nodes'][number];

const formatAmount = (total: number, currency: Currency) =>
  `${(total / 100).toLocaleString('de-CH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;

function DiscountCodeUsageView() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: discountCodeData } = useDiscountCodeQuery({
    variables: {
      id: id as string,
    },
  });

  const { data, loading } = useDiscountCodeUsagesQuery({
    variables: {
      discountCodeId: id as string,
      take: limit,
      skip: (page - 1) * limit,
      sort: InvoiceSort.CreatedAt,
      order: mapTableSortTypeToGraphQLSortOrder(sortOrder),
    },
  });

  const discountCode = discountCodeData?.discountCode;

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>
            {t('discountCode.usage.title', {
              discountCode: discountCode?.code.toUpperCase() ?? '',
            })}
          </h2>

          {discountCode && (
            <p>
              {t('discountCode.usage.summary', {
                total: discountCode.usageCount,
                paid: discountCode.paidUsageCount,
              })}
            </p>
          )}
        </ListViewHeader>

        <ListViewActions>
          <Link to="/discountCodes">
            <IconButton appearance="ghost">
              <MdChevronLeft />
              {t('discountCode.usage.back')}
            </IconButton>
          </Link>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <Table
          fillHeight
          loading={loading}
          data={data?.invoices.nodes ?? []}
          sortColumn="createdAt"
          sortType={sortOrder}
          onSortColumn={(_, sortType) => setSortOrder(sortType ?? 'desc')}
        >
          <Column
            width={200}
            resizable
            sortable
          >
            <HeaderCell>{t('discountCode.usage.date')}</HeaderCell>

            <RCell dataKey="createdAt">
              {(rowData: RowDataType<Usage>) =>
                new Date(rowData.createdAt).toLocaleDateString('de-CH')
              }
            </RCell>
          </Column>

          <Column
            flexGrow={1}
            minWidth={200}
            resizable
          >
            <HeaderCell>{t('discountCode.usage.mail')}</HeaderCell>

            <RCell dataKey="mail" />
          </Column>

          <Column
            width={130}
            resizable
            align="right"
          >
            <HeaderCell>{t('discountCode.usage.amount')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<Usage>) =>
                formatAmount(rowData.total, rowData.currency)
              }
            </RCell>
          </Column>

          <Column
            width={120}
            resizable
          >
            <HeaderCell>{t('discountCode.usage.status')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<Usage>) => {
                if (rowData.canceledAt) {
                  return t('discountCode.usage.canceled');
                }

                if (rowData.paidAt) {
                  return t('discountCode.usage.paid');
                }

                return t('discountCode.usage.open');
              }}
            </RCell>
          </Column>

          <Column
            width={120}
            resizable
          >
            <HeaderCell>{t('discountCode.usage.subscription')}</HeaderCell>

            <RCell>
              {(rowData: RowDataType<Usage>) =>
                rowData.subscriptionID ?
                  <Link to={`/subscriptions/edit/${rowData.subscriptionID}`}>
                    {t('discountCode.usage.showSubscription')}
                  </Link>
                : null
              }
            </RCell>
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
        total={data?.invoices.totalCount ?? 0}
        activePage={page}
        onChangePage={page => setPage(page)}
        onChangeLimit={limit => setLimit(limit)}
      />
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetInvoices.id,
])(DiscountCodeUsageView);

export { CheckedPermissionComponent as DiscountCodeUsageView };
