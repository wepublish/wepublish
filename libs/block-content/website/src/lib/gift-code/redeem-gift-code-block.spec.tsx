import { screen } from '@testing-library/react';
import {
  mockRedeemGiftCodeBlock,
  mockSensitiveDataUser,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { t } from 'i18next';
import {
  isRedeemGiftCodeBlock,
  RedeemGiftCodeBlock,
} from './redeem-gift-code-block';

describe('RedeemGiftCodeBlock', () => {
  it('shows only the code form, without a heading of its own', () => {
    renderWithProviders(
      <RedeemGiftCodeBlock {...mockRedeemGiftCodeBlock()} />,
      { user: mockSensitiveDataUser() }
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(
      screen.getByLabelText(t('giftCode.redeem.code'))
    ).toBeInTheDocument();
  });

  it('recognises its block', () => {
    expect(isRedeemGiftCodeBlock(mockRedeemGiftCodeBlock())).toBe(true);
    expect(isRedeemGiftCodeBlock({ __typename: 'SubscribeBlock' })).toBe(false);
  });
});
