import { useLazyQuery, useQuery } from '@apollo/client/react';
import { PaymentForm, usePayGiftCode } from '@wepublish/payment/website';
import {
  CheckInvoiceStatusDocument,
  MyGiftCodesDocument,
} from '@wepublish/website/api';
import {
  BuilderContainerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useEffect, useRef } from 'react';
import { canPayGiftCode } from './gift-code-list';
import { GiftCodePurchaseFailure } from './gift-code-purchase-failure';

export function GiftCodeListContainer({ className }: BuilderContainerProps) {
  const { GiftCodeList } = useWebsiteBuilder();
  const { data, loading, error, refetch } = useQuery(MyGiftCodesDocument);
  const [checkInvoice] = useLazyQuery(CheckInvoiceStatusDocument);
  const [pay, redirectPages, stripeClientSecret] = usePayGiftCode();
  const checkedInvoiceIds = useRef(new Set<string>());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const invoiceIds = (data?.myGiftCodes ?? [])
      .filter(canPayGiftCode)
      .flatMap(({ invoiceId }) => (invoiceId ? [invoiceId] : []))
      .filter(invoiceId => !checkedInvoiceIds.current.has(invoiceId));

    if (!invoiceIds.length) {
      return;
    }

    for (const invoiceId of invoiceIds) {
      checkedInvoiceIds.current.add(invoiceId);
    }

    Promise.allSettled(
      invoiceIds.map(id => checkInvoice({ variables: { id } }))
    )
      .then(() => refetch())
      .catch(console.warn);
  }, [data, checkInvoice, refetch]);

  return (
    <>
      <GiftCodePurchaseFailure />

      <PaymentForm
        stripeClientSecret={stripeClientSecret}
        redirectPages={redirectPages}
      />

      <GiftCodeList
        data={data}
        loading={loading}
        error={error}
        className={className}
        onPay={async (id, paymentMethodId) => {
          const result = await pay({
            variables: {
              id,
              paymentMethodId,
            },
          });

          if (result.error) {
            throw result.error;
          }
        }}
      />
    </>
  );
}
