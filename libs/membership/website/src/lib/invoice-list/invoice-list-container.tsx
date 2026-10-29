import { useApolloClient, useQuery } from '@apollo/client/react';
import {
  PaymentForm,
  usePayInvoice,
  useSubscribe,
} from '@wepublish/payment/website';
import {
  CheckInvoiceStatusDocument,
  FullInvoiceFragment,
  InvoicesDocument,
} from '@wepublish/website/api';
import {
  BuilderContainerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { produce } from 'immer';
import { anyPass } from 'ramda';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isPayrexxSubscription } from './invoice-list';

const isInNeedOfMigration = anyPass([
  // @TODO: Remove when all 'payrexx subscriptions' subscriptions have been migrated
  isPayrexxSubscription,
]);

const mapMigratePaymentMethod = (invoice: FullInvoiceFragment) => {
  if (!invoice.subscription?.paymentMethod) {
    return;
  }

  switch (invoice.subscription.paymentMethod.paymentProviderID) {
    case 'payrexx-subscription': {
      return 'payrexx';
    }
  }
};

export type InvoiceListContainerProps = {
  filter?: (invoices: FullInvoiceFragment[]) => FullInvoiceFragment[];
} & BuilderContainerProps;

export function InvoiceListContainer({
  filter,
  className,
}: InvoiceListContainerProps) {
  const { InvoiceList } = useWebsiteBuilder();
  const client = useApolloClient();
  const requestedChecks = useRef(new Set<string>());
  const [checkedInvoices, setCheckedInvoices] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const { data, loading: loadingInvoices, error } = useQuery(InvoicesDocument);

  const openInvoiceIds = useMemo(
    () =>
      (data?.userInvoices ?? [])
        .filter(({ id, paidAt, canceledAt }) => id && !paidAt && !canceledAt)
        .map(({ id }) => id),
    [data]
  );

  useEffect(() => {
    for (const id of openInvoiceIds) {
      if (requestedChecks.current.has(id)) {
        continue;
      }

      requestedChecks.current.add(id);
      client
        .query({
          query: CheckInvoiceStatusDocument,
          variables: { id },
          fetchPolicy: 'network-only',
        })
        .catch(() => undefined)
        .finally(() => setCheckedInvoices(checked => new Set(checked).add(id)));
    }
  }, [openInvoiceIds, client]);

  const loadingCheckInvoice = openInvoiceIds.some(
    id => !checkedInvoices.has(id)
  );

  const [pay, redirectPages1, stripeClientSecret1] = usePayInvoice();
  const [migrate, redirectPages2, stripeClientSecret2] = useSubscribe();

  const filteredInvoices = useMemo(
    () =>
      produce(data, draftData => {
        if (filter && draftData?.userInvoices) {
          draftData.userInvoices = filter(draftData.userInvoices);
        }
      }),
    [data, filter]
  );

  const loading = useMemo(
    () => loadingInvoices || loadingCheckInvoice,
    [loadingInvoices, loadingCheckInvoice]
  );

  const handlePay = useCallback(
    async (invoice: FullInvoiceFragment) => {
      const subscription = invoice.subscription!;
      const memberPlan = subscription?.memberPlan;
      const needsMigration = isInNeedOfMigration(invoice);

      if (needsMigration) {
        const newPaymentProviderID = mapMigratePaymentMethod(invoice);
        const newPaymentMethodId = memberPlan.availablePaymentMethods
          .flatMap(({ paymentMethods }) => paymentMethods)
          .find(
            ({ paymentProviderID }) =>
              paymentProviderID === newPaymentProviderID
          )?.id;

        if (!newPaymentMethodId) {
          throw new Error(
            'Der benötigte Payment-Adapter konnte nicht gefunden werden.'
          );
        }

        return migrate(memberPlan, {
          variables: {
            deactivateSubscriptionId: subscription.id,
            memberPlanId: memberPlan?.id,
            paymentMethodId: newPaymentMethodId,
            // What if forceAutoRenew is now enabled and autoRenew is false?
            autoRenew: subscription.autoRenew,
            // What if monthlyAmount is now higher?
            monthlyAmount: subscription?.monthlyAmount,
            // What if paymentPeriodicity is now not allowed?
            paymentPeriodicity: subscription?.paymentPeriodicity,
          },
        });
      }

      return pay(memberPlan, {
        variables: {
          invoiceId: invoice.id,
          paymentMethodId: subscription.paymentMethod.id,
        },
      });
    },
    [migrate, pay]
  );

  return (
    <>
      <PaymentForm
        stripeClientSecret={stripeClientSecret1 ?? stripeClientSecret2}
        redirectPages={redirectPages1 ?? redirectPages2}
      />

      <InvoiceList
        data={filteredInvoices}
        loading={loading}
        error={error}
        className={className}
        onPay={async invoiceId => {
          const invoice = filteredInvoices?.userInvoices?.find(
            invoice => invoice.id === invoiceId
          );

          if (invoice) {
            await handlePay(invoice);
          }
        }}
      />
    </>
  );
}
