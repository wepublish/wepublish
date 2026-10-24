import { composeStories } from '@storybook/react';
import { act, render, waitFor } from '@testing-library/react';
import { userEvent, within } from 'storybook/test';
import {
  mockGiftCodeOffer,
  mockPaymentMethod,
} from '@wepublish/storybook/mocks';
import * as stories from './gift-code-purchase.stories';

const storiesCmp = composeStories(stories);

describe('GiftCodePurchase', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      const { container } = render(<Component />);

      if (Component.play) {
        await act(() => Component.play?.({ canvasElement: container }));
      }
    }, 30000);
  });

  it('registers a logged out buyer together with the purchase', async () => {
    vi.stubGlobal('turnstile', {
      render: (
        _container: HTMLElement,
        options: { callback: (token: string) => void }
      ) => {
        options.callback('turnstile-token');

        return 'turnstile-widget';
      },
      reset: vi.fn(),
      remove: vi.fn(),
      getResponse: vi.fn(),
      isExpired: vi.fn(() => false),
    });

    const onPurchaseWithRegister = vi.fn();
    const { LoggedOut } = storiesCmp;
    const { container, unmount } = render(
      <LoggedOut
        fields={['firstName']}
        onPurchaseWithRegister={onPurchaseWithRegister}
      />
    );
    const canvas = within(container);

    await userEvent.type(
      canvas.getByLabelText('Name der beschenkten Person', {
        selector: 'input',
        exact: false,
      }),
      'Anna Muster'
    );
    await userEvent.type(
      canvas.getByLabelText('Vorname', { selector: 'input' }),
      'Foo'
    );
    await userEvent.type(
      canvas.getByLabelText('Nachname', { selector: 'input' }),
      'Bar'
    );
    await userEvent.type(
      canvas.getByLabelText('Email', { selector: 'input' }),
      'foobar@example.com'
    );
    await userEvent.click(canvas.getByRole('button', { name: /kaufen/i }));

    await waitFor(() =>
      expect(onPurchaseWithRegister).toHaveBeenCalledWith({
        register: expect.objectContaining({
          firstName: 'Foo',
          name: 'Bar',
          email: 'foobar@example.com',
          challengeAnswer: {
            challengeID: '1x00000000000000000000AA',
            challengeSolution: 'turnstile-token',
          },
        }),
        purchase: {
          offerId: 'offer-yearly',
          recipientName: 'Anna Muster',
          message: null,
          paymentMethodId: expect.any(String),
        },
      })
    );

    unmount();
  }, 30000);

  it('switches to a payment method of the newly chosen offer', async () => {
    const onPurchase = vi.fn();
    const { LoggedInFilled } = storiesCmp;
    const yearlyOffer = mockGiftCodeOffer({
      id: 'offer-yearly',
      paymentMethods: [mockPaymentMethod({ id: 'yearly-method' })],
    });
    const monthlyOffer = mockGiftCodeOffer({
      id: 'offer-monthly',
      name: 'Monatsabo verschenken',
      paymentMethods: [mockPaymentMethod({ id: 'monthly-method' })],
    });
    const { container, unmount } = render(
      <LoggedInFilled
        offers={[yearlyOffer, monthlyOffer]}
        onPurchase={onPurchase}
      />
    );
    const canvas = within(container);

    await userEvent.click(
      canvas.getByLabelText(monthlyOffer.name, { exact: false })
    );
    await userEvent.type(
      canvas.getByLabelText('Name der beschenkten Person', {
        selector: 'input',
        exact: false,
      }),
      'Anna Muster'
    );
    await userEvent.click(canvas.getByRole('button', { name: /kaufen/i }));

    await waitFor(() =>
      expect(onPurchase).toHaveBeenCalledWith({
        offerId: 'offer-monthly',
        recipientName: 'Anna Muster',
        message: null,
        paymentMethodId: 'monthly-method',
      })
    );

    unmount();
  }, 30000);

  it('shows the description the editor wrote for an offer', async () => {
    const { SingleOffer } = storiesCmp;
    const offer = mockGiftCodeOffer({
      id: 'offer-described',
      description: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Ein Jahr lang unabhängiger Journalismus' },
            ],
          },
        ],
      },
    });
    const { findByText, unmount } = render(<SingleOffer offers={[offer]} />);

    expect(
      await findByText('Ein Jahr lang unabhängiger Journalismus')
    ).toBeTruthy();

    unmount();
  }, 30000);

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});
