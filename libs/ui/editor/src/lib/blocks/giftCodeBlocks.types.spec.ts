import {
  EditorBlockType,
  FullBlockFragment,
  SubscribeBlockField,
} from '@wepublish/editor/api';

import { BlockMap } from './blockMap';
import { blockForQueryBlock, mapBlockValueToBlockInput } from './types';

const queryBlock = (block: Record<string, unknown>) =>
  ({
    disabled: false,
    blockStyle: null,
    blockStyleName: null,
    ...block,
  }) as unknown as FullBlockFragment;

describe('gift code blocks', () => {
  it('maps a redeem gift code block in and out', () => {
    const block = blockForQueryBlock(
      queryBlock({
        __typename: 'RedeemGiftCodeBlock',
        fields: [SubscribeBlockField.FirstName],
      })
    );

    expect(block.type).toBe(EditorBlockType.RedeemGiftCode);
    expect(mapBlockValueToBlockInput(block)).toEqual({
      redeemGiftCode: {
        blockStyle: null,
        disabled: false,
        fields: [SubscribeBlockField.FirstName],
        timing: null,
      },
    });
  });

  it('maps a gift code offers block in and out', () => {
    const block = blockForQueryBlock(
      queryBlock({
        __typename: 'GiftCodeOffersBlock',
        fields: [SubscribeBlockField.Address],
        giftCodeOfferIds: ['offer-2', 'offer-1'],
        defaultGiftCodeOfferId: 'offer-1',
        showDiscountCodes: true,
        askRecipientName: false,
      })
    );

    expect(block.type).toBe(EditorBlockType.GiftCodeOffers);
    expect(mapBlockValueToBlockInput(block)).toEqual({
      giftCodeOffers: {
        blockStyle: null,
        disabled: false,
        fields: [SubscribeBlockField.Address],
        giftCodeOfferIds: ['offer-2', 'offer-1'],
        defaultGiftCodeOfferId: 'offer-1',
        showDiscountCodes: true,
        askRecipientName: false,
        timing: null,
      },
    });
  });

  it('maps the gift code redemption of a subscribe block in and out', () => {
    const block = blockForQueryBlock(
      queryBlock({
        __typename: 'SubscribeBlock',
        fields: [],
        memberPlanIds: [],
        memberPlanRenderSettings: [],
        showGiftCodeRedemption: true,
        giftCodeRedemptionPageId: 'page-1',
        giftCodeRedemptionLinkText: 'Geschenk einlösen',
      })
    );

    expect(mapBlockValueToBlockInput(block)).toEqual({
      subscribe: expect.objectContaining({
        showGiftCodeRedemption: true,
        giftCodeRedemptionPageId: 'page-1',
        giftCodeRedemptionLinkText: 'Geschenk einlösen',
      }),
    });
  });

  it.each([EditorBlockType.RedeemGiftCode, EditorBlockType.GiftCodeOffers])(
    'only offers the %s block with the gift codes feature',
    type => {
      expect(BlockMap[type].feature).toBe('gift-codes');
    }
  );
});
