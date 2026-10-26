import { MockedProvider } from '@apollo/client/testing/react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { mockPaymentMethod } from '@wepublish/storybook/mocks';
import {
  FullPaymentFragment,
  PayGiftCodeDocument,
  PaymentState,
  PurchaseGiftCodeDocument,
} from '@wepublish/website/api';
import { PropsWithChildren } from 'react';
import { usePayGiftCode, usePurchaseGiftCode } from './handle-payment';

const stripeIntent = {
  __typename: 'Payment',
  id: 'payment-1',
  intentSecret: 'stripe-secret',
  state: PaymentState.RequiresUserAction,
  paymentMethod: mockPaymentMethod({ paymentProviderID: 'stripe' }),
} as FullPaymentFragment;

const withQuery = (url: string, params: Record<string, string>) => {
  const result = new URL(url);

  for (const [key, value] of Object.entries(params)) {
    result.searchParams.set(key, value);
  }

  return result.toString();
};

const expectedSuccessUrl = () =>
  withQuery(`${window.location.origin}/profile`, {
    giftCodePurchase: 'success',
  });

const expectedFailUrl = () =>
  withQuery(window.location.href, { giftCodePurchase: 'failure' });

describe('gift code payment hooks', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/abo?mode=gift');
  });

  describe('usePurchaseGiftCode', () => {
    it('sends the gift code redirect urls and starts stripe elements', async () => {
      const variables = {
        offerId: 'offer-1',
        recipientName: 'Anna',
        message: 'Alles Gute',
        paymentMethodId: 'pm-1',
      };

      const wrapper = ({ children }: PropsWithChildren) => (
        <MockedProvider
          mocks={[
            {
              request: {
                query: PurchaseGiftCodeDocument,
                variables: {
                  ...variables,
                  successURL: expectedSuccessUrl(),
                  failureURL: expectedFailUrl(),
                },
              },
              result: { data: { purchaseGiftCode: stripeIntent } },
            },
          ]}
        >
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => usePurchaseGiftCode(), { wrapper });

      await act(async () => {
        await result.current[0]({ variables });
      });

      await waitFor(() => expect(result.current[2]).toBe('stripe-secret'));
      expect(result.current[1]).toEqual({
        successUrl: expectedSuccessUrl(),
        failUrl: expectedFailUrl(),
      });
    });
  });

  describe('usePayGiftCode', () => {
    it('sends the gift code redirect urls and starts stripe elements', async () => {
      const variables = { id: 'gift-code-1', paymentMethodId: 'pm-1' };

      const wrapper = ({ children }: PropsWithChildren) => (
        <MockedProvider
          mocks={[
            {
              request: {
                query: PayGiftCodeDocument,
                variables: {
                  ...variables,
                  successURL: expectedSuccessUrl(),
                  failureURL: expectedFailUrl(),
                },
              },
              result: { data: { payGiftCode: stripeIntent } },
            },
          ]}
        >
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => usePayGiftCode(), { wrapper });

      await act(async () => {
        await result.current[0]({ variables });
      });

      await waitFor(() => expect(result.current[2]).toBe('stripe-secret'));
      expect(result.current[1]).toEqual({
        successUrl: expectedSuccessUrl(),
        failUrl: expectedFailUrl(),
      });
    });
  });

  describe('without an intent', () => {
    const location = { href: '', origin: 'http://localhost' };

    beforeEach(() => {
      location.href = 'http://localhost/abo?mode=gift';
      vi.stubGlobal('location', location);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('adds the error to the query of the gift code fail url', async () => {
      const variables = { id: 'gift-code-1', paymentMethodId: 'pm-1' };
      const failUrl = withQuery('http://localhost/abo?mode=gift', {
        giftCodePurchase: 'failure',
      });

      const wrapper = ({ children }: PropsWithChildren) => (
        <MockedProvider
          mocks={[
            {
              request: {
                query: PayGiftCodeDocument,
                variables: {
                  ...variables,
                  successURL: withQuery('http://localhost/profile', {
                    giftCodePurchase: 'success',
                  }),
                  failureURL: failUrl,
                },
              },
              result: { data: { payGiftCode: null } },
            },
          ]}
        >
          {children}
        </MockedProvider>
      );

      const { result } = renderHook(() => usePayGiftCode(), { wrapper });

      await act(async () => {
        await result.current[0]({ variables });
      });

      await waitFor(() =>
        expect(location.href).toBe(
          withQuery(failUrl, {
            error: 'Intent konnte nicht gefunden werden.',
          })
        )
      );
    });
  });
});
