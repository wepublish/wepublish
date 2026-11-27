import { MockedProvider } from '@apollo/client/testing/react';
import { renderHook, waitFor } from '@testing-library/react';
import { SessionTokenContext } from '@wepublish/authentication/website';
import { mockInvoice, mockSubscription } from '@wepublish/mocks/website';
import {
  InvoicesDocument,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { PropsWithChildren } from 'react';
import { useHasRunningSubscription } from './has-running-subscription';
import { useHasUnpaidInvoices } from './has-unpaid-invoices';

const requests = { invoices: 0, subscriptions: 0 };

const mocks = [
  {
    request: { query: InvoicesDocument },
    delay: 0,
    result: () => {
      requests.invoices++;

      return {
        data: {
          userInvoices: [mockInvoice({ paidAt: null, canceledAt: null })],
        },
      };
    },
  },
  {
    request: { query: SubscriptionsDocument },
    delay: 0,
    result: () => {
      requests.subscriptions++;

      return { data: { userSubscriptions: [mockSubscription()] } };
    },
  },
];

const wrapper = ({ children }: PropsWithChildren) => (
  <MockedProvider mocks={mocks}>
    <SessionTokenContext.Provider
      value={[{ id: 'user-1' } as never, true, async () => undefined]}
    >
      {children}
    </SessionTokenContext.Provider>
  </MockedProvider>
);

// The API refuses a restricted session (a login code that confirmed no
// address yet) both lists, so whoever knows the session is one skips them.
describe('what the navbar asks about the account', () => {
  beforeEach(() => {
    requests.invoices = 0;
    requests.subscriptions = 0;
  });

  it('asks for the invoices and the subscriptions of a reader', async () => {
    const { result } = renderHook(
      () => [useHasUnpaidInvoices(), useHasRunningSubscription()],
      { wrapper }
    );

    await waitFor(() => expect(result.current).toEqual([true, true]));
  });

  it('asks for neither when told to skip', async () => {
    const { result } = renderHook(
      () => [
        useHasUnpaidInvoices({ skip: true }),
        useHasRunningSubscription({ skip: true }),
      ],
      { wrapper }
    );

    await new Promise(resolve => setTimeout(resolve, 20));

    expect(requests).toEqual({ invoices: 0, subscriptions: 0 });
    expect(result.current).toEqual([undefined, false]);
  });
});
