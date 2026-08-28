import {
  BlockContent,
  FullSubscribeBlockFragment,
  PaymentPeriodicity,
} from '@wepublish/website/api';
import {
  BuilderRouterContext,
  BuilderSubscribeBlockProps,
  BuilderSubscribeProps,
  Subscribe,
  Upgrade,
} from '@wepublish/website/builder';
import { replace, toLower } from 'ramda';
import { useCallback, useContext, useMemo } from 'react';
import { useSubscribeBlock } from './subscribe-block.context';
import { PaymentForm } from '@wepublish/payment/website';

export const isSubscribeBlock = (
  block: Pick<BlockContent, '__typename'>
): block is FullSubscribeBlockFragment => block.__typename === 'SubscribeBlock';

const lowercase = replace(/^./, toLower);

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
}: BuilderSubscribeBlockProps) => {
  const {
    register: [register],
    subscribe,
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
    },
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

  const memberPlansObj = useMemo(
    () =>
      ({
        loading: false,
        data: {
          memberPlans: {
            nodes: memberPlans,
            totalCount: memberPlans.length,
            pageInfo: {
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

      {!subscriptionToUpgrade && (
        <Subscribe
          {...subscribeProps}
          className={className}
          memberPlans={memberPlansObj}
          fields={fields.map(lowercase) as BuilderSubscribeProps['fields']}
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

            if (result.errors) {
              throw result.errors;
            }
          }}
          onSubscribeWithRegister={async formData => {
            const { errors: registerErrors } = await register({
              variables: formData.register,
            });

            if (registerErrors) {
              throw registerErrors;
            }

            const selectedMemberplan = memberPlans.find(
              mb => mb.id === formData.subscribe.memberPlanId
            );

            const result = await subscribe(selectedMemberplan, {
              variables: {
                ...formData.subscribe,
              },
            });

            if (result.errors) {
              throw result.errors;
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

            if (result.errors) {
              throw result.errors;
            }
          }}
        />
      )}
    </>
  );
};
