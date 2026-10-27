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
import {
  MdEdit,
  MdKeyboardArrowDown,
  MdKeyboardArrowRight,
} from 'react-icons/md';

import { formatCurrency } from '../formatters/format-currency';
import { calculatePeriodAmount } from '../formatters/format-payment-period';
import { InvoiceListContainer } from '../invoice-list/invoice-list-container';
import {
  IMMEDIATE_ACTIONS,
  SubscriptionActions,
  SubscriptionListItemActions,
} from '../subscription-list/subscription-actions';
import { isSubscriptionDeactivated } from '../subscription-state';
import {
  HISTORY_COLUMNS,
  HistoryAmount,
  HistoryArrowCell,
  HistoryCell,
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
 * The data row of a subscription: one block with its action row below. A click
 * on it opens or closes the invoices, like the arrow.
 */
export const SubscriptionHistoryMainRow = styled(TableRow)`
  cursor: pointer;

  && > td,
  && > th {
    border-bottom: none;
  }

  // the whole block, also when its action row is hovered; lighter than the
  // header rows, so it does not read as one
  &:hover > td,
  &:hover > th,
  &:has(+ tr:hover) > td,
  &:has(+ tr:hover) > th {
    background-color: ${({ theme }) => alpha(theme.palette.common.black, 0.02)};
  }
`;

/** The actions below the data row: part of the same block on hover and click. */
export const SubscriptionHistoryActionRow = styled(TableRow)`
  cursor: pointer;

  &:hover > td,
  ${SubscriptionHistoryMainRow}:hover + && > td {
    background-color: ${({ theme }) => alpha(theme.palette.common.black, 0.02)};
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

/** In the table, so it lines up with the actions' last button. */
export const SubscriptionHistorySubscribeRow = styled(TableRow)`
  && > td {
    border-bottom: none;
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
    date,
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
      />
    ),
    [url]
  );

  return (
    <>
      <SubscriptionHistoryMainRow onClick={toggleFromClick}>
        <HistoryArrowCell data-label="">
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
        </HistoryArrowCell>

        <HistoryPlanCell
          component="th"
          scope="row"
          data-label={t('subscriptionHistory.plan')}
        >
          <PlanName>{memberPlan.name}</PlanName>
        </HistoryPlanCell>

        {/* like the editor's user view: editing next to the plan */}
        <HistoryCell data-label={t('subscriptionHistory.action')}>
          <Tooltip
            title={t('subscriptionHistory.edit')}
            placement="top"
          >
            <IconButton
              size="small"
              LinkComponent={BuilderLink}
              href={url}
              aria-label={t('subscriptionHistory.edit')}
            >
              <MdEdit size={16} />
            </IconButton>
          </Tooltip>
        </HistoryCell>

        <HistoryStateCell data-label={t('subscriptionHistory.state')}>
          <HistoryState>
            <SubscriptionStateChip subscription={subscription} />
          </HistoryState>
        </HistoryStateCell>

        <HistoryCell data-label={t('subscriptionHistory.startsAt')}>
          <time
            suppressHydrationWarning
            dateTime={startsAt}
          >
            {date.format(new Date(startsAt), false)}
          </time>
        </HistoryCell>

        <HistoryCell data-label={t('subscriptionHistory.paidUntil')}>
          {paidUntil && (
            <time
              suppressHydrationWarning
              dateTime={paidUntil}
            >
              {date.format(new Date(paidUntil), false)}
            </time>
          )}
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
          {paymentMethod?.name}
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
          <SubscriptionHistoryActions>
            {/* the rest is on the subscription's edit page (pencil) */}
            <SubscriptionActions
              {...subscription}
              actions={IMMEDIATE_ACTIONS}
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
        </HistoryCell>
      </SubscriptionHistoryActionRow>

      {/* rows of this table; its payment dialog is a portal */}
      {expanded && (
        <InvoiceListContainer
          filter={filterInvoices}
          List={InvoiceList}
        />
      )}
    </>
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
            <HistoryCell>{t('subscriptionHistory.action')}</HistoryCell>
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

        <TableBody>
          {rows(running)}
          {showEnded && rows(ended)}

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
