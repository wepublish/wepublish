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
export class DiscountCode extends HasMemberPlanLc {
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
export class DiscountCodeFilter {
  @Field(() => [String], { nullable: true })
  memberPlans?: string[];

  @Field({ nullable: true })
  from?: Date;

  @Field({ nullable: true })
  to?: Date;
}

export enum DiscountCodesort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  Discount = 'Discount',
}

registerEnumType(DiscountCodesort, {
  name: 'DiscountCodesort',
});

@ObjectType()
export class PaginatedDiscountCodes extends PaginatedType(DiscountCode) {}

@ArgsType()
export class DiscountCodeListArgs {
  @Field(() => String, { nullable: true, description: 'Cursor for pagination' })
  cursorId?: string;

  @Field(() => Int, {
    defaultValue: 10,
    description: 'Number of items to fetch',
  })
  take?: number;

  @Field(() => Int, { defaultValue: 0, description: 'Number of items to skip' })
  skip?: number;

  @Field(() => DiscountCodeFilter, {
    nullable: true,
    description: 'Filter for discountCodes',
  })
  filter?: DiscountCodeFilter;

  @Field(() => DiscountCodesort, {
    defaultValue: DiscountCodesort.CreatedAt,
    description: 'Field to sort by',
  })
  sort?: DiscountCodesort;

  @Field(() => SortOrder, {
    defaultValue: SortOrder.Descending,
    description: 'Sort order',
    nullable: true,
  })
  order?: SortOrder;
}

@ArgsType()
export class CreateDiscountCodeInput extends PickType(
  DiscountCode,
  ['code', 'discountPercent', 'memberPlanId', 'validFrom', 'validTo'] as const,
  ArgsType
) {}

@ArgsType()
export class UpdateDiscountCodeInput extends PartialType(
  CreateDiscountCodeInput,
  ArgsType
) {
  @Field()
  id!: string;
}
