import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { TableBody } from '@mui/material';
import { isInvoiceOpen } from '@wepublish/ui';
import {
  FullInvoiceFragment,
  FullPaymentMethodFragment,
  FullSubscriptionFragment,
  MemberPlanListDocument,
} from '@wepublish/website/api';
import {
  BuilderSubscriptionListProps,
  Link as BuilderLink,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { formatCurrency } from '../formatters/format-currency';
import { calculatePeriodAmount } from '../formatters/format-payment-period';
import { InvoiceListContainer } from '../invoice-list/invoice-list-container';
import { paymentMethodLabel } from '../payment-method-label';
import {
  HistoryTable,
  HistoryTableWrapper,
} from '../subscription-history/history-table';
import { InvoiceHistoryStandalone } from '../subscription-history/invoice-history';
import { SubscriptionStateChip } from '../subscription-history/subscription-history';
import {
  SubscriptionAction,
  SubscriptionActions,
  SubscriptionListItemActions,
  usePaymentMethodActions,
} from '../subscription-list/subscription-actions';
import { SubscriptionReward } from '../subscription-list/subscription-reward';
import { SectionBox, SectionBoxContent } from '../section-box/section-box';
import { canUpgrade } from './can-upgrade';

const PAYMENT_ACTIONS: readonly SubscriptionAction[] = [
  'pendingChange',
  'changePaymentMethod',
  'renewPaymentMethod',
];

const RENEWAL_ACTIONS: readonly SubscriptionAction[] = [
  'extend',
  'reactivate',
  'revertUpgrade',
  'cancel',
];

/** Container the edit page measures itself against. */
export const SubscriptionEditContainer = styled('div')`
  container-type: inline-size;
`;

/**
 * One column; on wide containers the plan on the left, payment and renewal on
 * the right, and the invoices below across both.
 */
export const SubscriptionEditWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  align-items: start;
  grid-template-areas: 'plan' 'payment' 'renewal' 'invoices';

  // the buttons on the right, as in the history's action rows
  ${SectionBoxContent} ${SubscriptionListItemActions} {
    justify-self: stretch;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  @container (min-width: 800px) {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      'plan payment'
      'plan renewal'
      'invoices invoices';
  }
`;

export const SubscriptionEditButtons = styled('div')`
  display: flex;
  justify-content: flex-end;
  justify-self: stretch;
`;

/** Label and value per row, the rows divided like the table's. */
export const SubscriptionEditFacts = styled('dl')`
  display: grid;
  grid-template-columns: max-content 1fr;
  align-items: center;
  justify-self: stretch;

  dt,
  dd {
    margin: 0;
    padding: ${({ theme }) => theme.spacing(1, 0)};
    border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  }

  // the gap is padding, so each row's line runs through
  dt {
    font-weight: 600;
    padding-right: ${({ theme }) => theme.spacing(3)};
  }

  & > :nth-last-child(-n + 2) {
    border-bottom: none;
  }
`;

const PlanName = styled('strong')`
  font-size: 1.125em;
`;

function Section({
  title,
  area,
  table = false,
  children,
}: {
  title: string;
  area: 'plan' | 'payment' | 'renewal' | 'invoices';
  /** Content is a table: no indent of its own. */
  table?: boolean;
  children: ReactNode;
}) {
  return (
    <SectionBox
      title={title}
      table={table}
      style={{ gridArea: area }}
    >
      {children}
    </SectionBox>
  );
}

type SubscriptionEditDetailsProps = {
  subscription: FullSubscriptionFragment;
  openInvoiceTotal?: number;
} & Pick<
  BuilderSubscriptionListProps,
  | 'subscribeUrl'
  | 'onCancel'
  | 'onReactivate'
  | 'onRevertUpgrade'
  | 'onExtend'
  | 'onChangePaymentMethod'
  | 'onCancelPaymentMethodChange'
>;

function SubscriptionEditDetails({
  subscription,
  openInvoiceTotal,
  subscribeUrl,
  onCancel,
  onReactivate,
  onRevertUpgrade,
  onExtend,
  onChangePaymentMethod,
  onCancelPaymentMethodChange,
}: SubscriptionEditDetailsProps) {
  const {
    meta: { locale },
    elements: { Button, Paragraph },
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
    externalReward,
  } = subscription;

  const memberPlans = useQuery(MemberPlanListDocument, {
    variables: { take: 50, filter: { active: true } },
  });
  const upgradeable = canUpgrade(
    subscription,
    memberPlans.data?.memberPlans.nodes ?? []
  );

  const changePaymentMethod =
    onChangePaymentMethod ?
      async (paymentMethodId: string) =>
        await onChangePaymentMethod(id, paymentMethodId)
    : undefined;
  const { canChangePaymentMethod, canRenewCurrentPaymentMethod } =
    usePaymentMethodActions({
      ...subscription,
      changePaymentMethod,
    });

  const filterInvoices = useMemo(
    () => (invoices: FullInvoiceFragment[]) =>
      invoices.filter(({ subscriptionID }) => subscriptionID === id),
    [id]
  );

  const actionProps = {
    ...subscription,
    openInvoiceTotal,
    cancel: async () => await onCancel?.(id),
    reactivate: async () => await onReactivate?.(id),
    revertUpgrade: async () => await onRevertUpgrade?.(id),
    extend: async () => await onExtend?.(id),
    changePaymentMethod,
    cancelPaymentMethodChange: onCancelPaymentMethodChange,
    paymentMethodLabel: (method: FullPaymentMethodFragment) =>
      paymentMethodLabel(t, method),
  };

  const endsOn = (when: string) =>
    t('subscriptionHistory.endsOn', {
      date: date.format(new Date(when), false),
    });
  const renewal =
    deactivation ?
      `${t('subscriptionHistory.states.deactivated')} ${endsOn(deactivation.date)}`
    : autoRenew ?
      t('subscription.autoRenew', {
        periodicityTimeline: t(
          `subscription.paymentTimeline.${paymentPeriodicity || 'yearly'}`
        ),
      })
    : paidUntil ? `${t('subscriptionHistory.ends')} ${endsOn(paidUntil)}`
    : t('subscription.validFor', {
        subscriptionDuration: t(
          `subscription.paymentPeriod.${paymentPeriodicity || 'yearly'}`
        ),
      });

  return (
    <SubscriptionEditWrapper>
      <Section
        title={t('subscriptionEdit.sections.plan')}
        area="plan"
      >
        <PlanName>{memberPlan.name}</PlanName>

        <SubscriptionEditFacts>
          <dt>{t('subscriptionHistory.state')}</dt>
          <dd>
            <SubscriptionStateChip subscription={subscription} />
          </dd>

          <dt>{t('subscriptionHistory.startsAt')}</dt>
          <dd>
            <time
              suppressHydrationWarning
              dateTime={startsAt}
            >
              {date.format(new Date(startsAt), false)}
            </time>
          </dd>

          {paidUntil && (
            <>
              <dt>{t('subscriptionHistory.paidUntil')}</dt>
              <dd>
                <time
                  suppressHydrationWarning
                  dateTime={paidUntil}
                >
                  {date.format(new Date(paidUntil), false)}
                </time>
              </dd>
            </>
          )}

          <dt>{t('subscriptionHistory.amount')}</dt>
          <dd>
            {t('subscriptionHistory.amountPerPeriod', {
              amount: formatCurrency(
                calculatePeriodAmount(monthlyAmount, paymentPeriodicity) / 100,
                memberPlan.currency,
                locale
              ),
              periodicity: extendable ? paymentPeriodicity : undefined,
            })}
          </dd>
        </SubscriptionEditFacts>

        <SubscriptionReward externalReward={externalReward} />

        {upgradeable && (
          <SubscriptionEditButtons>
            <Button
              LinkComponent={BuilderLink}
              href={`${subscribeUrl}?upgradeSubscriptionId=${id}`}
            >
              {t('subscriptionEdit.upgrade')}
            </Button>
          </SubscriptionEditButtons>
        )}
      </Section>

      <Section
        title={t('subscriptionEdit.sections.payment')}
        area="payment"
      >
        {paymentMethod && (
          <Paragraph gutterBottom={false}>
            {t('subscription.paymentMethod', {
              paymentMethod: paymentMethodLabel(t, paymentMethod),
            })}
          </Paragraph>
        )}

        {(
          subscription.pendingPaymentMethodChange ||
          canChangePaymentMethod ||
          canRenewCurrentPaymentMethod
        ) ?
          <SubscriptionActions
            {...actionProps}
            variant="table"
            actions={PAYMENT_ACTIONS}
          />
        : <Paragraph gutterBottom={false}>
            {t('subscriptionEdit.paymentMethodNotChangeable')}
          </Paragraph>
        }
      </Section>

      <Section
        title={t('subscriptionEdit.sections.renewal')}
        area="renewal"
      >
        <Paragraph gutterBottom={false}>{renewal}</Paragraph>

        <SubscriptionActions
          {...actionProps}
          variant="table"
          actions={RENEWAL_ACTIONS}
        />
      </Section>

      <Section
        title={t('subscriptionEdit.sections.invoices')}
        area="invoices"
        table
      >
        <HistoryTableWrapper>
          <HistoryTable>
            <TableBody>
              <InvoiceListContainer
                filter={filterInvoices}
                List={InvoiceHistoryStandalone}
              />
            </TableBody>
          </HistoryTable>
        </HistoryTableWrapper>
      </Section>
    </SubscriptionEditWrapper>
  );
}

/**
 * One subscription with everything a reader can do with it: the plan (and an
 * upgrade, see `canUpgrade`), the payment method, renewal and cancelling, and
 * all its invoices. Takes the props of the builder's SubscriptionList, so
 * `SubscriptionListContainer` filtered to one subscription can render it
 * (`List={SubscriptionEdit}`).
 */
export function SubscriptionEdit({
  data,
  error,
  invoices,
  className,
  ...props
}: BuilderSubscriptionListProps) {
  const {
    elements: { Alert },
  } = useWebsiteBuilder();
  const subscription = data?.userSubscriptions[0];

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  if (!subscription) {
    return null;
  }

  const openInvoiceTotal = invoices.data?.userInvoices.find(
    invoice =>
      invoice.subscriptionID === subscription.id && isInvoiceOpen(invoice)
  )?.total;

  return (
    <SubscriptionEditContainer className={className}>
      <SubscriptionEditDetails
        {...props}
        subscription={subscription}
        openInvoiceTotal={openInvoiceTotal}
      />
    </SubscriptionEditContainer>
  );
}
