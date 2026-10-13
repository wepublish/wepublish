import styled from '@emotion/styled';
import {
  FullSubscriptionFragment,
  PaymentPeriodicity,
  SubscriptionDeactivationReason,
  UserSubscriptionFragment,
} from '@wepublish/editor/api';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  MdAdd,
  MdCreditCard,
  MdDisabledByDefault,
  MdEdit,
  MdEvent,
  MdEventAvailable,
  MdMoneyOff,
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank,
  MdOutlineKeyboardArrowRight,
  MdRefresh,
  MdTimelapse,
} from 'react-icons/md';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, IconButton } from 'rsuite';

// import {NewSubscriptionButton} from '../../routes/subscriptionList'
import {
  createCheckedPermissionComponent,
  useAuthorisation,
} from '../permissionControl';

const NewSubscriptionButtonWrapper = styled.div`
  margin-bottom: 4px;
`;

const KeyboardArrow = styled(MdOutlineKeyboardArrowRight)`
  margin: 0px 5px;
  vertical-align: middle;
`;

const Scroller = styled.div`
  position: relative;
  overflow-y: auto;
  margin-inline: -4px;
  padding-inline: 4px;
`;

const SubscriptionItem = styled.section`
  container: subscription / inline-size;
  padding: 20px 0;

  & + & {
    border-top: 1px solid var(--rs-border-primary);
  }
`;

const SubscriptionHeader = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  margin-bottom: 14px;
`;

const SubscriptionTitle = styled.h3`
  flex: 1 1 220px;
  min-width: 0;
  margin: 0;
  font-size: 1.0625rem;
  line-height: 1.5rem;
  font-weight: 400;
  overflow-wrap: anywhere;

  strong {
    font-weight: 650;
  }
`;

const SubscriptionBody = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;

  @container subscription (max-width: 440px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Card = styled.div`
  padding: 16px;
  border: 1px solid var(--rs-border-primary);
  border-radius: var(--rs-radius-lg);
  background-color: var(--rs-bg-card);
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
`;

const CardTitle = styled.h4`
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.375rem;
  font-weight: 650;
`;

const DetailList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 4px;

  li {
    display: flex;
    gap: 8px;
  }

  svg {
    flex: 0 0 auto;
    margin-top: 3px;
    color: var(--rs-text-secondary);
  }
`;

const Periods = styled.div`
  position: relative;
  min-height: 240px;

  @container subscription (max-width: 440px) {
    min-height: 0;
  }
`;

const PeriodsScroll = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding-right: 4px;

  @container subscription (max-width: 440px) {
    position: static;
    max-height: 360px;
  }
`;

const PeriodLines = styled.div`
  display: grid;
  gap: 2px;
`;

const Badge = styled.span<{ tone: 'success' | 'error' }>`
  display: inline-block;
  flex: 0 0 auto;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.25rem;
  white-space: nowrap;
  vertical-align: middle;
  color: ${({ tone }) =>
    tone === 'success' ?
      'var(--wep-state-published-text, var(--rs-state-success))'
    : 'var(--rs-state-error)'};
  background-color: ${({ tone }) =>
    `rgb(from var(--rs-state-${tone}) r g b / 15%)`};
