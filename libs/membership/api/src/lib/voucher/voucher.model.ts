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
import { HasMemberPlanLc } from '@wepublish/member-plan/api';
import { PaginatedType, SortOrder } from '@wepublish/utils/api';

@ObjectType({
  implements: [HasMemberPlanLc],
})
export class Voucher extends HasMemberPlanLc {
  @Field()
  id!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  modifiedAt!: Date;

  @Field()
  code!: string;

  @Field(() => Int)
  discountPercent!: number;

  @Field()
  validFrom!: Date;
  @Field()
  validTo!: Date;
}

@InputType()
export class VoucherFilter {
  @Field(() => [String], { nullable: true })
  memberPlans?: string[];

  @Field({ nullable: true })
  from?: Date;

  @Field({ nullable: true })
  to?: Date;
}

export enum VoucherSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  Discount = 'Discount',
}

registerEnumType(VoucherSort, {
  name: 'VoucherSort',
});

@ObjectType()
export class PaginatedVouchers extends PaginatedType(Voucher) {}

@ArgsType()
export class VoucherListArgs {
  @Field(() => String, { nullable: true, description: 'Cursor for pagination' })
  cursorId?: string;

  @Field(() => Int, {
    defaultValue: 10,
    description: 'Number of items to fetch',
  })
  take?: number;

  @Field(() => Int, { defaultValue: 0, description: 'Number of items to skip' })
  skip?: number;

  @Field(() => VoucherFilter, {
    nullable: true,
    description: 'Filter for vouchers',
  })
  filter?: VoucherFilter;

  @Field(() => VoucherSort, {
    defaultValue: VoucherSort.CreatedAt,
    description: 'Field to sort by',
  })
  sort?: VoucherSort;

  @Field(() => SortOrder, {
    defaultValue: SortOrder.Descending,
    description: 'Sort order',
    nullable: true,
  })
  order?: SortOrder;
}

@ArgsType()
export class CreateVoucherInput extends PickType(
  Voucher,
  ['code', 'discountPercent', 'memberPlanId', 'validFrom', 'validTo'] as const,
  ArgsType
) {}

@ArgsType()
export class UpdateVoucherInput extends PartialType(
  CreateVoucherInput,
  ArgsType
) {
  @Field()
  id!: string;
}
