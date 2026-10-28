import styled from '@emotion/styled';
import {
  alpha,
  Chip,
  IconButton,
  Tooltip,
  TableBody,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  compareSubscriptions,
  getSubscriptionState,
  isInvoiceOpen,
  SUBSCRIPTION_STATE_CHIP,
} from '@wepublish/ui';
import {
  FullInvoiceFragment,
  FullSubscriptionFragment,
  ProductType,
} from '@wepublish/website/api';
import {
  BuilderInvoiceListProps,
  BuilderSubscriptionListProps,
  Link as BuilderLink,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { MouseEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from 'react-icons/md';

import { formatCurrency } from '../formatters/format-currency';
import { calculatePeriodAmount } from '../formatters/format-payment-period';
import { InvoiceListContainer } from '../invoice-list/invoice-list-container';
import { paymentMethodLabel } from '../payment-method-label';
import {
  IMMEDIATE_ACTIONS,
  SubscriptionActions,
  SubscriptionListItemActions,
} from '../subscription-list/subscription-actions';
import { isInvoiceDue } from '../invoice-due';
import { isSubscriptionDeactivated } from '../subscription-state';
import {
  HISTORY_COLUMNS,
  HISTORY_COLUMN_MIN_WIDTHS,
  HISTORY_COLUMNS_SHOWN,
  HISTORY_LONG_DATES,
  HISTORY_SHORT_DATES,
  HISTORY_STACKED,
  historyColumnWidths,
  historyHalves,
  PLAN_PADDING,
  HistoryAmount,
  HistoryArrowCell,
  HistoryCell,
  HistoryDate,
  HistoryPlanCell,
  HistoryState,
  HistoryStateCell,
  HistoryTable,
  HistoryTableWrapper,
} from './history-table';
import { InvoiceHistory } from './invoice-history';

/**
 * The same columns in every history (subscriptions, donations), whatever they
 * hold: fixed, from the header's widths.
 */
export const SubscriptionHistoryTable = styled(HistoryTable)`
  ${HISTORY_COLUMNS_SHOWN} {
    table-layout: fixed;
  }

  ${HISTORY_SHORT_DATES} {
    ${historyColumnWidths(HISTORY_COLUMN_MIN_WIDTHS.shortDates)}
  }

  ${HISTORY_LONG_DATES} {
    ${historyColumnWidths(HISTORY_COLUMN_MIN_WIDTHS.longDates)}
  }
`;

export const SubscriptionHistoryWrapper = styled(HistoryTableWrapper)`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

/**
 * One subscription with its actions and invoices. Stacked, a box like the
 * sections of the edit page, its name on a band like their headings.
 */
export const SubscriptionHistoryBody = styled(TableBody)`
  // in the table, a darker line below each subscription's last shown row
  ${HISTORY_COLUMNS_SHOWN} {
    &
      > tr:not([data-stacked-only], [data-collapsed]):not(
        :has(~ tr:not([data-stacked-only], [data-collapsed]))
      )
      > :is(td, th) {
      border-bottom-color: ${({ theme }) =>
        alpha(theme.palette.common.black, 0.12)};
    }
  }

  ${HISTORY_STACKED} {
    border: 1px solid ${({ theme }) => theme.palette.divider};
    border-radius: ${({ theme }) => theme.shape.borderRadius}px;

    // with a due invoice, in the colour of the navbar's warning about it
    &:has(tr[data-due='true']) {
      border-color: ${({ theme }) => theme.palette.warning.main};
    }

    // the heading band follows the rounding
    overflow: hidden;
    margin-bottom: ${({ theme }) => theme.spacing(3)};

    & > tr > th[scope='row'] {
      background-color: ${({ theme }) => theme.palette.grey[100]};
      border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
      padding: ${({ theme }) => theme.spacing(1.5, PLAN_PADDING)};
      margin-bottom: ${({ theme }) => theme.spacing(1)};
      font-size: ${({ theme }) => theme.typography.h6.fontSize};
      font-weight: ${({ theme }) => theme.typography.h6.fontWeight};
      line-height: ${({ theme }) => theme.typography.h6.lineHeight};

      & > span {
        font-weight: inherit;
      }
    }

    // the heading band starts at the box's top edge
    & > tr:first-of-type {
      padding-top: 0;
    }

    & > tr:last-of-type {
      border-bottom: none;
    }
  }
`;

/** Opens the invoices in the table; stacked, they are always shown. */
const SubscriptionHistoryArrowCell = styled(HistoryArrowCell)`
  ${HISTORY_STACKED} {
    && {
      display: none;
    }
  }
`;

/**
 * The data row of a subscription: one block with its action row below. A click
 * on it opens or closes the invoices, like the arrow.
 */
export const SubscriptionHistoryMainRow = styled(TableRow)`
  cursor: pointer;

  ${HISTORY_STACKED} {
    cursor: auto;
  }

  && > td,
  && > th {
    border-bottom: none;
  }

  // below the name, state and dates on the left; amount, payment method and
  // renewal on the right (the cells after the hidden arrow, state and dates)
  ${({ theme }) =>
    historyHalves(theme, {
      pairs: 3,
      top: 'th',
      right: 'td:nth-of-type(n + 5)',
    })}

  // the whole block, also when its action row is hovered; lighter than the
  // header rows, so it does not read as one. Only in the table: stacked, the
  // block does not open anything.
  ${HISTORY_COLUMNS_SHOWN} {
    &:hover > td,
    &:hover > th,
    &:has(+ tr:hover) > td,
    &:has(+ tr:hover) > th {
      background-color: ${({ theme }) =>
        alpha(theme.palette.common.black, 0.02)};
    }
  }
`;

/** The actions below the data row: part of the same block on hover and click. */
export const SubscriptionHistoryActionRow = styled(TableRow)`
  cursor: pointer;

  ${HISTORY_STACKED} {
    cursor: auto;
  }

  ${HISTORY_COLUMNS_SHOWN} {
    &:hover > td,
    ${SubscriptionHistoryMainRow}:hover + && > td {
      background-color: ${({ theme }) =>
        alpha(theme.palette.common.black, 0.02)};
    }

    // open invoices draw the line themselves, from where their block starts
    &&:has(+ tr[data-nested='true']:not([data-collapsed])) > td {
      border-bottom: none;
    }
  }
`;

/** What a click on the subscription's block should leave to itself. */
const handlesItsOwnClicks = (target: EventTarget) =>
  target instanceof Element &&
  !!target.closest('a, button, [role="button"], [tabindex]');

export const SubscriptionHistoryActions = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};

  // no actions offered: no gap for them
  & > :empty {
    display: none;
  }

  ${SubscriptionListItemActions} {
    justify-content: flex-end;
  }
`;

/** On the right: editing, then the subscription's own actions. */
export const SubscriptionHistoryActionBar = styled('div')`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  // on their labels: the buttons differ in height, and an action can have a
  // note above it
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing(1, 2)};

  // the framed pending change: centred, its frame would sit lower
  &:has([data-pending-change]) {
    align-items: center;
  }

  // in the text colour: a tenant's primary can be too light for an outline
  & > [data-edit='true'] {
    color: ${({ theme }) => theme.palette.text.primary};
    border-color: currentColor;
  }
`;

/** In the table, so it lines up with the actions' last button. */
export const SubscriptionHistorySubscribeRow = styled(TableRow)`
  && > td {
    border-bottom: none;
  }

  // stacked rows draw their own line; this one ends the list
  ${HISTORY_STACKED} {
    && {
      border-bottom: none;
      padding-bottom: ${({ theme }) => theme.spacing(2)};
    }
  }
`;

export const SubscriptionHistorySubscribe = styled('div')`
  display: flex;
  justify-content: flex-end;
`;

const PlanName = styled('span')`
  font-weight: 700;
  color: ${({ theme }) => theme.palette.text.primary};
`;

/**
 * The subscription's state, lighter than in the editor: outline and text in
 * its colour. When it ends on hovering (or focusing) it.
 */
export function SubscriptionStateChip({
  subscription,
}: {
  subscription: FullSubscriptionFragment;
}) {
  const { date } = useWebsiteBuilder();
  const { t } = useTranslation();
  const { deactivation } = subscription;
  const state = getSubscriptionState(subscription);
  const chip = SUBSCRIPTION_STATE_CHIP[state];

  return deactivation ?
      <Tooltip
        title={`${t(`subscriptionHistory.states.${state}`)} ${t(
          'subscriptionHistory.endsOn',
          { date: date.format(new Date(deactivation.date), false) }
        )}`}
        placement="top"
      >
        <Chip
          size="small"
          tabIndex={0}
          label={t(`subscriptionHistory.states.${state}`)}
          color={chip.color}
          variant="outlined"
        />
      </Tooltip>
    : <Chip
        size="small"
        label={t(`subscriptionHistory.states.${state}`)}
        color={chip.color}
        variant="outlined"
      />;
}

type RowProps = {
  subscription: FullSubscriptionFragment;
  expanded: boolean;
  onToggle: () => void;
  openInvoiceTotal?: number;
} & Pick<
  BuilderSubscriptionListProps,
  | 'onCancel'
  | 'onReactivate'
  | 'onRevertUpgrade'
  | 'onExtend'
  | 'onChangePaymentMethod'
  | 'onCancelPaymentMethodChange'
>;

function SubscriptionHistoryRow({
  subscription,
  expanded,
  onToggle,
  openInvoiceTotal,
  onCancel,
  onReactivate,
  onRevertUpgrade,
  onExtend,
  onChangePaymentMethod,
  onCancelPaymentMethodChange,
}: RowProps) {
  const {
    meta: { locale },
    elements: { Button },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const {
    id,
    memberPlan,
    startsAt,
    paidUntil,
    deactivation,
    monthlyAmount,
    paymentPeriodicity,
    paymentMethod,
    autoRenew,
    extendable,
    url,
  } = subscription;
  // links, buttons and the state's tooltip keep their clicks; and a click that
  // ends a text selection selects, it does not toggle
  const toggleFromClick = (event: MouseEvent) => {
    if (
      handlesItsOwnClicks(event.target) ||
      window.getSelection()?.toString()
    ) {
      return;
    }

    onToggle();
  };
  const filterInvoices = useMemo(
    () => (invoices: FullInvoiceFragment[]) =>
      invoices.filter(({ subscriptionID }) => subscriptionID === id),
    [id]
  );
  // the latest invoices here, all of them on the edit page
  const InvoiceList = useMemo(
    () => (props: BuilderInvoiceListProps) => (
      <InvoiceHistory
        {...props}
        allInvoicesUrl={url}
        collapsed={!expanded}
      />
    ),
    [url, expanded]
  );

  return (
    <SubscriptionHistoryBody>
      <SubscriptionHistoryMainRow onClick={toggleFromClick}>
        <SubscriptionHistoryArrowCell data-label="">
          <IconButton
            size="small"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={
              expanded ?
                t('subscriptionHistory.hideInvoices')
              : t('subscriptionHistory.showInvoices')
            }
          >
            {expanded ?
              <MdKeyboardArrowDown />
            : <MdKeyboardArrowRight />}
          </IconButton>
        </SubscriptionHistoryArrowCell>

        <HistoryPlanCell
          component="th"
          scope="row"
          data-label={t('subscriptionHistory.plan', {
            type: memberPlan.productType,
          })}
        >
          <PlanName>{memberPlan.name}</PlanName>
        </HistoryPlanCell>

        <HistoryStateCell data-label={t('subscriptionHistory.state')}>
          <HistoryState>
            <SubscriptionStateChip subscription={subscription} />
          </HistoryState>
        </HistoryStateCell>

        <HistoryCell data-label={t('subscriptionHistory.startsAt')}>
          <HistoryDate date={startsAt} />
        </HistoryCell>

        <HistoryCell data-label={t('subscriptionHistory.paidUntil')}>
          {paidUntil && <HistoryDate date={paidUntil} />}
        </HistoryCell>

        <HistoryCell data-label={t('subscriptionHistory.amount')}>
          <HistoryAmount>
            {t('subscriptionHistory.amountPerPeriod', {
              amount: formatCurrency(
                calculatePeriodAmount(monthlyAmount, paymentPeriodicity) / 100,
                memberPlan.currency,
                locale
              ),
              periodicity: extendable ? paymentPeriodicity : undefined,
            })}
          </HistoryAmount>
        </HistoryCell>

        <HistoryCell data-label={t('subscriptionHistory.paymentMethod')}>
          {paymentMethod && paymentMethodLabel(t, paymentMethod)}
        </HistoryCell>

        <HistoryCell data-label={t('subscriptionHistory.renewal')}>
          {autoRenew && !deactivation ?
            t('subscriptionHistory.renews')
          : t('subscriptionHistory.ends')}
        </HistoryCell>
      </SubscriptionHistoryMainRow>

      <SubscriptionHistoryActionRow onClick={toggleFromClick}>
        <HistoryCell
          colSpan={HISTORY_COLUMNS}
          data-label=""
        >
          <SubscriptionHistoryActionBar>
            <SubscriptionHistoryActions>
              <SubscriptionActions
                {...subscription}
                variant="table"
                actions={IMMEDIATE_ACTIONS}
                paymentMethodLabel={method => paymentMethodLabel(t, method)}
                openInvoiceTotal={openInvoiceTotal}
                cancel={async () => await onCancel?.(id)}
                reactivate={
                  onReactivate ? async () => await onReactivate(id) : undefined
                }
                revertUpgrade={
                  onRevertUpgrade ?
                    async () => await onRevertUpgrade(id)
                  : undefined
                }
                extend={async () => await onExtend?.(id)}
                changePaymentMethod={
                  onChangePaymentMethod ?
                    async paymentMethodId =>
                      await onChangePaymentMethod(id, paymentMethodId)
                  : undefined
                }
                cancelPaymentMethodChange={onCancelPaymentMethodChange}
              />
            </SubscriptionHistoryActions>

            {/* every row has it, so it keeps the far right; everything else
                is on the subscription's edit page */}
            <Button
              variant="outlined"
              color="primary"
              LinkComponent={BuilderLink}
              href={url}
              data-edit="true"
            >
              {t('subscriptionHistory.edit', { type: memberPlan.productType })}
            </Button>
          </SubscriptionHistoryActionBar>
        </HistoryCell>
      </SubscriptionHistoryActionRow>

      {/* rows of this table, also while closed (the stacked layout shows
          them); its payment dialog is a portal */}
      <InvoiceListContainer
        filter={filterInvoices}
        List={InvoiceList}
      />
    </SubscriptionHistoryBody>
  );
}

/**
 * All of a reader's subscriptions with their invoices: running ones first,
 * ended ones on request. A subscription with an open invoice starts opened.
 * Takes the props of the builder's SubscriptionList, so
 * SubscriptionListContainer can render it (`List={SubscriptionHistory}`).
 */
export function SubscriptionHistory({
  data,
  error,
  invoices,
  subscribeUrl,
  className,
  type = ProductType.Subscription,
  ...actions
}: BuilderSubscriptionListProps & {
  /** What the list holds, for its wording: subscriptions or donations. */
  type?: ProductType;
}) {
  const {
    elements: { Alert, Button, Link },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [showEnded, setShowEnded] = useState(false);

  const userInvoices = invoices.data?.userInvoices;

  // those with a due invoice first: arriving from the navbar's warning, the
  // invoice is in view
  const [running, ended] = useMemo(() => {
    const now = new Date();
    const withDue = new Set(
      (userInvoices ?? [])
        .filter(invoice => isInvoiceDue(invoice, userInvoices ?? []))
        .map(invoice => invoice.subscriptionID)
    );
    const sorted = [...(data?.userSubscriptions ?? [])].sort(
      (a, b) =>
        Number(withDue.has(b.id)) - Number(withDue.has(a.id)) ||
        compareSubscriptions(a, b, now)
    );

    return [
      sorted.filter(subscription => !isSubscriptionDeactivated(subscription)),
      sorted.filter(isSubscriptionDeactivated),
    ];
  }, [data, userInvoices]);

  const openInvoiceTotal = (subscriptionId: string) =>
    invoices.data?.userInvoices.find(
      invoice =>
        invoice.subscriptionID === subscriptionId && isInvoiceOpen(invoice)
    )?.total;

  // opened when the reader has to act on one of its invoices, not for one
  // left over from before later payments
  const hasDueInvoice = (subscriptionId: string) =>
    !!invoices.data?.userInvoices.some(
      invoice =>
        invoice.subscriptionID === subscriptionId &&
        isInvoiceDue(invoice, invoices.data?.userInvoices ?? [])
    );

  const rows = (subscriptions: FullSubscriptionFragment[]) =>
    subscriptions.map(subscription => {
      const total = openInvoiceTotal(subscription.id);
      const expanded =
        toggled[subscription.id] ?? hasDueInvoice(subscription.id);

      return (
        <SubscriptionHistoryRow
          key={subscription.id}
          subscription={subscription}
          expanded={expanded}
          onToggle={() =>
            setToggled(state => ({ ...state, [subscription.id]: !expanded }))
          }
          openInvoiceTotal={total}
          {...actions}
        />
      );
    });

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  if (!running.length && !ended.length) {
    return (
      <SubscriptionHistoryWrapper className={className}>
        <strong>
          {t('subscriptionHistory.noSubscriptions')}{' '}
          <Link href={subscribeUrl}>{t('subscription.subscribeNow')}</Link>
        </strong>
      </SubscriptionHistoryWrapper>
    );
  }

  return (
    <SubscriptionHistoryWrapper className={className}>
      <SubscriptionHistoryTable>
        <TableHead>
          <TableRow>
            <HistoryArrowCell />
            <HistoryPlanCell>
              {t('subscriptionHistory.plan', { type })}
            </HistoryPlanCell>
            <HistoryStateCell>
              {t('subscriptionHistory.state')}
            </HistoryStateCell>
            <HistoryCell>{t('subscriptionHistory.startsAt')}</HistoryCell>
            <HistoryCell>{t('subscriptionHistory.paidUntil')}</HistoryCell>
            <HistoryCell>{t('subscriptionHistory.amount')}</HistoryCell>
            <HistoryCell>{t('subscriptionHistory.paymentMethod')}</HistoryCell>
            <HistoryCell>{t('subscriptionHistory.renewal')}</HistoryCell>
          </TableRow>
        </TableHead>

        {rows(running)}
        {showEnded && rows(ended)}

        <TableBody>
          {/* donations: the subscriptions above already offer it */}
          {!!running.length && type !== ProductType.Donation && (
            <SubscriptionHistorySubscribeRow>
              <HistoryCell
                colSpan={HISTORY_COLUMNS}
                data-label=""
              >
                <SubscriptionHistorySubscribe>
                  {/* accent: not one of the subscription's own actions */}
                  <Button
                    LinkComponent={BuilderLink}
                    href={subscribeUrl}
                    color="accent"
                  >
                    {t('user.subscribeAnother')}
                  </Button>
                </SubscriptionHistorySubscribe>
              </HistoryCell>
            </SubscriptionHistorySubscribeRow>
          )}
        </TableBody>
      </SubscriptionHistoryTable>

      {!!ended.length && (
        <div>
          <Button
            variant="text"
            onClick={() => setShowEnded(show => !show)}
          >
            {t('subscriptionHistory.ended', { count: ended.length, type })}
          </Button>
        </div>
      )}
    </SubscriptionHistoryWrapper>
  );
}
