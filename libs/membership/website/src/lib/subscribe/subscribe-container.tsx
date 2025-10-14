import { useRegister, useUser } from '@wepublish/authentication/website';
import { PaymentForm, useSubscribe } from '@wepublish/payment/website';
import {
  FullMemberPlanFragment,
  useInvoicesQuery,
  useMemberPlanListQuery,
  usePageLazyQuery,
  useResubscribeMutation,
  useSubscriptionsQuery,
} from '@wepublish/website/api';
import {
  BuilderContainerProps,
  BuilderSubscribeProps,
  BuilderUserFormFields,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { produce } from 'immer';
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
    | 'donate'
    | 'transactionFee'
    | 'transactionFeeText'
    | 'returningUserId'
    | 'hidePaymentAmount'
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
  sort = sortBy(memberPlan => memberPlan.amountPerMonthMin),
  deactivateSubscriptionId,
  ...props
}: SubscribeContainerProps<T>) => {
  const { hasUser } = useUser();
  const { Subscribe } = useWebsiteBuilder();

  const userSubscriptions = useSubscriptionsQuery({
    skip: !hasUser,
  });
  const userInvoices = useInvoicesQuery({
    skip: !hasUser,
  });

  const memberPlanList = useMemberPlanListQuery({
    variables: {
      take: 50,
      filter: {
        active: true,
      },
    },
  });

  const [resubscribe] = useResubscribeMutation({});

  const [subscribe, redirectPages, stripeClientSecret] = useSubscribe();
  const {
    register: [register],
    challenge,
  } = useRegister();

  // @TODO: Replace with objects on Memberplan when Memberplan has been migrated to V2
  // Pages are currently in V2 and Memberplan are in V1, so we have no access to page objects.
  const [fetchPage] = usePageLazyQuery();

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

          const selectedMemberplan =
            filteredMemberPlans.data?.memberPlans.nodes.find(
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
          const selectedMemberplan =
            filteredMemberPlans.data?.memberPlans.nodes.find(
              mb => mb.id === formData.memberPlanId
            );
          const page = await fetchPage({
            variables: {
              id: selectedMemberplan?.confirmationPageId,
            },
          });

          await resubscribe({
            variables: formData,
            async onCompleted() {
              window.location.href = page.data?.page.url ?? '';
              // window.location.href = selectedMemberplan?.confirmationPage?.url ?? ''
            },
          });
        }}
        deactivateSubscriptionId={deactivateSubscriptionId}
      />
    </>
  );
};
