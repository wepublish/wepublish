import { EditorBlockType, FullBlockFragment } from '@wepublish/editor/api';

import {
  blockForQueryBlock,
  mapBlockValueToBlockInput,
  SubscribeBlockValue,
} from './types';

const queryBlock = (input: Record<string, unknown> = {}): FullBlockFragment =>
  ({
    __typename: 'SubscribeBlock',
    disabled: false,
    blockStyle: null,
    blockStyleName: null,
    memberPlanIds: [],
    memberPlanRenderSettings: [],
    fields: [],
    periodicityDisplay: null,
    showGoodies: false,
    showDiscountCodes: false,
    goodieMinValue: null,
    goodieMinValueAppliesToUpgrade: false,
    hideRepeatGoodieOnUpgrade: false,
    giftCodeOfferIds: ['offer-1', 'offer-2'],
    type: 'Subscribe',
    ...input,
  }) as unknown as FullBlockFragment;

describe('subscribe block mapping', () => {
  it('reads the gift offers of a saved block', () => {
    const block = blockForQueryBlock(queryBlock());

    expect((block.value as SubscribeBlockValue).giftCodeOfferIds).toEqual([
      'offer-1',
      'offer-2',
    ]);
  });

  it('starts without gift offers when the block has none', () => {
    const block = blockForQueryBlock(queryBlock({ giftCodeOfferIds: null }));

    expect((block.value as SubscribeBlockValue).giftCodeOfferIds).toEqual([]);
  });

  it('saves the gift offers in their order', () => {
    const block = blockForQueryBlock(queryBlock());

    expect(
      mapBlockValueToBlockInput({
        ...block,
        type: EditorBlockType.Subscribe,
        value: {
          ...(block.value as SubscribeBlockValue),
          giftCodeOfferIds: ['offer-2', 'offer-1'],
        },
      } as Parameters<typeof mapBlockValueToBlockInput>[0]).subscribe
        ?.giftCodeOfferIds
    ).toEqual(['offer-2', 'offer-1']);
  });
});
