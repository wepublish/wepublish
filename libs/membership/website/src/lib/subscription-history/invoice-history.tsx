import styled from '@emotion/styled';
import { Skeleton, TableRow } from '@mui/material';
import { getInvoiceState, InvoiceStatusIcon } from '@wepublish/ui';
import { FullInvoiceFragment } from '@wepublish/website/api';
import {
  BuilderInvoiceListProps,
  useAsyncAction,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdSubdirectoryArrowRight } from 'react-icons/md';

import { formatCurrency } from '../formatters/format-currency';
import { isInvoiceDue } from '../invoice-due';
import {
  canPayInvoice,
  isBexio,
  isPayrexxSubscription,
  isSepa,
} from '../invoice-list/invoice-list';
import {
  HISTORY_COLUMNS,
  HISTORY_COLUMNS_SHOWN,
  HISTORY_STACKED,
  PLAN_PADDING,
  HistoryAmount,
  HistoryArrowCell,
  HistoryCell,
  HistoryDate,
  HistoryPlanCell,
  HistoryState,
  HistoryStateCell,
  historyHalves,
} from './history-table';

/** Labels the invoice rows of one subscription, in its columns. */
export const InvoiceHistoryHeaderRow = styled(TableRow)`
  && > th {
    background-color: ${({ theme }) => theme.palette.grey[50]};
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 0.875em;
    font-weight: 600;
    white-space: nowrap;
    hyphens: manual;
  }

  // nested: the arrow column stays outside the invoices' block
  &&[data-nested='true'] > th:first-of-type {
    background-color: transparent;
    border-bottom: none;
  }

  // the block starts 8px before the invoice label, which stays in line with
  // the plan column's; its line below starts there too
  &&[data-nested='true'] > th:nth-of-type(2) {
    position: relative;
    border-bottom: none;
    background: linear-gradient(
      to right,
      transparent ${({ theme }) => theme.spacing(PLAN_PADDING - 1)},
      ${({ theme }) => theme.palette.grey[50]}
        ${({ theme }) => theme.spacing(PLAN_PADDING - 1)}
    );

    // the lower line in the row of the other cells' borders, which a
    // background cannot reach
    &::after {
      content: '';
      position: absolute;
      left: ${({ theme }) => theme.spacing(PLAN_PADDING - 1)};
      right: 0;
      bottom: -1px;
      height: 1px;
      background-color: ${({ theme }) => theme.palette.divider};
    }
  }

  // on narrow containers every cell carries its own label
  ${HISTORY_STACKED} {
    && {
      display: none;
    }
  }
`;

/** Keeps the expand column of the subscription rows free. */
export const InvoiceHistorySpacerCell = styled(HistoryArrowCell)`
  ${HISTORY_STACKED} {
    && {
      display: none;
    }
  }
`;

const NESTED_ICON_SIZE = 16;
const NESTED_ICON_GAP = 2.5; // theme spacing units

/**
 * The invoice column: label and values start where the plan column's do; the
 * arrow hangs into the free column in front. The table's narrow layout
 * replaces the padding.
 */
export const InvoiceHistoryIndentedCell = HistoryPlanCell;

/** Like the editor's user view: the arrow hangs in front of the invoice. */
export const InvoiceHistoryNested = styled('span')`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(NESTED_ICON_GAP)};

  // stacked, the box shows which subscription the invoice belongs to; the
  // label may only take the value column, so it ends in an ellipsis
  ${HISTORY_STACKED} {
    display: flex;
    min-width: 0;

    svg {
      display: none;
    }
  }

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: ${NESTED_ICON_SIZE}px;
  }

  // as wide as the cell at most, so the label ends in an ellipsis
  ${HISTORY_COLUMNS_SHOWN} {
    position: relative;
    display: flex;
    min-width: 0;

    svg {
      position: absolute;
      left: calc(
        -${NESTED_ICON_SIZE}px -
          ${({ theme }) => theme.spacing(NESTED_ICON_GAP)}
      );
    }
  }
`;

/** Cut short where it is longer than the column; the full label on hover. */
export const InvoiceHistoryLabel = styled('span')`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  // as wide as its column
  min-width: 0;
`;

/**
 * An invoice. In two halves (HISTORY_HALVES): the invoice across the top,
 * state and created on the left, due and amount on the right, payment below.
 * Counted from the end: in the profile, a hidden spacer cell comes first.
 */
export const InvoiceHistoryDataRow = styled(TableRow)`
  ${({ theme }) =>
    historyHalves(theme, {
      pairs: 2,
      top: 'td:nth-last-of-type(6)',
      bottom: 'td:last-of-type',
      right: 'td:nth-last-of-type(2), td:nth-last-of-type(3)',
    })}
`;

const time = (date: string) => new Date(date).getTime();

/** How many invoices a subscription shows in the profile's table. */
export const LATEST_INVOICES = 2;

