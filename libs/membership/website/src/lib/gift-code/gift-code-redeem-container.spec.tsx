import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockChallenge,
  mockChallengeQuery,
  mockChallengeToken,
  mockGiftCodeRedemption,
  mockMemberPlan,
  mockOperation,
  mockSensitiveDataUser,
  mockSessionWithoutUser,
  mockSubscription,
  renderWithProviders,
  TEST_CAPTCHA_LABEL,
} from '@wepublish/mocks/website';
import {
  GiftCodeRedemptionAction,
  RedeemGiftCodeDocument,
  RegisterDocument,
} from '@wepublish/website/api';
import { t } from 'i18next';
import type { MockLink } from '@apollo/client/testing';
import { GiftCodeRedeemContainer } from './gift-code-redeem-container';

const subscription = mockSubscription({
  memberPlan: mockMemberPlan({ name: 'Jahresabo' }),
});

const redeem = (action: GiftCodeRedemptionAction, code = 'ABCD-EFGH-JKLM') =>
  mockOperation(RedeemGiftCodeDocument, {
    variables: { code },
    data: {
      __typename: 'Mutation',
      redeemGiftCode: mockGiftCodeRedemption({ action, subscription }),
    },
  });

const renderContainer = (
  mocks: ReadonlyArray<MockLink.MockedResponse>,
  loggedIn = true
) =>
  renderWithProviders(<GiftCodeRedeemContainer fields={[]} />, {
    mocks,
    user: loggedIn ? mockSensitiveDataUser() : null,
  });

const submit = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: t('giftCode.redeem.submit') }));

describe('GiftCodeRedeemContainer', () => {
  it('sends a logged-out reader to the login and back to this page', async () => {
    renderWithProviders(<GiftCodeRedeemContainer fields={[]} />, {
      mocks: [mockChallengeQuery(mockChallenge())],
      user: null,
      router: { asPath: '/geschenk?utm=a&ref=b' },
    });

    expect(
      screen.getByRole('link', { name: t('giftCode.redeem.loginLink') })
    ).toHaveAttribute(
      'href',
      `/login?intended=${encodeURIComponent('/geschenk?utm=a&ref=b')}`
    );
    await screen.findByRole(
      'group',
      { name: TEST_CAPTCHA_LABEL },
      { timeout: 10_000 }
    );
  });

  it.each([
    [GiftCodeRedemptionAction.CreatedSubscription, 'createdSubscription'],
    [GiftCodeRedemptionAction.ExtendedSubscription, 'extendedSubscription'],
    [GiftCodeRedemptionAction.PaidInvoice, 'paidInvoice'],
  ])('redeems the code and explains what it did (%s)', async (action, key) => {
    const user = userEvent.setup();
    renderContainer([redeem(action)]);

    await user.type(
      screen.getByLabelText(t('giftCode.redeem.code')),
      'ABCD-EFGH-JKLM'
    );
    await submit(user);

    expect(
      await screen.findByText(
        t(`giftCode.redeem.success.${key}`, { memberPlan: 'Jahresabo' })
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(t('giftCode.redeem.code'))
    ).not.toBeInTheDocument();
  });

  it('does not send an empty code', async () => {
    const user = userEvent.setup();
    renderContainer([]);

    await submit(user);

    expect(screen.getByLabelText(t('giftCode.redeem.code'))).toBeInvalid();
  });

  it('shows the error of a refused code and keeps the form', async () => {
    const user = userEvent.setup();
    renderContainer([
      mockOperation(RedeemGiftCodeDocument, {
        variables: { code: 'WRONG' },
        errors: [{ message: 'This gift code cannot be redeemed.' }],
      }),
    ]);

    await user.type(screen.getByLabelText(t('giftCode.redeem.code')), 'WRONG');
    await submit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This gift code cannot be redeemed.'
    );
    expect(screen.getByLabelText(t('giftCode.redeem.code'))).toHaveValue(
      'WRONG'
    );
  });

  it('registers a logged out reader and then redeems the code', async () => {
    const user = userEvent.setup();
    const challenge = mockChallenge({ challengeID: 'redeem-challenge' });
    const { setToken } = renderContainer(
      [
        mockChallengeQuery(challenge),
        mockOperation(RegisterDocument, {
          variables: {
            name: 'Bar',
            email: 'foobar@email.com',
            challengeAnswer: {
              challengeID: 'redeem-challenge',
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
        redeem(GiftCodeRedemptionAction.CreatedSubscription),
      ],
      false
    );

    expect(
      screen.getByRole('link', { name: t('giftCode.redeem.loginLink') })
    ).toHaveAttribute('href', expect.stringContaining('/login'));

    await user.type(
      screen.getByLabelText(t('giftCode.redeem.code')),
      'ABCD-EFGH-JKLM'
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
    await submit(user);

    await waitFor(() => expect(setToken).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText(
        t('giftCode.redeem.success.createdSubscription', {
          memberPlan: 'Jahresabo',
        })
      )
    ).toBeInTheDocument();
  });
});
