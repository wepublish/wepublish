import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { useRegister, useUser } from '@wepublish/authentication/website';
import { PaymentForm, useSubscribe } from '@wepublish/payment/website';
import {
  CreateSubscriptionInfoDocument,
  FullMemberPlanFragment,
  InvoicesDocument,
  MemberPlanListDocument,
  ResubscribeDocument,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import {
  BuilderContainerProps,
  BuilderSubscribeProps,
  BuilderUserFormFields,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { produce } from 'immer';
import { getMonthlyEquivalentRange } from '../formatters/format-payment-period';
import { sortBy } from 'ramda';
import { useMemo } from 'react';

/**
 * If you pass the "deactivateSubscriptionId" prop, this specific subscription will be canceled when
 * a new subscription is purchased. The subscription id is passed to the api that handles the
 * deactivation. This is used for trial subscriptions or to replace legacy subscriptions like
 * Payrexx Subscription. Other use cases are possible.
 */
export type SubscribeContainerProps<
  T extends Exclude<BuilderUserFormFields, 'flair'> = Exclude<
    BuilderUserFormFields,
    'flair'
  >,
> = BuilderContainerProps &
  Pick<
    BuilderSubscribeProps<T>,
    | 'fields'
    | 'schema'
    | 'defaults'
    | 'termsOfServiceUrl'
    | 'transactionFee'
    | 'transactionFeeText'
    | 'returningUserId'
  > & {
    sort?: (memberPlans: FullMemberPlanFragment[]) => FullMemberPlanFragment[];
    filter?: (
      memberPlans: FullMemberPlanFragment[]
    ) => FullMemberPlanFragment[];
    deactivateSubscriptionId?: string;
  };

export const SubscribeContainer = <
  T extends Exclude<BuilderUserFormFields, 'flair'>,
>({
  filter = memberPlan => memberPlan,
  sort = sortBy(
    memberPlan => getMonthlyEquivalentRange(memberPlan).amountPerMonthMin
  ),
  deactivateSubscriptionId,
  ...props
}: SubscribeContainerProps<T>) => {
  const { hasUser } = useUser();
  const { Subscribe } = useWebsiteBuilder();

  const userSubscriptions = useQuery(SubscriptionsDocument, {
    skip: !hasUser,
  });
  const userInvoices = useQuery(InvoicesDocument, {
    skip: !hasUser,
  });

  const memberPlanList = useQuery(MemberPlanListDocument, {
    variables: {
      take: 50,
      filter: {
        active: true,
      },
    },
  });

  const [resubscribe] = useMutation(ResubscribeDocument, {});

  const [subscribe, redirectPages, stripeClientSecret] = useSubscribe();
  const [fetchSubscribeInfo, subscribeInfo] = useLazyQuery(
    CreateSubscriptionInfoDocument,
    {
      fetchPolicy: 'cache-first',
    }
  );
  const {
    register: [register],
    challenge,
  } = useRegister();

  const filteredMemberPlans = useMemo(() => {
    return produce(memberPlanList, draftList => {
      if (draftList.data?.memberPlans) {
        draftList.data.memberPlans.nodes = filter(
          sort(draftList.data.memberPlans.nodes)
        );
      }
    });
  }, [memberPlanList, filter, sort]);

  return (
    <>
      <PaymentForm
        stripeClientSecret={stripeClientSecret}
        redirectPages={redirectPages}
      />

      <Subscribe
        challenge={challenge}
        userSubscriptions={userSubscriptions}
        userInvoices={userInvoices}
        memberPlans={filteredMemberPlans}
        fetchSubscribeInfo={fetchSubscribeInfo}
        subscribeInfo={subscribeInfo}
        {...props}
        onSubscribe={async formData => {
          const selectedMemberplan =
            filteredMemberPlans.data?.memberPlans.nodes.find(
              mb => mb.id === formData.memberPlanId
            );

          const result = await subscribe(selectedMemberplan, {
            variables: {
              ...formData,
              deactivateSubscriptionId,
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

          const selectedMemberplan =
            filteredMemberPlans.data?.memberPlans.nodes.find(
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
          const selectedMemberplan =
            filteredMemberPlans.data?.memberPlans.nodes.find(
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
        deactivateSubscriptionId={deactivateSubscriptionId}
      />
    </>
  );
};