/** How many invoices a subscription's own page shows when stacked. */
export const STACKED_INVOICES = 3;

type InvoiceHistoryRowProps = {
  invoice: FullInvoiceFragment;
  onPay: BuilderInvoiceListProps['onPay'];
  nested: boolean;
  collapsed: boolean;
  /** Past the stacked layout's limit, until the reader asks for all. */
  beyondLimit?: boolean;
};

function InvoiceHistoryRow({
  invoice,
  onPay,
  nested,
  collapsed,
  beyondLimit = false,
}: InvoiceHistoryRowProps) {
  const {
    meta: { locale },
    elements: { Button, Alert },
    date,
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const callAction = useAsyncAction(setLoading, setError);

  const state = getInvoiceState(invoice);
  const stateLabel = t(`subscriptionHistory.invoiceStates.${state}`, {
    date: date.format(
      new Date(invoice.paidAt ?? invoice.canceledAt ?? 0),
      false
    ),
  });
  const currency = invoice.subscription?.memberPlan.currency;
  const paymentMethodId = invoice.subscription?.paymentMethod.id;
  const payable = canPayInvoice(invoice) && !!paymentMethodId;

  return (
    <InvoiceHistoryDataRow
      data-collapsed={collapsed ? 'true' : undefined}
      data-beyond-limit={beyondLimit ? 'true' : undefined}
    >
      {nested ?
        <>
          <InvoiceHistorySpacerCell data-label="" />

          <InvoiceHistoryIndentedCell
            data-label={t('subscriptionHistory.invoice')}
          >
            <InvoiceHistoryNested>
              <MdSubdirectoryArrowRight aria-hidden />
              <InvoiceHistoryLabel title={invoice.description ?? invoice.id}>
                {invoice.description ?? invoice.id}
              </InvoiceHistoryLabel>
            </InvoiceHistoryNested>
          </InvoiceHistoryIndentedCell>
        </>
      : <HistoryCell data-label={t('subscriptionHistory.invoice')}>
          <span>{invoice.description ?? invoice.id}</span>
        </HistoryCell>
      }

      <HistoryStateCell data-label={t('subscriptionHistory.state')}>
        {/* the date of the state on hovering the icon */}
        <HistoryState>
          <InvoiceStatusIcon
            status={state}
            title={stateLabel}
          />
          {t(`subscriptionHistory.invoiceStateNames.${state}`)}
        </HistoryState>
      </HistoryStateCell>

      <HistoryCell data-label={t('subscriptionHistory.createdAt')}>
        <HistoryDate date={invoice.createdAt} />
      </HistoryCell>

      <HistoryCell data-label={t('subscriptionHistory.dueAt')}>
        {!isSepa(invoice) && <HistoryDate date={invoice.dueAt} />}
      </HistoryCell>

      <HistoryCell data-label={t('subscriptionHistory.total')}>
        <HistoryAmount>
          {currency ?
            formatCurrency(invoice.total / 100, currency, locale)
          : (invoice.total / 100).toFixed(2)}
        </HistoryAmount>
      </HistoryCell>

      {/* under the subscription's payment method and renewal */}
      <HistoryCell
        colSpan={nested ? 2 : 1}
        data-label=""
      >
        {payable && (
          <Button
            size="small"
            disabled={loading}
            onClick={callAction(async () =>
              onPay?.(invoice.id, paymentMethodId)
            )}
          >
            {t('invoice.payNow')}
          </Button>
        )}

        {state === 'unpaid' && isBexio(invoice) && t('invoice.bexioWarning')}
        {state === 'unpaid' && isSepa(invoice) && t('invoice.sepaWarning')}
        {payable && isPayrexxSubscription(invoice) && (
          <Alert severity="warning">{t('invoice.payrexxWarning')}</Alert>
        )}
        {error && <Alert severity="error">{error.message}</Alert>}
      </HistoryCell>
    </InvoiceHistoryDataRow>
  );
}

/**
 * A subscription's invoices as rows of the subscription history's table, in
 * its columns: invoice under subscription, status under status, created under
 * start, due under paid-until, amount under amount. Newest due first;
 * cancelled ones (often left over from imports or replaced invoices) only on
 * request.
 */
export type InvoiceHistoryProps = BuilderInvoiceListProps & {
  /** Below a subscription row of the history (default), or on its own. */
  nested?: boolean;
  /**
   * Shows only the latest invoices, plus older open ones so they can still be
   * paid, and links here for all of them (instead of the cancelled toggle).
   */
  allInvoicesUrl?: string;
  /**
   * Its subscription is closed: the table hides these rows, the stacked
   * layout shows them anyway.
   */
  collapsed?: boolean;
};

export function InvoiceHistory({
  data,
  loading,
  error,
  onPay,
  nested = true,
  allInvoicesUrl,
  collapsed = false,
}: InvoiceHistoryProps) {
  const {
    elements: { Alert, Button, Link },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const [showCanceled, setShowCanceled] = useState(false);

  const invoices = useMemo(
    () =>
      [...(data?.userInvoices ?? [])].sort(
        (a, b) => time(b.dueAt) - time(a.dueAt)
      ),
    [data]
  );
  const uncanceled = invoices.filter(
    invoice => getInvoiceState(invoice) !== 'canceled'
  );
  const canceledCount = invoices.length - uncanceled.length;
  const shown =
    allInvoicesUrl ?
      uncanceled.filter(
        // older ones only while the reader has to act on them
        (invoice, index) =>
          index < LATEST_INVOICES || isInvoiceDue(invoice, invoices)
      )
    : showCanceled ? invoices
    : uncanceled;

  // on its own page, the stacked layout starts with the latest few
  const [showAllStacked, setShowAllStacked] = useState(false);
  const stackedLimit =
    !nested && shown.length > STACKED_INVOICES ? STACKED_INVOICES : undefined;

  const collapsedRow = collapsed ? 'true' : undefined;
  // under a subscription, a note starts where its name and invoices do
  const fullRow = (content: ReactNode) => (
    <TableRow data-collapsed={collapsedRow}>
      {nested ?
        <>
          <InvoiceHistorySpacerCell data-label="" />
          <InvoiceHistoryIndentedCell
            colSpan={HISTORY_COLUMNS - 1}
            data-label=""
          >
            {content}
          </InvoiceHistoryIndentedCell>
        </>
      : <HistoryCell
          colSpan={HISTORY_COLUMNS}
          data-label=""
        >
          {content}
        </HistoryCell>
      }
    </TableRow>
  );

  if (loading && !invoices.length) {
    return fullRow(<Skeleton variant="rectangular" />);
  }

  if (error) {
    return fullRow(<Alert severity="error">{error.message}</Alert>);
  }

  if (!invoices.length) {
    return fullRow(t('subscriptionHistory.noInvoices'));
  }

  return (
    <>
      {!!shown.length && (
        <InvoiceHistoryHeaderRow
          data-nested={nested}
          data-collapsed={collapsedRow}
        >
          {nested ?
            <>
              <HistoryArrowCell component="th" />
              <InvoiceHistoryIndentedCell component="th">
                {t('subscriptionHistory.invoice')}
              </InvoiceHistoryIndentedCell>
            </>
          : <HistoryCell component="th">
              {t('subscriptionHistory.invoice')}
            </HistoryCell>
          }
          <HistoryStateCell component="th">
            {t('subscriptionHistory.state')}
          </HistoryStateCell>
          <HistoryCell component="th">
            {t('subscriptionHistory.createdAt')}
          </HistoryCell>
          <HistoryCell component="th">
            {t('subscriptionHistory.dueAt')}
          </HistoryCell>
          <HistoryCell component="th">
            {t('subscriptionHistory.total')}
          </HistoryCell>
          <HistoryCell
            component="th"
            colSpan={nested ? 2 : 1}
          />
        </InvoiceHistoryHeaderRow>
      )}

      {shown.map((invoice, index) => (
        <InvoiceHistoryRow
          key={invoice.id}
          invoice={invoice}
          onPay={onPay}
          nested={nested}
          collapsed={collapsed}
          beyondLimit={
            stackedLimit !== undefined &&
            !showAllStacked &&
            index >= stackedLimit
          }
        />
      ))}

      {stackedLimit !== undefined && (
        // the table shows them all
        <TableRow data-stacked-only="true">
          <HistoryCell
            colSpan={HISTORY_COLUMNS}
            data-label=""
          >
            <Button
              variant="text"
              size="small"
              onClick={() => setShowAllStacked(show => !show)}
            >
              {showAllStacked ?
                t('subscriptionHistory.hideMoreInvoices')
              : t('subscriptionHistory.moreInvoices', {
                  count: shown.length - stackedLimit,
                })
              }
            </Button>
          </HistoryCell>
        </TableRow>
      )}

      {allInvoicesUrl ?
        shown.length < invoices.length &&
        fullRow(
          <Link href={allInvoicesUrl}>
            {t('subscriptionHistory.allInvoices', { count: invoices.length })}
          </Link>
        )
      : !!canceledCount &&
        fullRow(
          <Button
            variant="text"
            size="small"
            onClick={() => setShowCanceled(show => !show)}
          >
            {showCanceled ?
              t('subscriptionHistory.hideCanceled')
            : t('subscriptionHistory.showCanceled', { count: canceledCount })}
          </Button>
        )
      }
    </>
  );
}

/** For `InvoiceListContainer` on a subscription's own page. */
export const InvoiceHistoryStandalone = (props: BuilderInvoiceListProps) => (
  <InvoiceHistory
    {...props}
    nested={false}
  />
);
