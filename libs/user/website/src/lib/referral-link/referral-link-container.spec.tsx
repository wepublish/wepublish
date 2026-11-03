import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockOperation,
  mockSensitiveDataUser,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { ReferralCodeDocument } from '@wepublish/website/api';
import { t } from 'i18next';
import { ReferralLinkContainer } from './referral-link-container';

const currentUser = mockSensitiveDataUser();

const referralCodeQuery = mockOperation(ReferralCodeDocument, {
  variables: {},
  data: {
    __typename: 'Query',
    me: {
      __typename: 'SensitiveDataUser',
      id: currentUser.id,
      referralCode: 'K7QX2M9P',
    },
  },
});

const referralLink = () =>
  `${window.location.origin}/mitmachen?referrer=K7QX2M9P`;

describe('ReferralLinkContainer', () => {
  it('shows the referral link of the reader', async () => {
    renderWithProviders(<ReferralLinkContainer />, {
      user: currentUser,
      mocks: [referralCodeQuery],
    });

    expect(
      await screen.findByRole('heading', { name: t('user.referral.title') })
    ).toBeInTheDocument();
    expect(await screen.findByDisplayValue(referralLink())).toBeInTheDocument();
  });

  it('copies the referral link', async () => {
    const reader = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue();

    renderWithProviders(<ReferralLinkContainer />, {
      user: currentUser,
      mocks: [referralCodeQuery],
    });

    await screen.findByDisplayValue(referralLink());
    await reader.click(
      screen.getByRole('button', { name: t('user.referral.copy') })
    );

    expect(writeText).toHaveBeenCalledWith(referralLink());
    expect(
      await screen.findByText(t('user.referral.copied'))
    ).toBeInTheDocument();
  });

  it('shows nothing without a reader', () => {
    const { container } = renderWithProviders(<ReferralLinkContainer />, {
      user: null,
    });

    expect(container).toBeEmptyDOMElement();
  });
});
