import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { GiftCodeCancellationReason, PaymentPeriodicity } from '@prisma/client';
import { HasMemberPlanLc } from '@wepublish/member-plan/api';
import { GraphQLSlug, PaginatedType, SortOrder } from '@wepublish/utils/api';
import { GiftCodeStatus } from './gift-code-status';

registerEnumType(GiftCodeCancellationReason, {
  name: 'GiftCodeCancellationReason',
});

export enum GiftCodeSource {
  purchase = 'purchase',
  admin = 'admin',
}

registerEnumType(GiftCodeSource, {
  name: 'GiftCodeSource',
});

export const GIFT_CODE_RECIPIENT_NAME_MAX_LENGTH = 200;
export const GIFT_CODE_ADMIN_MAX_COUNT = 500;

@ObjectType({
  implements: () => [HasMemberPlanLc],
})
export class GiftCode {
  @Field()
  id!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field()
  offerId!: string;

  @Field()
  memberPlanId!: string;

  @Field(() => PaymentPeriodicity)
  periodicity!: PaymentPeriodicity;

  @Field(() => Int, { nullable: true })
  redemptionWindowMonths?: number | null;

  @Field()
  autoRenew!: boolean;

  @Field(() => String, { nullable: true })
  renewalPaymentMethodId?: string | null;

  @Field(() => String, { nullable: true })
  recipientName?: string | null;

  @Field(() => String, { nullable: true })
  buyerId?: string | null;

  @Field(() => Date, { nullable: true })
  issuedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  expiresAt?: Date | null;

  @Field(() => Date, { nullable: true })
  redeemedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  canceledAt?: Date | null;

  @Field(() => GiftCodeCancellationReason, { nullable: true })
  cancellationReason?: GiftCodeCancellationReason | null;
}

@InputType()
export class GiftCodeFilter {
  @Field(() => GiftCodeStatus, { nullable: true })
  status?: GiftCodeStatus;

  @Field({ nullable: true })
  offerId?: string;

  @Field({ nullable: true })
  memberPlanId?: string;

  @Field({ nullable: true })
  buyerId?: string;

  @Field({
    nullable: true,
    description:
      'True lists codes with a paid invoice, false codes whose invoice is not paid.',
  })
  paid?: boolean;

  @Field(() => GiftCodeSource, { nullable: true })
  source?: GiftCodeSource;

  @Field({ nullable: true })
  search?: string;

  @Field(() => Date, { nullable: true })
  createdFrom?: Date;

  @Field(() => Date, { nullable: true })
  createdTo?: Date;
}

export enum GiftCodeSort {
  CreatedAt = 'CreatedAt',
  IssuedAt = 'IssuedAt',
}

registerEnumType(GiftCodeSort, {
  name: 'GiftCodeSort',
});

@ObjectType()
export class PaginatedGiftCodes extends PaginatedType(GiftCode) {}

@ArgsType()
export class GiftCodeListArgs {
  @Field(() => String, { nullable: true, description: 'Cursor for pagination' })
  cursorId?: string;

  @Field(() => Int, {
    defaultValue: 10,
    description: 'Number of items to fetch',
  })
  take?: number;

  @Field(() => Int, { defaultValue: 0, description: 'Number of items to skip' })
  skip?: number;

  @Field(() => GiftCodeFilter, {
    nullable: true,
    description: 'Filter for gift codes',
  })
  filter?: GiftCodeFilter;

  @Field(() => GiftCodeSort, {
    defaultValue: GiftCodeSort.CreatedAt,
    description: 'Field to sort by',
  })
  sort?: GiftCodeSort;

  @Field(() => SortOrder, {
    defaultValue: SortOrder.Descending,
    description: 'Sort order',
    nullable: true,
  })
  order?: SortOrder;
}

@ArgsType()
export class PurchaseGiftCodeInput {
  @Field()
  offerId!: string;

  @Field()
  recipientName!: string;

  @Field({ nullable: true })
  discountCode?: string;

  @Field({ nullable: true })
  paymentMethodId?: string;

  @Field(() => GraphQLSlug, { nullable: true })
  paymentMethodSlug?: string;

  @Field({ nullable: true })
  successURL?: string;

  @Field({ nullable: true })
  failureURL?: string;
}

@ArgsType()
export class CreateGiftCodesInput {
  @Field()
  offerId!: string;

  @Field(() => Int, {
    description: `Number of codes to create, 1 to ${GIFT_CODE_ADMIN_MAX_COUNT}.`,
  })
  count!: number;

  @Field(() => String, { nullable: true })
  recipientName?: string | null;
}

@ArgsType()
export class PayGiftCodeInput {
  @Field()
  id!: string;

  @Field({ nullable: true })
  paymentMethodId?: string;

  @Field(() => GraphQLSlug, { nullable: true })
  paymentMethodSlug?: string;

  @Field({ nullable: true })
  successURL?: string;

  @Field({ nullable: true })
  failureURL?: string;
}

@ArgsType()
export class PayInvoiceWithGiftCodeInput {
  @Field()
  invoiceId!: string;

  @Field()
  code!: string;
}
