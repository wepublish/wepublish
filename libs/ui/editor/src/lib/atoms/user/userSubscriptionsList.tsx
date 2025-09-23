/** @jsxImportSource @emotion/react */

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import {
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
import { Link } from 'react-router-dom';
import {
  Button,
  Divider,
  FlexboxGrid,
  IconButton,
  Panel as RPanel,
} from 'rsuite';

// import {NewSubscriptionButton} from '../../routes/subscriptionList'
import {
  createCheckedPermissionComponent,
  useAuthorisation,
} from '../permissionControl';

const NewSubscriptionButtonWrapper = styled.div`
  margin-top: 20px;
`;

const KeyboardArrow = styled(MdOutlineKeyboardArrowRight)`
  margin: 0px 5px;
`;

const PanelMBottom = styled(RPanel)`
  margin-bottom: 10px;
`;

const PanelMTop = styled(RPanel)`
  margin-top: 5px;
`;

const commonIconMargin = css`
  margin-right: 5px;
`;

const FlexItemAlignRight = styled(FlexboxGrid.Item)`
  text-align: right;
`;

const FlexItemAlignSelf = styled(FlexboxGrid.Item)`
  align-self: center;
`;

const SubscriptionDetails = styled(FlexboxGrid.Item)`
  margin-top: 10px;
  padding-right: 5px;
`;

const InvoicesPeriods = styled(FlexboxGrid.Item)`
  margin-top: 10px;
  padding-left: 5px;
`;

const Periods = styled(FlexboxGrid.Item)`
  max-height: 400px;
  overflow-y: auto;
  margin-top: 5px;
`;

const FlexItemMLeft = styled(FlexboxGrid.Item)`
  margin-left: 10px;
`;

interface UserSubscriptionsProps {
  subscriptions?: UserSubscriptionFragment[] | null;
  userId?: string;
}

export const NewSubscriptionButton = ({
  isLoading,
  t,
  userId,
}: {
  isLoading?: boolean;
  t: TFunction<'translation'>;
  userId?: string;
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
        {t('subscriptionList.overview.newSubscription')}
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
  function autoRenewalView(subscription: UserSubscriptionFragment) {
    if (subscription.autoRenew && !subscription.deactivation) {
      return (
        <>
          <MdRefresh css={commonIconMargin} />
          {t('userSubscriptionList.subscriptionIsAutoRenewed')}
          .&nbsp;
          {getDeactivationString(subscription)}
        </>
      );
    }
    // subscription is not auto renewed
    return (
      <>
        <MdDisabledByDefault css={commonIconMargin} />
        {t('userSubscriptionList.noAutoRenew')}
        .&nbsp;
        {getDeactivationString(subscription)}
      </>
    );
  }

  function getDeactivationString(subscription: UserSubscriptionFragment) {
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
    }
  }

  function paidUntilView(subscription: UserSubscriptionFragment) {
    if (subscription.paidUntil) {
      return t('userSubscriptionList.paidUntil', {
        date: new Intl.DateTimeFormat('de-CH').format(
          new Date(subscription.paidUntil)
        ),
      });
    }
    return t('userSubscriptionList.invoiceUnpaid');
  }

  function paymentPeriodicity(subscription: UserSubscriptionFragment) {
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

  function getInvoiceView(
    subscription: UserSubscriptionFragment,
    invoiceId: string
  ) {
    const invoice = subscription.invoices.find(
      invoice => invoice.id === invoiceId
    );
    if (!invoice) {
      return t('userSubscriptionList.unexpectedErrorNoInvoice');
    }
    return (
      <div>
        {t('userSubscriptionList.invoiceNr', { invoiceId: invoice.id })} &nbsp;
        <b style={invoice.paidAt ? { color: 'green' } : { color: 'red' }}>
          {invoice.paidAt ?
            t('userSubscriptionList.invoicePaid')
          : t('userSubscriptionList.invoiceUnpaid')}
        </b>
      </div>
    );
  }

  return (
    <>
      {subscriptions?.map(subscription => (
        <div key={subscription.id}>
          <FlexboxGrid>
            {/* member plan name */}
            <FlexItemAlignSelf colspan={18}>
              <h5>
                {t('userSubscriptionList.subscriptionTitle', {
                  memberPlanName: subscription.memberPlan.name,
                  subscriptionId: subscription.id,
                })}
              </h5>
            </FlexItemAlignSelf>
            {/* edit subscription */}
            <FlexItemAlignRight colspan={6}>
              <Link
                to={`/subscriptions/edit/${subscription.id}?userId=${userId}`}
              >
                <Button appearance="ghost">
                  <MdEdit /> {t('userSubscriptionList.editSubscription')}
                </Button>
              </Link>
            </FlexItemAlignRight>
            {/* subscription details */}
            <SubscriptionDetails colspan={12}>
              <FlexboxGrid>
                {/* subscription details title */}
                <FlexItemMLeft colspan={24}>
                  <h6>{t('userSubscriptionList.aboDetails')}</h6>
                </FlexItemMLeft>
                <PanelMTop bordered>
                  {/* created at */}
                  <FlexboxGrid.Item colspan={24}>
                    <MdEvent css={commonIconMargin} />
                    {t('userSubscriptionList.subscriptionCreatedAt', {
                      date: new Intl.DateTimeFormat('de-CH').format(
                        new Date(subscription.createdAt)
                      ),
                    })}
                  </FlexboxGrid.Item>
                  {/* starts at */}
                  <FlexboxGrid.Item colspan={24}>
                    <MdEventAvailable css={commonIconMargin} />
                    {t('userSubscriptionList.subscriptionStartsAt', {
                      date: new Intl.DateTimeFormat('de-CH').format(
                        new Date(subscription.startsAt)
                      ),
                    })}
                  </FlexboxGrid.Item>
                  {/* payment periodicity */}
                  <FlexboxGrid.Item colspan={24}>
                    <MdTimelapse css={commonIconMargin} />
                    {t('userSubscriptionList.paymentPeriodicity', {
                      paymentPeriodicity: paymentPeriodicity(subscription),
                    })}
                  </FlexboxGrid.Item>
                  {/* monthly amount */}
                  <FlexboxGrid.Item colspan={24}>
                    <MdCreditCard css={commonIconMargin} />
                    {t('userSubscriptionList.monthlyAmount', {
                      monthlyAmount: (subscription.monthlyAmount / 100).toFixed(
                        2
                      ),
                      currency: subscription.currency,
                    })}
                  </FlexboxGrid.Item>
                  {/* paid until */}
                  <FlexboxGrid.Item colspan={24}>
                    <MdMoneyOff css={commonIconMargin} />
                    {paidUntilView(subscription)}
                  </FlexboxGrid.Item>
                  {/* confirmed */}
                  <FlexboxGrid.Item colspan={24}>
                    {subscription.confirmed ?
                      <>
                        <MdOutlineCheckBox css={commonIconMargin} />
                        {t('userSubscriptionList.confirmed')}
                      </>
                    : <>
                        <MdOutlineCheckBoxOutlineBlank css={commonIconMargin} />
                        {t('userSubscriptionList.unconfirmed')}
                      </>
                    }
                  </FlexboxGrid.Item>
                  {/* auto renewal */}
                  <FlexboxGrid.Item colspan={24}>
                    {autoRenewalView(subscription)}
                  </FlexboxGrid.Item>
                </PanelMTop>
              </FlexboxGrid>
            </SubscriptionDetails>
            {/* periods with invoices */}
            <InvoicesPeriods colspan={12}>
              <FlexboxGrid>
                {/* periods title */}
                <FlexItemMLeft colspan={24}>
                  <h6>{t('userSubscriptionList.periods')}</h6>
                </FlexItemMLeft>
                {/* iterate periods */}
                <Periods colspan={24}>
                  {subscription.periods.map(period => {
                    return (
                      <PanelMBottom
                        key={period.id}
                        bordered
                      >
                        <FlexboxGrid>
                          {/* period created at */}
                          <FlexboxGrid.Item colspan={24}>
                            {t('userSubscriptionList.periodCreatedAt', {
                              date: new Intl.DateTimeFormat('de-CH').format(
                                new Date(period.createdAt)
                              ),
                            })}
                          </FlexboxGrid.Item>
                          {/* period from to dates */}
                          <FlexboxGrid.Item colspan={24}>
                            {t('userSubscriptionList.periodStartsAt', {
                              date: new Intl.DateTimeFormat('de-CH').format(
                                new Date(period.startsAt)
                              ),
                            })}
                            <KeyboardArrow />
                            {t('userSubscriptionList.periodEndsAt', {
                              date: new Intl.DateTimeFormat('de-CH').format(
                                new Date(period.endsAt)
                              ),
                            })}
                          </FlexboxGrid.Item>
                          {/* amount */}
                          <FlexboxGrid.Item colspan={24}>
                            {t('userSubscriptionList.periodAmount', {
                              amount: (period.amount / 100).toFixed(2),
                              currency: subscription.currency,
                            })}
                          </FlexboxGrid.Item>
                          {/* related invoice */}
                          <FlexboxGrid.Item colspan={24}>
                            {getInvoiceView(subscription, period.invoiceID)}
                          </FlexboxGrid.Item>
                        </FlexboxGrid>
                      </PanelMBottom>
                    );
                  })}
                </Periods>
              </FlexboxGrid>
            </InvoicesPeriods>
          </FlexboxGrid>
          <Divider />
        </div>
      ))}

      <NewSubscriptionButtonWrapper>
        {NewSubscriptionButton({ t, userId })}
      </NewSubscriptionButtonWrapper>
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
