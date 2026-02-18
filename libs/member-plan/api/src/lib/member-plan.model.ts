import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  OmitType,
  PartialType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import { PaginatedType, SortOrder } from '@wepublish/utils/api';
import { HasImage } from '@wepublish/image/api';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { Descendant } from 'slate';
import { PaymentMethod } from '@wepublish/payment/api';
import { Currency, PaymentPeriodicity, ProductType } from '@prisma/client';
import { Page } from '@wepublish/page/api';

export enum MemberPlanSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
}

registerEnumType(MemberPlanSort, {
  name: 'MemberPlanSort',
});

registerEnumType(PaymentPeriodicity, {
  name: 'PaymentPeriodicity',
});

registerEnumType(Currency, {
  name: 'Currency',
});

registerEnumType(ProductType, {
  name: 'ProductType',
});

@ObjectType()
export class AvailablePaymentMethod {
  @Field(() => [String])
  paymentMethodIDs!: string[];

  @Field(() => [PaymentMethod])
  paymentMethods!: PaymentMethod[];

  @Field(() => [PaymentPeriodicity])
  paymentPeriodicities!: PaymentPeriodicity[];

  @Field()
  forceAutoRenewal!: boolean;
}

@InputType()
export class AvailablePaymentMethodInput extends OmitType(
  AvailablePaymentMethod,
  ['paymentMethods'] as const,
  InputType
) {}

@ObjectType({
  implements: () => [HasImage],
})
export class MemberPlan extends HasImage {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  active!: boolean;

  @Field()
  slug!: string;

  @Field(() => GraphQLRichText, { nullable: true })
  description?: Descendant[];

  @Field(() => GraphQLRichText, { nullable: true })
  shortDescription?: Descendant[];

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => Currency)
  currency!: Currency;

  @Field(() => Int)
  amountPerMonthMin!: number;

  @Field(() => Int, { nullable: true })
  amountPerMonthMax?: number;

  @Field(() => Int, { nullable: true })
  amountPerMonthTarget?: number;

  @Field(() => Int, { nullable: true })
  maxCount?: number;

  @Field()
  extendable!: boolean;

  @Field(() => [AvailablePaymentMethod])
  availablePaymentMethods!: AvailablePaymentMethod[];

  @Field(() => ProductType)
  productType!: ProductType;

  @Field({ nullable: true })
  externalReward?: string;

  @Field({ nullable: true })
  migrateToTargetPaymentMethodID?: string;
  @Field(() => PaymentMethod, { nullable: true })
  migrateToTargetPaymentMethod?: PaymentMethod;

  @Field({ nullable: true })
  successPageId?: string;
  @Field(() => Page, { nullable: true })
  successPage?: Page;

  @Field({ nullable: true })
  failPageId?: string;
  @Field(() => Page, { nullable: true })
  failPage?: Page;

  @Field({ nullable: true })
  confirmationPageId?: string;
  @Field(() => Page, { nullable: true })
  confirmationPage?: Page;
}

@ObjectType()
export class PaginatedMemberPlans extends PaginatedType(MemberPlan) {}

@InputType()
export class MemberPlanFilter {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  active?: boolean;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => ProductType, { nullable: true })
  productType?: ProductType;
}

@ArgsType()
export class CreateMemberPlanInput extends PickType(
  MemberPlan,
  [
    'name',
    'slug',
    'imageID',
    'description',
    'shortDescription',
    'tags',
    'active',
    'amountPerMonthMin',
    'amountPerMonthMax',
    'amountPerMonthTarget',
    'currency',
    'extendable',
    'productType',
    'externalReward',
    'maxCount',
    'migrateToTargetPaymentMethodID',
    'successPageId',
    'failPageId',
    'confirmationPageId',
  ] as const,
  ArgsType
) {
  @Field(() => [AvailablePaymentMethodInput])
  availablePaymentMethods!: AvailablePaymentMethodInput[];
}

@ArgsType()
export class UpdateMemberPlanInput extends PartialType(
  CreateMemberPlanInput,
  ArgsType
) {
  @Field()
  id!: string;
}

@ArgsType()
export class MemberPlanListArgs {
  @Field(type => MemberPlanFilter, { nullable: true })
  filter?: MemberPlanFilter;

  @Field(type => MemberPlanSort, {
    nullable: true,
    defaultValue: MemberPlanSort.ModifiedAt,
  })
  sort?: MemberPlanSort;

  @Field(type => SortOrder, {
    nullable: true,
    defaultValue: SortOrder.Ascending,
  })
  order?: SortOrder;

  @Field(type => Int, { nullable: true, defaultValue: 10 })
  take?: number;

  @Field(type => Int, { nullable: true, defaultValue: 0 })
  skip?: number;

  @Field({ nullable: true })
  cursorId?: string;
}
