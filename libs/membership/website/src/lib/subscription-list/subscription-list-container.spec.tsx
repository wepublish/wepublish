import { MockedProvider } from '@apollo/client/testing/react';
import { composeStories, composeStory } from '@storybook/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { actWait, addDateMock } from '@wepublish/testing';
import { ExtendSubscriptionDocument } from '@wepublish/website/api';

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

  it('sends the chosen payment method and absolute return urls when extending', async () => {
    const mocks = stories.ExtendWithPaymentMethodChoice.parameters!.apolloClient
      .mocks as Array<{ request: { query: unknown }; result: unknown }>;
    const extendMock = mocks.find(
      mock => mock.request.query === ExtendSubscriptionDocument
    )!;
    // only called when the mutation's variables match the mock's
    const result = vi.fn(() => extendMock.result);
    const Story = composeStory(
      {
        ...stories.ExtendWithPaymentMethodChoice,
        parameters: {
          apolloClient: {
            mocks: mocks.map(mock =>
              mock === extendMock ? { ...mock, result } : mock
            ),
          },
        },
      },
      meta
    );

    render(<Story />);
    await actWait(200);

    fireEvent.click(
      screen.getByText('Jetzt verlängern', { selector: 'button' })
    );
    fireEvent.click(screen.getByLabelText('Online (Karte, TWINT)'));
    fireEvent.click(
      screen.getByText(/^Jetzt um .* verlängern$/, { selector: 'button' })
    );
    await actWait(200);

    expect(result).toHaveBeenCalled();
  });
});
