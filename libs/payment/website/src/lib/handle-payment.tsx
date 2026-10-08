import { useMutation } from '@apollo/client/react';
import {
  FullMemberPlanFragment,
  FullPaymentFragment,
  PayInvoiceDocument,
  PayInvoiceMutation,
  PayInvoiceMutationVariables,
  SubscribeDocument,
  SubscribeMutation,
  SubscribeMutationVariables,
  UpgradeDocument,
  UpgradeMutation,
  UpgradeMutationVariables,
} from '@wepublish/website/api';
import { useCallback, useState } from 'react';
import { RedirectPages } from './payment-form';

// relative urls are not allowed by some payment providers
const relativeToAbsolute = (url: string) => {
  if (url.startsWith('http')) {
    return url;
  }

  return `${window.location.origin}${url}`;
};

export const useSubscribe = (
  ...params: [
    options?: useMutation.Options<
      SubscribeMutation,
      SubscribeMutationVariables
    >,
  ]
) => {
  const [stripeClientSecret, setStripeClientSecret] = useState<string>();
  const [redirectPages, setRedirectPages] = useState<RedirectPages>();

  const [result] = useMutation(SubscribeDocument, {
    ...params[0],
  });

  const callback = useCallback(
    async (
      memberPlan: FullMemberPlanFragment | undefined | null,
      ...callbackParams: Parameters<typeof result>
    ) => {
      const successUrl = relativeToAbsolute(
        memberPlan?.successPage?.url ?? '/profile'
      );
      const failUrl = relativeToAbsolute(
        memberPlan?.failPage?.url ?? '/profile'
      );

      setRedirectPages({
        successUrl,
        failUrl,
      });

      return result({
        ...callbackParams[0],
        ...(callbackParams[0]?.variables ?
          {
            variables: {
              ...callbackParams[0].variables,
              successURL: successUrl,
              failureURL: failUrl,
            },
          }
        : {}),
        onCompleted: data => {
          callbackParams[0]?.onCompleted?.(data);
          handlePayment({
            intent: data.createUserSubscription ?? undefined,
            successUrl,
            failUrl,
            setStripeClientSecret,
          });
        },
        onError: error =>
          (window.location.href = `${failUrl}?error=${encodeURIComponent(error.message)}`),
      });
    },
    [result]
  );

  return [callback, redirectPages, stripeClientSecret] as const;
};

export const useUpgrade = (
  ...params: [
    options?: useMutation.Options<UpgradeMutation, UpgradeMutationVariables>,
  ]
) => {
  const [stripeClientSecret, setStripeClientSecret] = useState<string>();
  const [redirectPages, setRedirectPages] = useState<RedirectPages>();

  const [result] = useMutation(UpgradeDocument, {
    ...params[0],
  });

  const callback = useCallback(
    async (
      memberPlan: FullMemberPlanFragment | undefined | null,
      ...callbackParams: Parameters<typeof result>
    ) => {
      const successUrl = relativeToAbsolute(
        memberPlan?.successPage?.url ?? '/profile'
      );
      const failUrl = relativeToAbsolute(
        memberPlan?.failPage?.url ?? '/profile'
      );

      setRedirectPages({
        successUrl,
        failUrl,
      });

      return result({
        ...callbackParams[0],
        ...(callbackParams[0]?.variables ?
          {
            variables: {
              ...callbackParams[0].variables,
              successURL: successUrl,
              failureURL: failUrl,
            },
          }
        : {}),
        onCompleted: data => {
          callbackParams[0]?.onCompleted?.(data);
          handlePayment({
            intent: data.upgradeUserSubscription ?? undefined,
            successUrl,
            failUrl,
            setStripeClientSecret,
          });
        },
        onError: error =>
          (window.location.href = `${failUrl}?error=${encodeURIComponent(error.message)}`),
      });
    },
    [result]
  );

  return [callback, redirectPages, stripeClientSecret] as const;
};

export const usePayInvoice = (
  ...params: [
    options?: useMutation.Options<
      PayInvoiceMutation,
      PayInvoiceMutationVariables
    >,
  ]
) => {
  const [stripeClientSecret, setStripeClientSecret] = useState<string>();
  const [redirectPages, setRedirectPages] = useState<RedirectPages>();

  const [result] = useMutation(PayInvoiceDocument, {
    ...params[0],
  });

  const callback = useCallback(
    async (
      memberPlan: FullMemberPlanFragment | undefined | null,
      ...callbackParams: Parameters<typeof result>
    ) => {
      const successUrl =
        memberPlan?.successPage?.url ?? window.location.origin + '/profile';
      const failUrl =
        memberPlan?.failPage?.url ?? window.location.origin + '/profile';

      setRedirectPages({
        successUrl,
        failUrl,
      });

      return result({
        ...callbackParams[0],
        ...(callbackParams[0]?.variables ?
          {
            variables: {
              ...callbackParams[0].variables,
              successURL: successUrl,
              failureURL: failUrl,
            },
          }
        : {}),
        onCompleted: data => {
          callbackParams[0]?.onCompleted?.(data);
          handlePayment({
            intent: data.createPaymentFromInvoice ?? undefined,
            successUrl,
            failUrl,
            setStripeClientSecret,
          });
        },
        onError: error =>
          (window.location.href = `${failUrl}?error=${encodeURIComponent(error.message)}`),
      });
    },
    [result]
  );

  return [callback, redirectPages, stripeClientSecret] as const;
};

const handlePayment = ({
  intent,
  successUrl,
  failUrl,
  setStripeClientSecret,
}: {
  intent?: FullPaymentFragment;
  successUrl: string;
  failUrl: string;
  setStripeClientSecret?: (secret: string | undefined) => void;
}) => {
  if (!intent) {
    window.location.href = `${failUrl}?error=${encodeURIComponent(
      'Intent konnte nicht gefunden werden.'
    )}`;
    return;
  }

  if (intent.state === 'paid') {
    window.location.href = successUrl;
    return;
  }

  if (intent.paymentMethod.paymentProviderID === 'stripe') {
    setStripeClientSecret?.(intent.intentSecret ?? undefined);
    return;
  } else {
    setStripeClientSecret?.(undefined);
  }

  if (!intent.intentSecret) {
    window.location.href = successUrl;
    return;
  }

  if (intent.intentSecret.startsWith('http')) {
    window.location.href = intent.intentSecret;
    return;
  }
};
