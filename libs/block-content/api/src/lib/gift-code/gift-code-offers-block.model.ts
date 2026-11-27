import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { GiftCodeOffer } from '../../../../../gift-code/api/src/lib/gift-code-offer.model';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';
import { SubscribeBlockField } from '../subscribe/subscribe-block-field.model';

@ObjectType({
  implements: BaseBlock,
})
export class GiftCodeOffersBlock extends BaseBlock<
  typeof BlockType.GiftCodeOffers
> {
  @Field(() => [SubscribeBlockField], {
    defaultValue: [
      SubscribeBlockField.FirstName,
      SubscribeBlockField.Password,
      SubscribeBlockField.PasswordRepeated,
      SubscribeBlockField.Address,
    ],
  })
  fields!: SubscribeBlockField[];

  @Field(() => [String], { defaultValue: [] })
  giftCodeOfferIds!: string[];

  @Field(() => String, { nullable: true })
  defaultGiftCodeOfferId?: string | null;

  @Field(() => Boolean, { defaultValue: false })
  showDiscountCodes!: boolean;

  @Field(() => Boolean, { defaultValue: true })
  askRecipientName!: boolean;

  @Field(() => [GiftCodeOffer])
  giftCodeOffers!: GiftCodeOffer[];
}

@InputType()
export class GiftCodeOffersBlockInput extends OmitType(
  GiftCodeOffersBlock,
  ['type', 'giftCodeOffers'] as const,
  InputType
) {}
