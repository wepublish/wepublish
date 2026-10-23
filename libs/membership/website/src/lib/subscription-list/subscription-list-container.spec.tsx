import { MockedProvider } from '@apollo/client/testing/react';
import { composeStories, composeStory } from '@storybook/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { actWait, addDateMock } from '@wepublish/testing';
import {
  PaymentMethodChangeKind,
  PaymentMethodChangeState,
} from '@wepublish/website/api';

import meta, * as stories from './subscription-list-container.stories';

const storiesCmp = composeStories(stories);

describe('SubscriptionList Container', () => {
  addDateMock();

  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      const { container } = render(
        <MockedProvider {...Component.parameters?.apolloClient}>
          <Component />
        </MockedProvider>
      );

      await actWait();

      if (Component.play) {
        await act(() => Component.play?.({ canvasElement: container }));
      }
    });
  });

  // Both queries return the same subscription. If its mock lacks a field of
  // `FullSubscription`, the second response leaves it incomplete in the cache,
  // Apollo refetches the first query, finds no mock left and shows the error
  // instead of the list. The mock delays are random, so on CI this failed now
  // and then; fixed delays make it fail every time.
  it('should keep the list when the invoices arrive after the subscriptions', async () => {
    const [subscriptions, invoices, ...mocks] =
      stories.Extend.parameters!.apolloClient.mocks;
    const Extend = composeStory(
      {
        ...stories.Extend,
        parameters: {
          apolloClient: {
            mocks: [
              { ...subscriptions, delay: 0 },
              { ...invoices, delay: 30 },
              ...mocks,
            ],
          },
        },
      },
      meta
    );

    render(<Extend />);
    await actWait(200);

    expect(screen.getByText('Jetzt verlängern')).toBeInTheDocument();
  });

  describe('changing the payment method', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('shows the new payment method once a change needing no authorization is done', async () => {
      render(<storiesCmp.ChangePaymentMethod />);
      await actWait(200);

      expect(screen.getByText('Zahlungsmethode: Rechnung')).toBeInTheDocument();

      fireEvent.click(
        screen.getByText('Zahlungsmethode ändern', { selector: 'button' })
      );
      await act(async () => {
        fireEvent.click(screen.getByText('Weiter', { selector: 'button' }));
      });
      await actWait(200);

      expect(screen.getByText('Zahlungsmethode: Online')).toBeInTheDocument();
    });

    it('asks the provider about a pending change when the reader comes back', async () => {
      render(<storiesCmp.PaymentMethodChangeCompletedMeanwhile />);
      await actWait(300);

      expect(screen.queryByText(/ausstehend/)).not.toBeInTheDocument();
      expect(screen.getByText('Zahlungsmethode: Online')).toBeInTheDocument();
    });

    it('keeps the current payment method when the reader cancels the change', async () => {
      render(<storiesCmp.PaymentMethodChangePending />);
      await actWait(200);

      expect(
        screen.getByText(/Wechsel zu Online ausstehend/)
      ).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(
          screen.getByText('Wechsel abbrechen', { selector: 'button' })
        );
      });
      await actWait(200);

      expect(screen.queryByText(/ausstehend/)).not.toBeInTheDocument();
      expect(screen.getByText('Zahlungsmethode: Rechnung')).toBeInTheDocument();
    });

    // The ChangePaymentMethod story, with the started change answered by
    // `started` instead of an immediate change.
    const withStartedChange = (started: Record<string, unknown>) => {
      const [subscriptions, invoices, change, ...mocks] =
        stories.ChangePaymentMethod.parameters!.apolloClient.mocks;
      const { changeSubscriptionPaymentMethod } = change.result.data;

      return composeStory(
        {
          ...stories.ChangePaymentMethod,
          parameters: {
            apolloClient: {
              mocks: [
                subscriptions,
                invoices,
                {
                  ...change,
                  result: {
                    data: {
                      changeSubscriptionPaymentMethod: {
                        ...changeSubscriptionPaymentMethod,
                        ...started,
                        change: {
                          ...changeSubscriptionPaymentMethod.change,
                          state: PaymentMethodChangeState.Pending,
                          ...(started.change as object),
                        },
                      },
                    },
                  },
                },
                ...mocks,
              ],
            },
          },
        },
        meta
      );
    };

    const startChange = async () => {
      await actWait(200);
      fireEvent.click(
        screen.getByText('Zahlungsmethode ändern', { selector: 'button' })
      );
      await act(async () => {
        fireEvent.click(screen.getByText('Weiter', { selector: 'button' }));
      });
      await actWait(200);
    };

    it('sends the reader to the checkout of a hosted provider', async () => {
      const location = { href: 'https://site.example.com/profile' };
      vi.spyOn(window, 'location', 'get').mockReturnValue(
        location as unknown as Location
      );
      const Story = withStartedChange({
        intentSecret: 'https://payrexx.example.com/checkout',
        paymentProviderID: 'payrexx',
      });

      render(<Story />);
      await startChange();

      expect(location.href).toBe('https://payrexx.example.com/checkout');
    });

    it('lets Stripe confirm the payment method without a charge, and closes again', async () => {
      const Story = withStartedChange({
        intentSecret: 'seti_secret',
        paymentProviderID: 'stripe',
        change: { kind: PaymentMethodChangeKind.Authorization },
      });

      render(<Story />);
      await startChange();

      expect(
        screen.getByText('Bestätigen', { selector: 'button' })
      ).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getAllByText('Abbrechen').at(-1)!);
      });

      expect(
        screen.queryByText('Bestätigen', { selector: 'button' })
      ).not.toBeInTheDocument();
    });
  });
});