`;

const MAX_VISIBLE_SUBSCRIPTIONS = 2;
const SCROLL_PEEK = 40;

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('de-CH').format(new Date(date));

const formatPeriodMonth = (date: string) => {
  const value = new Date(date);

  return `${String(value.getMonth() + 1).padStart(2, '0')}.${value.getFullYear()}`;
};

const sortPeriodsByNewest = (periods: UserSubscriptionFragment['periods']) =>
  [...periods].sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
  );

export type SubscriptionStatus = 'active' | 'expired';

export const getSubscriptionStatus = (
  subscription: Pick<UserSubscriptionFragment, 'deactivation'>,
  now = new Date()
): SubscriptionStatus =>
  (
    subscription.deactivation &&
    new Date(subscription.deactivation.date).getTime() <= now.getTime()
  ) ?
    'expired'
  : 'active';

function useScrollAfter(count: number, visible: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number>();

  useEffect(() => {
    const scroller = ref.current;

    if (!scroller || count <= visible) {
      setMaxHeight(undefined);
      return;
    }

    const measure = () => {
      const boundary = scroller.children[visible] as HTMLElement | undefined;
      setMaxHeight(boundary ? boundary.offsetTop + SCROLL_PEEK : undefined);
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(measure);
    Array.from(scroller.children).forEach(child => observer.observe(child));

    return () => observer.disconnect();
  }, [count, visible]);

  return { ref, maxHeight };
}

interface UserSubscriptionsProps {
  subscriptions?: UserSubscriptionFragment[] | null;
  userId?: string;
}

export const NewSubscriptionButton = ({
  isLoading,
  t,
  userId,
  label,
}: {
  isLoading?: boolean;
  t: TFunction<'translation'>;
  userId?: string;
  label?: string;
}) => {
  const canCreate = useAuthorisation('CAN_CREATE_SUBSCRIPTION');
  const urlToRedirect = `/subscriptions/create${userId ? `${`?userId=${userId}`}` : ''}`;
  return (
    <Link to={urlToRedirect}>
      <IconButton
        appearance="primary"
        disabled={isLoading || !canCreate}
      >
        <MdAdd />
        {label ?? t('subscriptionList.overview.newSubscription')}
      </IconButton>
    </Link>
  );
};

function UserSubscriptionsList({
  subscriptions,
  userId,
}: UserSubscriptionsProps) {
  const { t } = useTranslation();

  /**
   * UI helpers
   */
  function autoRenewalView(subscription: FullSubscriptionFragment) {
    if (subscription.autoRenew && !subscription.deactivation) {
      return (
        <>
          <MdRefresh />
          {t('userSubscriptionList.subscriptionIsAutoRenewed')}
          .&nbsp;
          {getDeactivationString(subscription)}
        </>
      );
    }
    // subscription is not auto renewed
    return (
      <>
        <MdDisabledByDefault />
        {t('userSubscriptionList.noAutoRenew')}
        .&nbsp;
        {getDeactivationString(subscription)}
      </>
    );
  }

  function getDeactivationString(subscription: FullSubscriptionFragment) {
    const deactivation = subscription.deactivation;
    if (deactivation) {
      return (
        <>
          {t('userSubscriptionList.deactivationString', {
            date: new Intl.DateTimeFormat('de-CH').format(
              new Date(deactivation.date)
            ),
            reason: getDeactivationReasonHumanReadable(deactivation.reason),
          })}
        </>
      );
    }
    return t('userSubscriptionList.noDeactivation');
  }

  function getDeactivationReasonHumanReadable(
    deactivationReason: SubscriptionDeactivationReason
  ) {
    switch (deactivationReason) {
      case SubscriptionDeactivationReason.None:
        return t('userSubscriptionList.deactivationReason.None');
      case SubscriptionDeactivationReason.InvoiceNotPaid:
        return t('userSubscriptionList.deactivationReason.InvoiceNotPaid');
      case SubscriptionDeactivationReason.UserSelfDeactivated:
        return t('userSubscriptionList.deactivationReason.UserSelfDeactivated');
      case SubscriptionDeactivationReason.UserReplacedSubscription:
        return t(
          'userSubscriptionList.deactivationReason.UserReplacedSubscription'
        );
      case SubscriptionDeactivationReason.Chargeback:
        return t('userSubscriptionList.deactivationReason.Chargeback');
      default:
        return deactivationReason;
    }
  }

  function paidUntilView(subscription: FullSubscriptionFragment) {
    if (subscription.paidUntil) {
      return t('userSubscriptionList.paidUntil', {
        date: new Intl.DateTimeFormat('de-CH').format(
          new Date(subscription.paidUntil)
        ),
      });
    }
    return t('userSubscriptionList.invoiceUnpaid');
  }

  function paymentPeriodicity(subscription: FullSubscriptionFragment) {
    switch (subscription.paymentPeriodicity) {
      case PaymentPeriodicity.Monthly:
        return t('memberPlanList.paymentPeriodicity.monthly');
      case PaymentPeriodicity.Quarterly:
        return t('memberPlanList.paymentPeriodicity.quarterly');
      case PaymentPeriodicity.Biannual:
        return t('memberPlanList.paymentPeriodicity.biannual');
      case PaymentPeriodicity.Yearly:
        return t('memberPlanList.paymentPeriodicity.yearly');
      case PaymentPeriodicity.Biennial:
        return t('memberPlanList.paymentPeriodicity.biennial');
      case PaymentPeriodicity.Lifetime:
        return t('memberPlanList.paymentPeriodicity.lifetime');
      default:
        return 'Unknown Error';
    }
  }

  function getInvoiceView(period: UserSubscriptionFragment['periods'][0]) {
    return (
      <div>
        {t('userSubscriptionList.invoiceNr', { invoiceId: period.invoiceID })}{' '}
        <Badge tone={period.isPaid ? 'success' : 'error'}>
          {period.isPaid ?
            t('userSubscriptionList.invoicePaid')
          : t('userSubscriptionList.invoiceUnpaid')}
        </Badge>
      </div>
    );
  }

  const sortedSubscriptions = [...(subscriptions ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const scroller = useScrollAfter(
    sortedSubscriptions.length,
    MAX_VISIBLE_SUBSCRIPTIONS
  );

  return (
    <>
      <NewSubscriptionButtonWrapper>
        {NewSubscriptionButton({
          t,
          userId,
          label: t('userSubscriptionList.addSubscription'),
        })}
      </NewSubscriptionButtonWrapper>

      <Scroller
        ref={scroller.ref}
        data-testid="subscription-scroller"
        data-scrollable={sortedSubscriptions.length > MAX_VISIBLE_SUBSCRIPTIONS}
        style={{ maxHeight: scroller.maxHeight }}
      >
        {sortedSubscriptions.map(subscription => {
          const status = getSubscriptionStatus(subscription);

          return (
            <SubscriptionItem key={subscription.id}>
              <SubscriptionHeader>
                {/* member plan name */}
                <SubscriptionTitle>
                  <strong data-testid="subscription-plan">
                    {subscription.memberPlan.name}
                  </strong>{' '}
                  {t('userSubscriptionList.subscriptionNumber', {
                    subscriptionId: subscription.id,
                  })}
                </SubscriptionTitle>
                {/* edit subscription */}
                <Link
                  to={`/subscriptions/edit/${subscription.id}?userId=${userId}`}
                >
                  <Button
                    appearance="ghost"
                    size="sm"
                    startIcon={<MdEdit />}
                  >
                    {t('userSubscriptionList.editSubscription')}
                  </Button>
                </Link>
              </SubscriptionHeader>

              <SubscriptionBody>
                {/* subscription details */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {t('userSubscriptionList.aboDetails')}
                    </CardTitle>
                    <Badge tone={status === 'active' ? 'success' : 'error'}>
                      {t(`userSubscriptionList.status.${status}`)}
                    </Badge>
                  </CardHeader>
                  <DetailList>
                    {/* created at */}
                    <li>
                      <MdEvent />
                      {t('userSubscriptionList.subscriptionCreatedAt', {
                        date: formatDate(subscription.createdAt),
                      })}
                    </li>
                    {/* starts at */}
                    <li>
                      <MdEventAvailable />
                      {t('userSubscriptionList.subscriptionStartsAt', {
                        date: formatDate(subscription.startsAt),
                      })}
                    </li>
                    {/* payment periodicity */}
                    <li>
                      <MdTimelapse />
                      {t('userSubscriptionList.paymentPeriodicity', {
                        paymentPeriodicity: paymentPeriodicity(subscription),
                      })}
                    </li>
                    {/* monthly amount */}
                    <li>
                      <MdCreditCard />
                      {t('userSubscriptionList.monthlyAmount', {
                        monthlyAmount: (
                          subscription.monthlyAmount / 100
                        ).toFixed(2),
                        currency: subscription.currency,
                      })}
                    </li>
                    {/* paid until */}
                    <li>
                      <MdMoneyOff />
                      {paidUntilView(subscription)}
                    </li>
                    {/* confirmed */}
                    <li>
                      {subscription.confirmed ?
                        <>
                          <MdOutlineCheckBox />
                          {t('userSubscriptionList.confirmed')}
                        </>
                      : <>
                          <MdOutlineCheckBoxOutlineBlank />
                          {t('userSubscriptionList.unconfirmed')}
                        </>
                      }
                    </li>
                    {/* auto renewal */}
                    <li>
                      <span>{autoRenewalView(subscription)}</span>
                    </li>
                  </DetailList>
                </Card>

                {/* periods with invoices */}
                <Periods>
                  <PeriodsScroll>
                    {sortPeriodsByNewest(subscription.periods).map(period => (
                      <Card key={period.id}>
                        <CardTitle data-testid="period-title">
                          {t('userSubscriptionList.periodTitle', {
                            date: formatPeriodMonth(period.startsAt),
                          })}
                        </CardTitle>
                        <PeriodLines>
                          {/* period created at */}
                          <div>
                            {t('userSubscriptionList.periodCreatedAt', {
                              date: formatDate(period.createdAt),
                            })}
                          </div>
                          {/* period from to dates */}
                          <div>
                            {t('userSubscriptionList.periodStartsAt', {
                              date: formatDate(period.startsAt),
                            })}
                            <KeyboardArrow />
                            {t('userSubscriptionList.periodEndsAt', {
                              date: formatDate(period.endsAt),
                            })}
                          </div>
                          {/* amount */}
                          <div>
                            {t('userSubscriptionList.periodAmount', {
                              amount: (period.amount / 100).toFixed(2),
                              currency: subscription.currency,
                            })}
                          </div>
                          {/* related invoice */}
                          {getInvoiceView(period)}
                        </PeriodLines>
                      </Card>
                    ))}
                  </PeriodsScroll>
                </Periods>
              </SubscriptionBody>
            </SubscriptionItem>
          );
        })}
      </Scroller>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_SUBSCRIPTION',
  'CAN_GET_SUBSCRIPTIONS',
  'CAN_DELETE_SUBSCRIPTION',
  'CAN_CREATE_SUBSCRIPTION',
])(UserSubscriptionsList);
export { CheckedPermissionComponent as UserSubscriptionsList };
