import { useMutation, useQuery } from '@apollo/client/react';
import {
  relativeToAbsolute,
  StripeElement,
  StripePayment,
  StripePaymentProps,
} from '@wepublish/payment/website';
import {
  CancelSubscriptionDocument,
  CancelSubscriptionPaymentMethodChangeDocument,
  ChangeSubscriptionPaymentMethodDocument,
  CheckSubscriptionPaymentMethodChangeDocument,
  CancelSubscriptionMutation,
  CancelSubscriptionMutationVariables,
  ExtendSubscriptionDocument,
  ExtendSubscriptionMutation,
  FullMemberPlanFragment,
  FullSubscriptionFragment,
  InvoicesDocument,
  InvoicesQuery,
  PaymentMethodChangeKind,
  PaymentMethodChangeState,
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
import { useEffect, useMemo, useRef, useState } from 'react';

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
  // set while Stripe collects the payment method of a payment method change
  const [stripeChange, setStripeChange] = useState<{
    id: string;
    mode: NonNullable<StripePaymentProps['mode']>;
  }>();
  const { SubscriptionList } = useWebsiteBuilder();
  const { data, loading, error, refetch } = useQuery(SubscriptionsDocument);
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

  const [changePaymentMethod] = useMutation(
    ChangeSubscriptionPaymentMethodDocument
  );
  const [cancelPaymentMethodChange] = useMutation(
    CancelSubscriptionPaymentMethodChangeDocument
  );
  const [checkPaymentMethodChange] = useMutation(
    CheckSubscriptionPaymentMethodChangeDocument
  );

  const refreshAfterPaymentMethodChange = async () => {
    await Promise.all([refetch(), invoices.refetch()]);
  };

  const checkChange = async (id: string) => {
    const result = await checkPaymentMethodChange({ variables: { id } });

    if (
      result.data?.checkSubscriptionPaymentMethodChange.state !==
      PaymentMethodChangeState.Pending
    ) {
      await refreshAfterPaymentMethodChange();
    }
  };

  // The reader may come back from the payment provider before it reported
  // the outcome, so a pending change is asked for once.
  const checkedChanges = useRef(new Set<string>());
  useEffect(() => {
    for (const subscription of data?.userSubscriptions ?? []) {
      const change = subscription.pendingPaymentMethodChange;

      if (change && !checkedChanges.current.has(change.id)) {
        checkedChanges.current.add(change.id);
        checkChange(change.id).catch(() => undefined);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

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
            mode={stripeChange?.mode}
            onClose={async success => {
              if (stripeChange) {
                const { id } = stripeChange;
                setStripeChange(undefined);
                setStripeClientSecret(undefined);

                if (success) {
                  await checkChange(id);
                }
                return;
              }

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

          // payment providers reject relative return urls
          await extend({
            variables: {
              subscriptionId,
              failureURL: relativeToAbsolute(
                memberPlan?.failPage?.url ?? '/profile'
              ),
              successURL: relativeToAbsolute(
                memberPlan?.successPage?.url ?? '/profile'
              ),
            },
          });
        }}
        onChangePaymentMethod={async (subscriptionId, paymentMethodId) => {
          // back to this page, which then asks for the outcome
          const returnURL = window.location.href;
          const { data } = await changePaymentMethod({
            variables: {
              subscriptionId,
              paymentMethodId,
              successURL: returnURL,
              failureURL: returnURL,
            },
          });
          const started = data?.changeSubscriptionPaymentMethod;

          if (!started?.intentSecret) {
            await refreshAfterPaymentMethodChange();
            return;
          }

          if (started.paymentProviderID === 'stripe') {
            setStripeChange({
              id: started.change.id,
              mode:
                started.change.kind === PaymentMethodChangeKind.Authorization ?
                  'setup'
                : 'payment',
            });
            setStripeClientSecret(started.intentSecret);
            return;
          }

          if (started.intentSecret.startsWith('http')) {
            window.location.href = started.intentSecret;
          }
        }}
        onCancelPaymentMethodChange={async id => {
          await cancelPaymentMethodChange({ variables: { id } });
          await refreshAfterPaymentMethodChange();
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
