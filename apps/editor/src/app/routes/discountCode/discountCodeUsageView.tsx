import { useQuery } from '@apollo/client/react';
import { IconButton, Typography } from '@mui/material';
import {
  Currency,
  DiscountCodeDocument,
  DiscountCodeUsagesDocument,
  DiscountCodeUsagesQuery,
  InvoiceSort,
} from '@wepublish/editor/api';
import { CanGetInvoices } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  InfoTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  mapTableSortTypeToGraphQLSortOrder,
  Pagination,
  TableWrapper,
  PageTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdChevronLeft } from 'react-icons/md';
import { Link as RouterLink, useParams } from 'react-router-dom';

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

  const { data: discountCodeData } = useQuery(DiscountCodeDocument, {
    variables: {
      id: id as string,
    },
  });

  const { data, loading } = useQuery(DiscountCodeUsagesDocument, {
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
          <PageTitle>
            {t('discountCode.usage.title', {
              discountCode: discountCode?.code.toUpperCase() ?? '',
            })}
          </PageTitle>

          {discountCode && (
            <Typography>
              {t('discountCode.usage.summary', {
                total: discountCode.usageCount,
                paid: discountCode.paidUsageCount,
              })}
            </Typography>
          )}
        </ListViewHeader>

        <ListViewActions>
          <IconButton
            component={RouterLink}
            to="/discountCodes"
          >
            <MdChevronLeft />
            {t('discountCode.usage.back')}
          </IconButton>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="discount-code-usage"
          data={data?.invoices.nodes ?? []}
          loading={loading}
          sortColumn={'createdAt'}
          sortOrder={sortOrder}
          onSort={(_, sortType) => setSortOrder(sortType ?? 'desc')}
          sortable={['createdAt']}
          columns={[
            {
              id: 'date',
              label: t('discountCode.usage.date'),
              width: 200,
              sortKey: 'createdAt',
              render: (rowData: Usage) =>
                new Date(rowData.createdAt).toLocaleDateString('de-CH'),
            },
            {
              id: 'mail',
              label: t('discountCode.usage.mail'),
              minWidth: 200,
              sortKey: 'mail',
              render: row => row.mail,
            },
            {
              id: 'amount',
              label: (
                <>
                  {t('discountCode.usage.amount')}{' '}
                  <InfoTooltip text={t('discountCode.usage.amountInfo')} />
                </>
              ),
              width: 130,
              align: 'right',
              render: (rowData: Usage) =>
                formatAmount(rowData.total, rowData.currency),
            },
            {
              id: 'status',
              label: t('discountCode.usage.status'),
              width: 120,
              render: (rowData: Usage) => {
                if (rowData.canceledAt) {
                  return t('discountCode.usage.canceled');
                }

                if (rowData.paidAt) {
                  return t('discountCode.usage.paid');
                }

                return t('discountCode.usage.open');
              },
            },
            {
              id: 'subscription',
              label: t('discountCode.usage.subscription'),
              width: 120,
              render: (rowData: Usage) =>
                rowData.subscriptionID ?
                  <Link to={`/subscriptions/edit/${rowData.subscriptionID}`}>
                    {t('discountCode.usage.showSubscription')}
                  </Link>
                : null,
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
        totalCount={data?.invoices.totalCount ?? 0}
      />
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetInvoices.id,
])(DiscountCodeUsageView);

export { CheckedPermissionComponent as DiscountCodeUsageView };
