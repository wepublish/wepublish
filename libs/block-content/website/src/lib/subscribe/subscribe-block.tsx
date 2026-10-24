import styled from '@emotion/styled';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
  FullBlockFragment,
  FullSubscribeBlockFragment,
  PaymentPeriodicity,
} from '@wepublish/website/api';
import {
  BuilderRouterContext,
  BuilderSubscribeBlockProps,
  BuilderSubscribeProps,
  GiftCodePurchase,
  Subscribe,
  Upgrade,
} from '@wepublish/website/builder';
import { replace, toLower } from 'ramda';
import { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscribeBlock } from './subscribe-block.context';
import { PaymentForm } from '@wepublish/payment/website';
import { GiftCodePurchaseFailure } from '@wepublish/membership/website';

export const isSubscribeBlock = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullSubscribeBlockFragment => block.__typename === 'SubscribeBlock';

const lowercase = replace(/^./, toLower);

export enum SubscribeMode {
  Subscribe = 'subscribe',
  Gift = 'gift',
}

export const SubscribeModeToggle = styled(ToggleButtonGroup)`
  display: flex;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing(3)};
`;

export const SubscribeBlock = ({
  className,
  memberPlans,
  memberPlanRenderSettings,
  fields,
  showGoodies,
  showDiscountCodes,
  goodieMinValue,
  goodieMinValueAppliesToUpgrade,
  hideRepeatGoodieOnUpgrade,
  periodicityDisplay,
  giftCodeOffers,
}: BuilderSubscribeBlockProps) => {
  const { t } = useTranslation();
  const {
    register: [register],
    subscribe,
    purchaseGiftCode,
    resubscribe: [resubscribe],
    upgrade,
    upgradeInfo: [fetchUpgradeInfo, upgradeInfo],
    subscribeInfo: [fetchSubscribeInfo, subscribeInfo],
    stripeClientSecret,
    redirectPages,
    ...subscribeProps
  } = useSubscribeBlock();
  const { userSubscriptions } = subscribeProps;
  const {
    query: {
      memberPlanBySlug,
      firstName,
      mail,
      lastName,
      upgradeSubscriptionId,
      deactivateSubscriptionId,
      userId,
      discountCode,
      periodicity,
      mode,
    },
    replaceQuery,
  } = useContext(BuilderRouterContext);

  const defaultPaymentPeriodicity = useMemo(
    () =>
      Object.values(PaymentPeriodicity).find(
        value =>
          typeof periodicity === 'string' &&
          value.toLowerCase() === periodicity.toLowerCase()
      ) ?? null,
    [periodicity]
  );

  const subscriptionToUpgrade = useMemo(() => {
    return userSubscriptions.data?.userSubscriptions.find(
      subscription =>
        subscription.isActive && subscription.id === upgradeSubscriptionId
    );
  }, [upgradeSubscriptionId, userSubscriptions.data?.userSubscriptions]);

  const hasGiftCodeOffers = !!giftCodeOffers?.length;
  const isGiftMode =
    hasGiftCodeOffers && !subscriptionToUpgrade && mode === SubscribeMode.Gift;
  const lowercaseFields = fields.map(
    lowercase
  ) as BuilderSubscribeProps['fields'];

  const memberPlansObj = useMemo(
    () =>
      ({
        loading: false,
        data: {
          __typename: 'Query',
          memberPlans: {
            __typename: 'PaginatedMemberPlans',
            nodes: memberPlans,
            totalCount: memberPlans.length,
            pageInfo: {
              __typename: 'PageInfo',
              startCursor: null,
              endCursor: null,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          },
        },
      }) satisfies BuilderSubscribeProps['memberPlans'],
    [memberPlans]
  );

  const handleOnSelect = useCallback(
    (memberPlanId: string | undefined, discountCode?: string) => {
      if (memberPlanId) {
        fetchUpgradeInfo({
          variables: {
            memberPlanId,
            subscriptionId: upgradeSubscriptionId as string,
            discountCode,
          },
        });
      }
    },
    [fetchUpgradeInfo, upgradeSubscriptionId]
  );

  return (
    <>
      <PaymentForm
        stripeClientSecret={stripeClientSecret}
        redirectPages={redirectPages}
      />

      {hasGiftCodeOffers && !subscriptionToUpgrade && (
        <SubscribeModeToggle
          exclusive
          value={isGiftMode ? SubscribeMode.Gift : SubscribeMode.Subscribe}
          aria-label={t('subscribe.mode.label')}
          onChange={(_, value: SubscribeMode | null) => {
            if (value) {
              replaceQuery?.({
                mode: value === SubscribeMode.Gift ? value : undefined,
              });
            }
          }}
        >
          <ToggleButton value={SubscribeMode.Subscribe}>
            {t('subscribe.mode.subscribe')}
          </ToggleButton>

          <ToggleButton value={SubscribeMode.Gift}>
            {t('subscribe.mode.gift')}
          </ToggleButton>
        </SubscribeModeToggle>
      )}

      {isGiftMode && <GiftCodePurchaseFailure />}

      {isGiftMode && (
        <GiftCodePurchase
          className={className}
          offers={giftCodeOffers}
          challenge={subscribeProps.challenge}
          fields={lowercaseFields}
          defaults={{ discountCode: discountCode as string | undefined }}
          fetchSubscribeInfo={fetchSubscribeInfo}
          subscribeInfo={subscribeInfo}
          onPurchase={async formData => {
            const result = await purchaseGiftCode({
              variables: formData,
            });

            if (result.error) {
              throw result.error;
            }
          }}
          onPurchaseWithRegister={async formData => {
            const { error: registerError } = await register({
              variables: formData.register,
            });

            if (registerError) {
              throw registerError;
            }

            const result = await purchaseGiftCode({
              variables: formData.purchase,
            });

            if (result.error) {
              throw result.error;
            }
          }}
        />
      )}

      {!subscriptionToUpgrade && !isGiftMode && (
        <Subscribe
          {...subscribeProps}
          className={className}
          memberPlans={memberPlansObj}
          fields={lowercaseFields}
          memberPlanRenderSettings={memberPlanRenderSettings}
          showGoodies={showGoodies}
          showDiscountCodes={showDiscountCodes}
          goodieMinValue={goodieMinValue}
          periodicityDisplay={periodicityDisplay}
          defaults={{
            email: mail as string | undefined,
            firstName: firstName as string | undefined,
            name: lastName as string | undefined,
            memberPlanSlug: memberPlanBySlug as string | undefined,
            paymentPeriodicity: defaultPaymentPeriodicity,
            discountCode: discountCode as string | undefined,
          }}
          fetchSubscribeInfo={fetchSubscribeInfo}
          subscribeInfo={subscribeInfo}
          onSubscribe={async formData => {
            const selectedMemberplan = memberPlans.find(
              mb => mb.id === formData.memberPlanId
            );

            const result = await subscribe(selectedMemberplan, {
              variables: {
                ...formData,
              },
            });

            if (result.error) {
              throw result.error;
            }
          }}
          onSubscribeWithRegister={async formData => {
            const { error: registerError } = await register({
              variables: formData.register,
            });

            if (registerError) {
              throw registerError;
            }

            const selectedMemberplan = memberPlans.find(
              mb => mb.id === formData.subscribe.memberPlanId
            );

            const result = await subscribe(selectedMemberplan, {
              variables: {
                ...formData.subscribe,
              },
            });

            if (result.error) {
              throw result.error;
            }
          }}
          onResubscribe={async formData => {
            const selectedMemberplan = memberPlans.find(
              mb => mb.id === formData.memberPlanId
            );

            await resubscribe({
              variables: formData,
              async onCompleted() {
                window.location.href =
                  selectedMemberplan?.confirmationPage?.url ?? '';
              },
            });
          }}
          deactivateSubscriptionId={deactivateSubscriptionId as string}
          returningUserId={userId as string}
        />
      )}

      {subscriptionToUpgrade && (
        <Upgrade
          {...subscribeProps}
          defaults={{
            memberPlanSlug: memberPlanBySlug as string | undefined,
            discountCode: discountCode as string | undefined,
          }}
          className={className}
          memberPlans={memberPlansObj}
          memberPlanRenderSettings={memberPlanRenderSettings}
          showGoodies={showGoodies}
          showDiscountCodes={showDiscountCodes}
          goodieMinValue={goodieMinValue}
          goodieMinValueAppliesToUpgrade={goodieMinValueAppliesToUpgrade}
          hideRepeatGoodieOnUpgrade={hideRepeatGoodieOnUpgrade}
          subscriptionToUpgrade={subscriptionToUpgrade}
          upgradeInfo={upgradeInfo}
          onSelect={handleOnSelect}
          onUpgrade={async formData => {
            const selectedMemberplan = memberPlans.find(
              mb => mb.id === formData.memberPlanId
            );

            const result = await upgrade(selectedMemberplan, {
              variables: {
                ...formData,
              },
            });

            if (result.error) {
              throw result.error;
            }
          }}
        />
      )}
    </>
  );
};
