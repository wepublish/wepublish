import { GiftCodePurchaseContainer } from '@wepublish/membership/website';
import {
  FullBlockFragment,
  FullGiftCodeOffersBlockFragment,
} from '@wepublish/website/api';
import {
  BuilderGiftCodeOffersBlockProps,
  BuilderGiftCodePurchaseProps,
} from '@wepublish/website/builder';
import { replace, toLower } from 'ramda';

export const isGiftCodeOffersBlock = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullGiftCodeOffersBlockFragment =>
  block.__typename === 'GiftCodeOffersBlock';

const lowercase = replace(/^./, toLower);

export const GiftCodeOffersBlock = ({
  className,
  giftCodeOffers,
  defaultGiftCodeOfferId,
  fields,
  showDiscountCodes,
  askRecipientName,
}: BuilderGiftCodeOffersBlockProps) => {
  if (!giftCodeOffers.length) {
    return null;
  }

  return (
    <GiftCodePurchaseContainer
      className={className}
      offers={giftCodeOffers}
      defaultOfferId={defaultGiftCodeOfferId}
      fields={fields.map(lowercase) as BuilderGiftCodePurchaseProps['fields']}
      showDiscountCodes={showDiscountCodes}
      askRecipientName={askRecipientName}
    />
  );
};
