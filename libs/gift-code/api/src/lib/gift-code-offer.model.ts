import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  PartialType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import { PaymentPeriodicity } from '@prisma/client';
import { HasImage } from '@wepublish/image/api';
import { HasMemberPlanLc } from '@wepublish/member-plan/api';
import type { RichtextJSONDocument } from '@wepublish/richtext';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { PaginatedType, SortOrder } from '@wepublish/utils/api';

@ObjectType({
  implements: () => [HasImage, HasMemberPlanLc],
})
export class GiftCodeOffer extends HasImage {
  @Field()
  id!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  modifiedAt!: Date;

  @Field()
  name!: string;

  @Field(() => GraphQLRichText, { nullable: true })
  description?: RichtextJSONDocument;

  @Field()
  active!: boolean;

  @Field()
  memberPlanId!: string;

  @Field(() => PaymentPeriodicity)
  periodicity!: PaymentPeriodicity;

  @Field(() => Int, { nullable: true })
  redemptionWindowMonths?: number | null;

  @Field(() => Int, {
    description:
      'What the buyer pays, in cents of the member plan currency. The redeemed subscription keeps the plan price.',
  })
  price!: number;

  @Field()
  allowDiscountCodes!: boolean;

  @Field({
    description:
      'Whether subscriptions started with codes of this offer renew automatically.',
  })
  autoRenew!: boolean;

  @Field(() => String, { nullable: true })
  renewalPaymentMethodId?: string | null;

  @Field(() => String, {
    nullable: true,
    description:
      'Mail template sent to the buyer once the code is issued. None, no mail.',
  })
  purchaseMailTemplateId?: string | null;

  @Field(() => String, {
    nullable: true,
    description:
      'Mail template sent to the reader who redeemed a code. None, no mail.',
  })
  redemptionMailTemplateId?: string | null;
}

@InputType()
export class GiftCodeOfferFilter {
  @Field({ nullable: true })
  memberPlanId?: string;

  @Field({ nullable: true })
  active?: boolean;

  @Field({ nullable: true })
  name?: string;
}

export enum GiftCodeOfferSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  Name = 'Name',
}

registerEnumType(GiftCodeOfferSort, {
  name: 'GiftCodeOfferSort',
});

@ObjectType()
export class PaginatedGiftCodeOffers extends PaginatedType(GiftCodeOffer) {}

@ArgsType()
export class GiftCodeOfferListArgs {
  @Field(() => String, { nullable: true, description: 'Cursor for pagination' })
  cursorId?: string;

  @Field(() => Int, {
    defaultValue: 10,
    description: 'Number of items to fetch',
  })
  take?: number;

  @Field(() => Int, { defaultValue: 0, description: 'Number of items to skip' })
  skip?: number;

  @Field(() => GiftCodeOfferFilter, {
    nullable: true,
    description: 'Filter for gift code offers',
  })
  filter?: GiftCodeOfferFilter;

  @Field(() => GiftCodeOfferSort, {
    defaultValue: GiftCodeOfferSort.ModifiedAt,
    description: 'Field to sort by',
  })
  sort?: GiftCodeOfferSort;

  @Field(() => SortOrder, {
    defaultValue: SortOrder.Descending,
    description: 'Sort order',
    nullable: true,
  })
  order?: SortOrder;
}

@ArgsType()
export class CreateGiftCodeOfferInput extends PickType(
  GiftCodeOffer,
  [
    'name',
    'description',
    'active',
    'imageID',
    'memberPlanId',
    'periodicity',
    'redemptionWindowMonths',
    'price',
    'purchaseMailTemplateId',
    'redemptionMailTemplateId',
  ] as const,
  ArgsType
) {
  @Field(() => [String])
  paymentMethodIds!: string[];

  @Field({ nullable: true })
  allowDiscountCodes?: boolean;

  @Field({ nullable: true })
  autoRenew?: boolean;

  @Field(() => String, { nullable: true })
  renewalPaymentMethodId?: string | null;
}

@ArgsType()
export class UpdateGiftCodeOfferInput extends PartialType(
  CreateGiftCodeOfferInput,
  ArgsType
) {
  @Field()
  id!: string;
}
