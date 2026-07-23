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
import { HasImage } from '@wepublish/image/api';
import type { RichtextJSONDocument } from '@wepublish/richtext';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { PaginatedType, SortOrder } from '@wepublish/utils/api';

@ObjectType({
  implements: () => [HasImage],
})
export class Goodie extends HasImage {
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

  @Field(() => Int, { nullable: true })
  stock?: number;

  @Field()
  active!: boolean;
}

@InputType()
export class GoodieFilter {
  @Field({ nullable: true })
  name?: string;

  @Field(() => [String], { nullable: true })
  memberPlans?: string[];

  @Field({ nullable: true })
  active?: boolean;
}

export enum GoodieSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  Name = 'Name',
}

registerEnumType(GoodieSort, {
  name: 'GoodieSort',
});

@ObjectType()
export class PaginatedGoodies extends PaginatedType(Goodie) {}

@ArgsType()
export class GoodieListArgs {
  @Field(() => String, { nullable: true, description: 'Cursor for pagination' })
  cursorId?: string;

  @Field(() => Int, {
    defaultValue: 10,
    description: 'Number of items to fetch',
  })
  take?: number;

  @Field(() => Int, { defaultValue: 0, description: 'Number of items to skip' })
  skip?: number;

  @Field(() => GoodieFilter, {
    nullable: true,
    description: 'Filter for goodies',
  })
  filter?: GoodieFilter;

  @Field(() => GoodieSort, {
    defaultValue: GoodieSort.CreatedAt,
    description: 'Field to sort by',
  })
  sort?: GoodieSort;

  @Field(() => SortOrder, {
    defaultValue: SortOrder.Descending,
    description: 'Sort order',
    nullable: true,
  })
  order?: SortOrder;
}

@ArgsType()
export class CreateGoodieInput extends PickType(
  Goodie,
  ['name', 'description', 'stock', 'active', 'imageID'] as const,
  ArgsType
) {
  @Field(() => [String])
  memberPlanIDs!: string[];
}

@ArgsType()
export class UpdateGoodieInput extends PartialType(
  CreateGoodieInput,
  ArgsType
) {
  @Field()
  id!: string;
}
