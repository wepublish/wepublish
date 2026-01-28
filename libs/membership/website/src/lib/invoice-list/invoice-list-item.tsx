import styled from '@emotion/styled';
import {
  BuilderInvoiceListItemProps,
  useAsyncAction,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
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
    elements: { H6, Button, Alert, Link },
    date,
  } = useWebsiteBuilder();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const callAction = useAsyncAction(setLoading, setError);

  return (
    <InvoiceListItemWrapper className={className}>
      <InvoiceListItemContent>
        {!paidAt && !canceledAt && (
          <H6>
            Offene Rechnung{' '}
            {subscription && <>für {subscription.memberPlan.name}</>}
          </H6>
        )}

        {paidAt && (
          <H6>
            Bezahlte Rechnung{' '}
            {subscription && <>für {subscription.memberPlan.name}</>}
          </H6>
        )}

        {canceledAt && (
          <H6>
            Stornierte Rechnung{' '}
            {subscription && <>für {subscription.memberPlan.name}</>}
          </H6>
        )}

        <InvoiceListItemMeta>
          <InvoiceListItemMetaItem>
            <MdOutlineInfo /> Rechnungs-Nr: {id}
          </InvoiceListItemMetaItem>

          <InvoiceListItemMetaItem>
            <MdCalendarMonth />
            <span>
              Abgeschlossen am{' '}
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
                Fällig am{' '}
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
            <MdAttachMoney /> Betrag von{' '}
            {formatCurrency(
              total / 100,
              subscription?.memberPlan.currency ?? Currency.Chf,
              locale
            )}
          </InvoiceListItemMetaItem>
        </InvoiceListItemMeta>

        {paidAt && (
          <strong>
            Bezahlt am{' '}
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
            Storniert am{' '}
            <time
              suppressHydrationWarning
              dateTime={canceledAt}
            >
              {date.format(new Date(canceledAt))}
            </time>
          </strong>
        )}

        {error && <Alert severity="error">{error.message}</Alert>}

        {isSepa && (
          <Alert severity="warning">
            Die Rechnung wird automatisch per Lastschriftverfahren beglichen.
            Dies kann einige Tage in Anspruch nehmen.
          </Alert>
        )}

        {isBexio && (
          <Alert severity="warning">
            Du erhältst eine PDF-Rechnung per E-Mail zugeschickt.
          </Alert>
        )}

        {/* @TODO: Remove when all 'payrexx subscriptions' subscriptions have been migrated  */}
        {isPayrexxSubscription && (
          <Alert severity="warning">
            Wir haben vor einiger Zeit das Membersystem angepasst und dein Abo
            ist veraltet. Es wird automatisch angepasst wenn du auf "Jetzt
            Bezahlen" drückst.
          </Alert>
        )}

        {canPay && (
          <InvoiceListItemActions>
            <Button
              onClick={callAction(pay)}
              disabled={loading}
            >
              Jetzt Bezahlen
            </Button>
          </InvoiceListItemActions>
        )}
      </InvoiceListItemContent>
    </InvoiceListItemWrapper>
  );
}
