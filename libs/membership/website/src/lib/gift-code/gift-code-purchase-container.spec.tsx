import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockChallenge,
  mockChallengeQuery,
  mockChallengeToken,
  mockGiftCodeOffer,
  mockOperation,
  mockPayment,
  mockPaymentMethod,
  mockSensitiveDataUser,
  mockSessionWithoutUser,
  renderWithProviders,
  TEST_CAPTCHA_LABEL,
} from '@wepublish/mocks/website';
import {
  Currency,
  PaymentPeriodicity,
  PaymentState,
  PurchaseGiftCodeDocument,
  RegisterDocument,
} from '@wepublish/website/api';
import { t } from 'i18next';
import { formatCurrency } from '../formatters/format-currency';
import { MemberPlanPickerRadios } from '../memberplan-picker/memberplan-picker';
import { MemberPlanItemPicker } from '../memberplan-picker/memberplan-picker-item';
import { GiftCodePurchaseContainer } from './gift-code-purchase-container';

const card = mockPaymentMethod({ name: 'Karte', description: 'Stripe' });
const twint = mockPaymentMethod({ name: 'Twint', description: 'Payrexx' });

const yearly = mockGiftCodeOffer({
  name: 'Ein Jahr verschenken',
  periodicity: PaymentPeriodicity.Yearly,
  price: 12000,
  paymentMethods: [card, twint],
});

const monthly = mockGiftCodeOffer({
  name: 'Einen Monat verschenken',
  periodicity: PaymentPeriodicity.Monthly,
  price: 1500,
  allowDiscountCodes: true,
  paymentMethods: [twint],
});

const redirectUrl = (path: string) => `${window.location.origin}${path}`;

const purchase = (variables: Record<string, unknown>) =>
  mockOperation(PurchaseGiftCodeDocument, {
    variables: {
      successURL: redirectUrl('/profile'),
      failureURL: redirectUrl('/profile'),
      ...variables,
    },
    data: {
      __typename: 'Mutation',
      purchaseGiftCode: mockPayment({ state: PaymentState.Paid }),
    },
  });

type Props = Partial<Parameters<typeof GiftCodePurchaseContainer>[0]>;

const renderContainer = (
  mocks: ReadonlyArray<MockLink.MockedResponse>,
  props: Props = {},
  loggedIn = true
) =>
  renderWithProviders(
    <GiftCodePurchaseContainer
      offers={[yearly, monthly]}
      fields={[]}
      askRecipientName
      showDiscountCodes
      {...props}
    />,
    { mocks, user: loggedIn ? mockSensitiveDataUser() : null }
  );

const buyButton = (amount: number) =>
  screen.getByRole('button', {
    name: name => name.includes(formatCurrency(amount, Currency.Chf)),
  });

