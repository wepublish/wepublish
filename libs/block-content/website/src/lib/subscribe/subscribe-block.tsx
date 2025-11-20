import {
  BlockContent,
  SubscribeBlock as SubscribeBlockType,
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
): block is SubscribeBlockType => block.__typename === 'SubscribeBlock';

const lowercase = replace(/^./, toLower);

export const SubscribeBlock = ({
  className,
  memberPlans,
  fields,
}: BuilderSubscribeBlockProps) => {
  const {
    register: [register],
    subscribe,
    resubscribe: [resubscribe],
    upgrade,
    upgradeInfo: [fetchUpgradeInfo, upgradeInfo],
    stripeClientSecret,
    redirectPages,
    ...subscribeProps
  } = useSubscribeBlock();
  const { userSubscriptions } = subscribeProps;
  const {
    query: { upgradeSubscriptionId, deactivateSubscriptionId, userId },
  } = useContext(BuilderRouterContext);

  const subscriptionToUpgrade = useMemo(() => {
    return userSubscriptions.data?.subscriptions.find(
      subscription => subscription.id === upgradeSubscriptionId
    );
  }, [upgradeSubscriptionId, userSubscriptions.data?.subscriptions]);

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
    (memberPlanId: string | undefined) => {
      if (memberPlanId) {
        fetchUpgradeInfo({
          variables: {
            memberPlanId,
            subscriptionId: upgradeSubscriptionId as string,
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
          className={className}
          memberPlans={memberPlansObj}
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
