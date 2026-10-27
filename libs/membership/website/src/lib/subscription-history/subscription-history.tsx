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
import { isSubscriptionDeactivated } from '../subscription-state';
import {
  HISTORY_COLUMNS,
  HISTORY_COLUMNS_SHOWN,
  HISTORY_STACKED,
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

  ${SubscriptionListItemActions} {
    justify-content: flex-end;
  }
`;

/** On the right: editing, then the subscription's own actions. */
export const SubscriptionHistoryActionBar = styled('div')`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(1, 2)};
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

/** The subscription's state; when it ends on hovering (or focusing) it. */
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
          variant={chip.variant}
        />
      </Tooltip>
    : <Chip
        size="small"
        label={t(`subscriptionHistory.states.${state}`)}
        color={chip.color}
        variant={chip.variant}
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
          data-label={t('subscriptionHistory.plan')}
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
            {/* everything else is on the subscription's edit page */}
            <Button
              variant="outlined"
              color="primary"
              LinkComponent={BuilderLink}
              href={url}
            >
              {t('subscriptionHistory.edit')}
            </Button>

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
  ...actions
}: BuilderSubscriptionListProps) {
  const {
    elements: { Alert, Button, Link },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [showEnded, setShowEnded] = useState(false);

  const [running, ended] = useMemo(() => {
    const now = new Date();
    const sorted = [...(data?.userSubscriptions ?? [])].sort((a, b) =>
      compareSubscriptions(a, b, now)
    );

    return [
      sorted.filter(subscription => !isSubscriptionDeactivated(subscription)),
      sorted.filter(isSubscriptionDeactivated),
    ];
  }, [data]);

  const openInvoiceTotal = (subscriptionId: string) =>
    invoices.data?.userInvoices.find(
      invoice =>
        invoice.subscriptionID === subscriptionId && isInvoiceOpen(invoice)
    )?.total;

  const rows = (subscriptions: FullSubscriptionFragment[]) =>
    subscriptions.map(subscription => {
      const total = openInvoiceTotal(subscription.id);
      const expanded = toggled[subscription.id] ?? total != null;

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
      <HistoryTable>
        <TableHead>
          <TableRow>
            <HistoryArrowCell />
            <HistoryPlanCell>{t('subscriptionHistory.plan')}</HistoryPlanCell>
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
          {!!running.length && (
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
      </HistoryTable>

      {!!ended.length && (
        <div>
          <Button
            variant="text"
            onClick={() => setShowEnded(show => !show)}
          >
            {t('subscriptionHistory.ended', { count: ended.length })}
          </Button>
        </div>
      )}
    </SubscriptionHistoryWrapper>
  );
}
