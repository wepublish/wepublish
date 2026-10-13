import styled from '@emotion/styled';
import {
  BuilderInvoiceListItemProps,
  useAsyncAction,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  MdAttachMoney,
  MdCalendarMonth,
  MdOutlineInfo,
  MdOutlineWarning,
} from 'react-icons/md';
import { formatCurrency } from '../formatters/format-currency';
import { Currency } from '@wepublish/website/api';

export const InvoiceListItemWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  overflow: hidden;
  container-type: inline-size;
`;

export const InvoiceListItemContent = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)};
`;

export const InvoiceListItemMeta = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const InvoiceListItemMetaItem = styled('li')`
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  justify-content: start;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const InvoiceListItemActions = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export function InvoiceListItem({
  id,
  total,
  paidAt,
  createdAt,
  canceledAt,
  dueAt,
  subscription,
  isSepa,
  isBexio,
  isPayrexxSubscription,
  canPay,
  pay,
  className,
}: BuilderInvoiceListItemProps) {
  const {
    meta: { locale },
    elements: { H6, Button, Alert },
    date,
  } = useWebsiteBuilder();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const callAction = useAsyncAction(setLoading, setError);
  const { t } = useTranslation();

  return (
    <InvoiceListItemWrapper className={className}>
      <InvoiceListItemContent>
        {!paidAt && !canceledAt && (
          <H6>
            {t('invoice.unpaid')}{' '}
            {subscription && <>für {subscription.memberPlan.name}</>}
          </H6>
        )}

        {paidAt && (
          <H6>
            {t('invoice.paid')}{' '}
            {subscription && <>für {subscription.memberPlan.name}</>}
          </H6>
        )}

        {canceledAt && (
          <H6>
            {t('invoice.canceled')}{' '}
            {subscription && <>für {subscription.memberPlan.name}</>}
          </H6>
        )}

        <InvoiceListItemMeta>
          <InvoiceListItemMetaItem>
            <MdOutlineInfo /> {t('invoice.number')}: {id}
          </InvoiceListItemMetaItem>

          <InvoiceListItemMetaItem>
            <MdCalendarMonth />
            <span>
              {t('invoice.completedAt')}{' '}
              <time
                suppressHydrationWarning
                dateTime={createdAt}
              >
                {date.format(new Date(createdAt))}
              </time>
            </span>
          </InvoiceListItemMetaItem>

          {!isSepa && (
            <InvoiceListItemMetaItem>
              <MdOutlineWarning />
              <span>
                {t('invoice.dueAt')}{' '}
                <time
                  suppressHydrationWarning
                  dateTime={dueAt}
                >
                  {date.format(new Date(dueAt))}
                </time>
              </span>
            </InvoiceListItemMetaItem>
          )}

          <InvoiceListItemMetaItem>
            <MdAttachMoney /> {t('invoice.amount')}{' '}
            {formatCurrency(
              total / 100,
              subscription?.memberPlan.currency ?? Currency.Chf,
              locale
            )}
          </InvoiceListItemMetaItem>
        </InvoiceListItemMeta>

        {paidAt && (
          <strong>
            {t('invoice.paidAt')}{' '}
            <time
              suppressHydrationWarning
              dateTime={paidAt}
            >
              {date.format(new Date(paidAt))}
            </time>
          </strong>
        )}

        {canceledAt && (
          <strong>
            {t('invoice.canceledAt')}{' '}
            <time
              suppressHydrationWarning
              dateTime={canceledAt}
            >
              {date.format(new Date(canceledAt))}
            </time>
          </strong>
        )}

        {error && <Alert severity="error">{error.message}</Alert>}

        {isSepa && <Alert severity="warning">{t('invoice.sepaWarning')}</Alert>}

        {isBexio && (
          <Alert severity="warning">{t('invoice.bexioWarning')}</Alert>
        )}

        {/* @TODO: Remove when all 'payrexx subscriptions' subscriptions have been migrated  */}
        {isPayrexxSubscription && (
          <Alert severity="warning">{t('invoice.payrexxWarning')}</Alert>
        )}

        {canPay && (
          <InvoiceListItemActions>
            <Button
              onClick={callAction(pay)}
              disabled={loading}
            >
              {t('invoice.payNow')}
            </Button>
          </InvoiceListItemActions>
        )}
      </InvoiceListItemContent>
    </InvoiceListItemWrapper>
  );
}
