import { screen } from '@testing-library/react';
import {
  mockGiftCodeOffer,
  mockGiftCodeOffersBlock,
  mockSensitiveDataUser,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { t } from 'i18next';
import {
  GiftCodeOffersBlock,
  isGiftCodeOffersBlock,
} from './gift-code-offers-block';

const yearly = mockGiftCodeOffer({ name: 'Ein Jahr verschenken' });
const monthly = mockGiftCodeOffer({ name: 'Einen Monat verschenken' });

describe('GiftCodeOffersBlock', () => {
  it('offers the gift code offers of the block', () => {
    renderWithProviders(
      <GiftCodeOffersBlock
        {...mockGiftCodeOffersBlock({ giftCodeOffers: [yearly, monthly] })}
      />,
      { user: mockSensitiveDataUser() }
    );

    expect(
      screen.getByRole('radiogroup', {
        name: t('giftCode.purchase.chooseOffer'),
      })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(yearly.name, { exact: false })).toBeChecked();
    expect(
      screen.getByLabelText(monthly.name, { exact: false })
    ).not.toBeChecked();
    expect(
      screen.getByLabelText(t('giftCode.purchase.recipientName'))
    ).toBeInTheDocument();
  });

  it('does not ask for the recipient when the block says so', () => {
    renderWithProviders(
      <GiftCodeOffersBlock
        {...mockGiftCodeOffersBlock({ askRecipientName: false })}
      />,
      { user: mockSensitiveDataUser() }
    );

    expect(
      screen.queryByLabelText(t('giftCode.purchase.recipientName'))
    ).not.toBeInTheDocument();
  });

  it('renders nothing without offers', () => {
    const { container } = renderWithProviders(
      <GiftCodeOffersBlock
        {...mockGiftCodeOffersBlock({ giftCodeOffers: [] })}
      />,
      { user: mockSensitiveDataUser() }
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('recognises its block', () => {
    expect(isGiftCodeOffersBlock(mockGiftCodeOffersBlock())).toBe(true);
    expect(isGiftCodeOffersBlock({ __typename: 'SubscribeBlock' })).toBe(false);
  });
});
