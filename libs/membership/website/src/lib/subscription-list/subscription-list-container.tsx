import { useMutation, useQuery } from '@apollo/client/react';
import { StripeElement, StripePayment } from '@wepublish/payment/website';
import {
  CancelSubscriptionDocument,
  CancelSubscriptionMutation,
  CancelSubscriptionMutationVariables,
  ExtendSubscriptionDocument,
  ExtendSubscriptionMutation,
  FullMemberPlanFragment,
  FullSubscriptionFragment,
  InvoicesDocument,
  InvoicesQuery,
  ReactivateSubscriptionDocument,
  RevertSubscriptionUpgradeDocument,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import {
  BuilderContainerProps,
  BuilderSubscriptionListProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { produce } from 'immer';
import { useMemo, useState } from 'react';

export type SubscriptionListContainerProps = {
  filter?: (
    subscriptions: FullSubscriptionFragment[]
  ) => FullSubscriptionFragment[];
} & BuilderContainerProps &
  Partial<Pick<BuilderSubscriptionListProps, 'subscribeUrl'>>;

export function SubscriptionListContainer({
  filter,
  subscribeUrl = '/mitmachen',
  className,
}: SubscriptionListContainerProps) {
  const [stripeClientSecret, setStripeClientSecret] = useState<string>();
  const [stripeMemberPlan, setStripeMemberPlan] =
    useState<FullMemberPlanFragment>();
  const { SubscriptionList } = useWebsiteBuilder();
  const { data, loading, error } = useQuery(SubscriptionsDocument);
  const invoices = useQuery(InvoicesDocument);

  const [cancel] = useCancelSubscriptionMutationWithCacheUpdate();
  const [revertUpgrade] = useMutation(RevertSubscriptionUpgradeDocument, {
    onCompleted() {
      invoices.refetch();
    },
    refetchQueries: [SubscriptionsDocument],
  });
  const [reactivate] = useMutation(ReactivateSubscriptionDocument, {
    onCompleted() {
      invoices.refetch();
    },
  });
  const [extend] = useMutation(ExtendSubscriptionDocument, {
    onCompleted(data: ExtendSubscriptionMutation) {
      if (!data.extendUserSubscription?.intentSecret) {
        invoices.refetch();
        return;
      }

      if (
        data.extendUserSubscription.paymentMethod.paymentProviderID === 'stripe'
      ) {
        setStripeClientSecret(data.extendUserSubscription.intentSecret);
      }

      if (data.extendUserSubscription.intentSecret.startsWith('http')) {
        window.location.href = data.extendUserSubscription.intentSecret;
      }
    },
  });

  const filteredSubscriptions = useMemo(
    () =>
      produce(data, draftData => {
        if (filter && draftData?.userSubscriptions) {
          draftData.userSubscriptions = filter(draftData.userSubscriptions);
        }
      }),
    [data, filter]
  );

  return (
    <>
      {stripeClientSecret && (
        <StripeElement clientSecret={stripeClientSecret}>
          <StripePayment
            onClose={async success => {
              if (stripeMemberPlan) {
                window.location.href =
                  success ?
                    (stripeMemberPlan.successPage?.url ?? '')
                  : (stripeMemberPlan.failPage?.url ?? '');
              }
            }}
          />
        </StripeElement>
      )}

      <SubscriptionList
        data={filteredSubscriptions}
        loading={loading}
        error={error}
        invoices={invoices}
        subscribeUrl={subscribeUrl}
        className={className}
        onCancel={async subscriptionId => {
          await cancel({
            variables: {
              subscriptionId,
            },
          });
        }}
        onReactivate={async subscriptionId => {
          await reactivate({
            variables: {
              subscriptionId,
            },
          });
        }}
        onRevertUpgrade={async subscriptionId => {
          await revertUpgrade({
            variables: {
              subscriptionId,
            },
          });
        }}
        onExtend={async subscriptionId => {
          const memberPlan = filteredSubscriptions?.userSubscriptions?.find(
            subscription => subscription.id === subscriptionId
          )?.memberPlan;
          setStripeMemberPlan(memberPlan);

          await extend({
            variables: {
              subscriptionId,
              failureURL: memberPlan?.failPage?.url,
              successURL: memberPlan?.successPage?.url,
            },
          });
        }}
      />
    </>
  );
}

const useCancelSubscriptionMutationWithCacheUpdate = (
  ...params: [
    options?: useMutation.Options<
      CancelSubscriptionMutation,
      CancelSubscriptionMutationVariables
    >,
  ]
) =>
  useMutation(CancelSubscriptionDocument, {
    ...params[0],
    update: (cache, { data }, options) => {
      const newSubscription = data?.cancelUserSubscription;

      if (newSubscription) {
        cache.updateQuery<InvoicesQuery>({ query: InvoicesDocument }, data => ({
          __typename: 'Query',
          userInvoices:
            data?.userInvoices.map(invoice => {
              if (
                invoice.subscriptionID === newSubscription.id &&
                !invoice.paidAt &&
                !invoice.canceledAt
              ) {
                return {
                  ...invoice,
                  subscription: newSubscription,
                  canceledAt: new Date().toISOString(),
                };
              }

              return invoice;
            }) ?? [],
        }));
      }
    },
  });