describe('GiftCodePurchaseContainer', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('shows the offers as the same cards as the subscription plans', () => {
    const { container } = renderContainer([]);

    const group = screen.getByRole('radiogroup', {
      name: t('giftCode.purchase.chooseOffer'),
    });

    expect(group).toHaveClass(MemberPlanPickerRadios.toString().slice(1));
    expect(
      container.querySelectorAll(
        `${MemberPlanItemPicker.toString()} input[type="radio"]`
      )
    ).toHaveLength(2);
    expect(
      screen.getByLabelText(monthly.name, { exact: false })
    ).toHaveAttribute('type', 'radio');
  });

  it('preselects the default offer', () => {
    renderContainer([], { defaultOfferId: monthly.id });

    expect(screen.getByLabelText(monthly.name, { exact: false })).toBeChecked();
  });

  it('buys the first offer for the named recipient', async () => {
    const user = userEvent.setup();
    renderContainer([
      purchase({
        offerId: yearly.id,
        recipientName: 'Anna',
        discountCode: null,
        paymentMethodId: card.id,
      }),
    ]);

    expect(screen.getByLabelText(yearly.name, { exact: false })).toBeChecked();

    await user.type(
      screen.getByLabelText(t('giftCode.purchase.recipientName')),
      'Anna'
    );
    await user.click(buyButton(120));

    await waitFor(() =>
      expect(window.location.href).toBe(redirectUrl('/profile'))
    );
  });

  it('asks for the recipient only when the block wants it', async () => {
    const user = userEvent.setup();
    renderContainer(
      [
        purchase({
          offerId: yearly.id,
          recipientName: null,
          discountCode: null,
          paymentMethodId: card.id,
        }),
      ],
      { askRecipientName: false }
    );

    expect(
      screen.queryByLabelText(t('giftCode.purchase.recipientName'))
    ).not.toBeInTheDocument();

    await user.click(buyButton(120));

    await waitFor(() =>
      expect(window.location.href).toBe(redirectUrl('/profile'))
    );
  });

  it('requires the recipient name when it is asked for', async () => {
    const user = userEvent.setup();
    renderContainer([]);

    await user.click(buyButton(120));

    expect(
      screen.getByLabelText(t('giftCode.purchase.recipientName'))
    ).toBeInvalid();
  });

  it('offers a discount code only for offers that allow it', async () => {
    const user = userEvent.setup();
    renderContainer([
      purchase({
        offerId: monthly.id,
        recipientName: 'Anna',
        discountCode: 'GIFT10',
        paymentMethodId: twint.id,
      }),
    ]);

    expect(
      screen.queryByLabelText(t('subscribe.discountCode.label'))
    ).not.toBeInTheDocument();

    await user.click(screen.getByLabelText(monthly.name, { exact: false }));
    await user.type(
      screen.getByLabelText(t('subscribe.discountCode.label')),
      'GIFT10'
    );
    await user.type(
      screen.getByLabelText(t('giftCode.purchase.recipientName')),
      'Anna'
    );
    await user.click(buyButton(15));

    await waitFor(() =>
      expect(window.location.href).toBe(redirectUrl('/profile'))
    );
  });

  it('hides the discount code when the block does not show it', async () => {
    const user = userEvent.setup();
    renderContainer([], { showDiscountCodes: false });

    await user.click(screen.getByLabelText(monthly.name, { exact: false }));

    expect(
      screen.queryByLabelText(t('subscribe.discountCode.label'))
    ).not.toBeInTheDocument();
  });

  it('registers a logged out buyer and then buys', async () => {
    const user = userEvent.setup();
    const challenge = mockChallenge({ challengeID: 'gift-challenge' });
    const { setToken } = renderContainer(
      [
        mockChallengeQuery(challenge),
        mockOperation(RegisterDocument, {
          variables: {
            name: 'Bar',
            email: 'foobar@email.com',
            challengeAnswer: {
              challengeID: 'gift-challenge',
              challengeSolution: mockChallengeToken,
            },
          },
          data: {
            __typename: 'Mutation',
            registerMember: {
              __typename: 'Registration',
              session: mockSessionWithoutUser(),
              user: mockSensitiveDataUser({
                firstName: null,
                name: 'Bar',
                email: 'foobar@email.com',
              }),
            },
          },
        }),
        purchase({
          offerId: yearly.id,
          recipientName: 'Anna',
          discountCode: null,
          paymentMethodId: card.id,
        }),
      ],
      {},
      false
    );

    await user.type(
      screen.getByLabelText(t('giftCode.purchase.recipientName')),
      'Anna'
    );
    await user.type(screen.getByLabelText(t('user.form.lastName')), 'Bar');
    await user.type(
      screen.getByLabelText(t('user.form.email')),
      'foobar@email.com'
    );
    await screen.findByRole(
      'group',
      { name: TEST_CAPTCHA_LABEL },
      { timeout: 10_000 }
    );
    await user.click(buyButton(120));

    await waitFor(() => expect(setToken).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(window.location.href).toBe(redirectUrl('/profile'))
    );
  });

  it('redirects to the fail page with the message when buying fails', async () => {
    const user = userEvent.setup();
    renderContainer(
      [
        mockOperation(PurchaseGiftCodeDocument, {
          variables: {
            offerId: yearly.id,
            recipientName: null,
            discountCode: null,
            paymentMethodId: card.id,
            successURL: redirectUrl('/profile'),
            failureURL: redirectUrl('/profile'),
          },
          errors: [{ message: 'Card declined' }],
        }),
      ],
      { askRecipientName: false }
    );

    await user.click(buyButton(120));

    await waitFor(() =>
      expect(window.location.href).toBe(
        `${redirectUrl('/profile')}?error=Card%20declined`
      )
    );
  });
});
