import { css } from '@emotion/react';
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
import { Link } from 'react-router-dom';
import { Button, Col, Divider, IconButton, Panel as RPanel, Row } from 'rsuite';

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

const FlexItemAlignRight = styled(Col)`
  text-align: right;
`;

const FlexItemAlignSelf = styled(Col)`
  align-self: center;
`;

const SubscriptionDetails = styled(Col)`
  margin-top: 10px;
  padding-right: 5px;
`;

const InvoicesPeriods = styled(Col)`
  margin-top: 10px;
  padding-left: 5px;
`;

const Periods = styled(Col)`
  max-height: 400px;
  overflow-y: auto;
  margin-top: 5px;
`;

const FlexItemMLeft = styled(Col)`
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
  function autoRenewalView(subscription: FullSubscriptionFragment) {
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
        &nbsp;
        <strong style={period.isPaid ? { color: 'green' } : { color: 'red' }}>
          {period.isPaid ?
            t('userSubscriptionList.invoicePaid')
          : t('userSubscriptionList.invoiceUnpaid')}
        </strong>
      </div>
    );
  }

  return (
    <>
      {subscriptions?.map(subscription => (
        <div key={subscription.id}>
          <Row>
            {/* member plan name */}
            <FlexItemAlignSelf span={18}>
              <h5>
                {t('userSubscriptionList.subscriptionTitle', {
                  memberPlanName: subscription.memberPlan.name,
                  subscriptionId: subscription.id,
                })}
              </h5>
            </FlexItemAlignSelf>
            {/* edit subscription */}
            <FlexItemAlignRight span={6}>
              <Link
                to={`/subscriptions/edit/${subscription.id}?userId=${userId}`}
              >
                <Button appearance="ghost">
                  <MdEdit /> {t('userSubscriptionList.editSubscription')}
                </Button>
              </Link>
            </FlexItemAlignRight>
            {/* subscription details */}
            <SubscriptionDetails span={12}>
              <Row>
                {/* subscription details title */}
                <FlexItemMLeft span={24}>
                  <h6>{t('userSubscriptionList.aboDetails')}</h6>
                </FlexItemMLeft>
                <PanelMTop bordered>
                  {/* created at */}
                  <Col span={24}>
                    <MdEvent css={commonIconMargin} />
                    {t('userSubscriptionList.subscriptionCreatedAt', {
                      date: new Intl.DateTimeFormat('de-CH').format(
                        new Date(subscription.createdAt)
                      ),
                    })}
                  </Col>
                  {/* starts at */}
                  <Col span={24}>
                    <MdEventAvailable css={commonIconMargin} />
                    {t('userSubscriptionList.subscriptionStartsAt', {
                      date: new Intl.DateTimeFormat('de-CH').format(
                        new Date(subscription.startsAt)
                      ),
                    })}
                  </Col>
                  {/* payment periodicity */}
                  <Col span={24}>
                    <MdTimelapse css={commonIconMargin} />
                    {t('userSubscriptionList.paymentPeriodicity', {
                      paymentPeriodicity: paymentPeriodicity(subscription),
                    })}
                  </Col>
                  {/* monthly amount */}
                  <Col span={24}>
                    <MdCreditCard css={commonIconMargin} />
                    {t('userSubscriptionList.monthlyAmount', {
                      monthlyAmount: (subscription.monthlyAmount / 100).toFixed(
                        2
                      ),
                      currency: subscription.currency,
                    })}
                  </Col>
                  {/* paid until */}
                  <Col span={24}>
                    <MdMoneyOff css={commonIconMargin} />
                    {paidUntilView(subscription)}
                  </Col>
                  {/* confirmed */}
                  <Col span={24}>
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
                  </Col>
                  {/* auto renewal */}
                  <Col span={24}>{autoRenewalView(subscription)}</Col>
                </PanelMTop>
              </Row>
            </SubscriptionDetails>

            {/* periods with invoices */}
            <InvoicesPeriods span={12}>
              <Row>
                {/* periods title */}
                <FlexItemMLeft span={24}>
                  <h6>{t('userSubscriptionList.periods')}</h6>
                </FlexItemMLeft>
                {/* iterate periods */}
                <Periods span={24}>
                  {subscription.periods.map(period => {
                    return (
                      <PanelMBottom
                        key={period.id}
                        bordered
                      >
                        <Row>
                          {/* period created at */}
                          <Col span={24}>
                            {t('userSubscriptionList.periodCreatedAt', {
                              date: new Intl.DateTimeFormat('de-CH').format(
                                new Date(period.createdAt)
                              ),
                            })}
                          </Col>
                          {/* period from to dates */}
                          <Col span={24}>
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
                          </Col>
                          {/* amount */}
                          <Col span={24}>
                            {t('userSubscriptionList.periodAmount', {
                              amount: (period.amount / 100).toFixed(2),
                              currency: subscription.currency,
                            })}
                          </Col>
                          {/* related invoice */}
                          <Col span={24}>{getInvoiceView(period)}</Col>
                        </Row>
                      </PanelMBottom>
                    );
                  })}
                </Periods>
              </Row>
            </InvoicesPeriods>
          </Row>
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
