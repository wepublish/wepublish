import {
  FullMemberPlanFragment,
  FullPaymentFragment,
  usePayInvoiceMutation,
  useSubscribeMutation,
  useUpgradeMutation,
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
  ...params: Parameters<typeof useSubscribeMutation>
) => {
  const [stripeClientSecret, setStripeClientSecret] = useState<string>();
  const [redirectPages, setRedirectPages] = useState<RedirectPages>();

  const [result] = useSubscribeMutation({
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
        variables:
          callbackParams[0]?.variables ?
            {
              ...callbackParams[0].variables,
              successURL: successUrl,
              failureURL: failUrl,
            }
          : undefined,
        onCompleted: data => {
          callbackParams[0]?.onCompleted?.(data);
          handlePayment({
            intent: data.createSubscription ?? undefined,
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
  ...params: Parameters<typeof useUpgradeMutation>
) => {
  const [stripeClientSecret, setStripeClientSecret] = useState<string>();
  const [redirectPages, setRedirectPages] = useState<RedirectPages>();

  const [result] = useUpgradeMutation({
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
        variables:
          callbackParams[0]?.variables ?
            {
              ...callbackParams[0].variables,
              successURL: successUrl,
              failureURL: failUrl,
            }
          : undefined,
        onCompleted: data => {
          callbackParams[0]?.onCompleted?.(data);
          handlePayment({
            intent: data.upgradeSubscription ?? undefined,
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
  ...params: Parameters<typeof usePayInvoiceMutation>
) => {
  const [stripeClientSecret, setStripeClientSecret] = useState<string>();
  const [redirectPages, setRedirectPages] = useState<RedirectPages>();

  const [result] = usePayInvoiceMutation({
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
        variables:
          callbackParams[0]?.variables ?
            {
              ...callbackParams[0].variables,
              successURL: successUrl,
              failureURL: failUrl,
            }
          : undefined,
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
