import styled from '@emotion/styled';
import { SubscriptionDeactivationReason } from '@wepublish/website/api';
import {
  BuilderSubscriptionListItemProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import {
  MdAttachMoney,
  MdCreditCard,
  MdAutorenew,
  MdCalendarMonth,
  MdCancel,
  MdHistory,
  MdOutlinePayments,
  MdTimelapse,
} from 'react-icons/md';
import { formatCurrency } from '../formatters/format-currency';
import { calculatePeriodAmount } from '../formatters/format-payment-period';
import { Trans, useTranslation } from 'react-i18next';
import { SubscriptionActions } from './subscription-actions';
import { SubscriptionReward } from './subscription-reward';

export const SubscriptionListItemWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  overflow: hidden;
  container-type: inline-size;
`;

export const SubscriptionListItemContent = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)};
`;

export const SubscriptionListItemMeta = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const SubscriptionListItemMetaItem = styled('li')`
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  justify-content: start;
  gap: ${({ theme }) => theme.spacing(1)};
`;

// Used to hide it on demand by medias
export const SubscriptionListItemPaymentPeriodicity = styled(
  SubscriptionListItemMetaItem
)``;

export function SubscriptionListItem({
  autoRenew,
  startsAt,
  paidUntil,
  paymentPeriodicity,
  monthlyAmount,
  deactivation,
  memberPlan,
  paymentMethod,
  pendingPaymentMethodChange,
  canRenewPaymentMethod,
  extendable,
  url,
  cancel,
  reactivate,
  revertUpgrade,
  canRevertUpgrade,
  canExtend,
  externalReward,
  extend,
  changePaymentMethod,
  cancelPaymentMethodChange,
  openInvoiceTotal,
  className,
}: BuilderSubscriptionListItemProps) {
  const { image, name, currency, productType } = memberPlan;
  const {
    meta: { locale },
    elements: { Image, H6, Link },
    date,
  } = useWebsiteBuilder();
  const { t } = useTranslation();

  const periodicityTimeline = t(
    `subscription.paymentTimeline.${paymentPeriodicity || 'yearly'}`
  );
  const subscriptionDuration = t(
    `subscription.paymentPeriod.${paymentPeriodicity || 'yearly'}`
  );

  return (
    <SubscriptionListItemWrapper className={className}>
      {image && <Image image={image} />}

      <SubscriptionListItemContent>
        <H6>{name}</H6>

        <SubscriptionListItemMeta>
          <SubscriptionListItemMetaItem>
            <MdCalendarMonth />

            <span>
              <Trans
                i18nKey="subscription.startsAt"
                values={{
                  type: productType,
                  startsAt: date.format(new Date(startsAt)),
                }}
                components={{
                  time: (
                    <time
                      suppressHydrationWarning
                      dateTime={startsAt}
                    />
                  ),
                }}
              />
            </span>
          </SubscriptionListItemMetaItem>

          {paidUntil && (
            <SubscriptionListItemMetaItem>
              <MdOutlinePayments />
              <span>
                {t('subscription.paidUntil')}{' '}
                <time
                  suppressHydrationWarning
                  dateTime={paidUntil}
                >
                  {date.format(new Date(paidUntil))}
                </time>
              </span>
            </SubscriptionListItemMetaItem>
          )}

          {deactivation && (
            <>
              <SubscriptionListItemMetaItem>
                <MdCancel />
                <span>
                  {t('subscription.cancelledOn')}{' '}
                  <time
                    suppressHydrationWarning
                    dateTime={deactivation.date}
                  >
                    {date.format(new Date(deactivation.date))}
                  </time>
                </span>
              </SubscriptionListItemMetaItem>

              {deactivation.reason ===
                SubscriptionDeactivationReason.InvoiceNotPaid && (
                <SubscriptionListItemMetaItem>
                  <MdCancel /> {t('subscription.cancelledDueToInvoiceNotPaid')}
                </SubscriptionListItemMetaItem>
              )}

              {deactivation.reason === SubscriptionDeactivationReason.None && (
                <SubscriptionListItemMetaItem>
                  <MdCancel /> {t('subscription.cancelledDueToUnknownReason')}
                </SubscriptionListItemMetaItem>
              )}
            </>
          )}

          {!paidUntil && (
            <SubscriptionListItemMetaItem>
              <MdOutlinePayments />

              {t('subscription.unpaid', {
                type: productType,
              })}
            </SubscriptionListItemMetaItem>
          )}

          {autoRenew && (
            <SubscriptionListItemMetaItem>
              <MdAutorenew />{' '}
              {t('subscription.autoRenew', {
                periodicityTimeline,
              })}
            </SubscriptionListItemMetaItem>
          )}

          {!autoRenew && (
            <SubscriptionListItemPaymentPeriodicity>
              <MdTimelapse />{' '}
              {t('subscription.validFor', {
                subscriptionDuration,
              })}
            </SubscriptionListItemPaymentPeriodicity>
          )}

          <SubscriptionListItemMetaItem>
            <MdAttachMoney />
            {t('subscription.costs', {
              amount: formatCurrency(
                calculatePeriodAmount(monthlyAmount, paymentPeriodicity) / 100,
                currency,
                locale
              ),
              extendable,
              periodicity: paymentPeriodicity,
            })}
          </SubscriptionListItemMetaItem>

          {paymentMethod?.name && (
            <SubscriptionListItemMetaItem>
              <MdCreditCard />
              {t('subscription.paymentMethod', {
                paymentMethod: paymentMethod.name,
              })}
            </SubscriptionListItemMetaItem>
          )}

          <SubscriptionListItemMetaItem>
            <MdHistory />{' '}
            <Link href={url}>{t('subscription.detailsAndPayments')}</Link>
          </SubscriptionListItemMetaItem>
        </SubscriptionListItemMeta>

        <SubscriptionActions
          autoRenew={autoRenew}
          paidUntil={paidUntil}
          paymentPeriodicity={paymentPeriodicity}
          deactivation={deactivation}
          memberPlan={memberPlan}
          paymentMethod={paymentMethod}
          pendingPaymentMethodChange={pendingPaymentMethodChange}
          canRenewPaymentMethod={canRenewPaymentMethod}
          extendable={extendable}
          cancel={cancel}
          reactivate={reactivate}
          revertUpgrade={revertUpgrade}
          canRevertUpgrade={canRevertUpgrade}
          canExtend={canExtend}
          extend={extend}
          changePaymentMethod={changePaymentMethod}
          cancelPaymentMethodChange={cancelPaymentMethodChange}
          openInvoiceTotal={openInvoiceTotal}
        >
          <SubscriptionReward externalReward={externalReward} />
        </SubscriptionActions>
      </SubscriptionListItemContent>
    </SubscriptionListItemWrapper>
  );
}
