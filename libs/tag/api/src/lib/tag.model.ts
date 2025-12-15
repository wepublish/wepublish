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
import { TagType } from '@prisma/client';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { PaginatedType, SortOrder } from '@wepublish/utils/api';
import { Descendant } from 'slate';

@ObjectType()
export class Tag {
  @Field()
  id!: string;

  @Field(() => String, { nullable: true })
  tag?: string;

  @Field(() => TagType)
  type!: TagType;

  @Field({ defaultValue: false })
  main!: boolean;

  @Field(() => GraphQLRichText, { nullable: true })
  description?: Descendant[];

  @Field()
  url!: string;
}

@InputType()
export class TagFilter {
  @Field(() => String, { nullable: true })
  tag?: string;

  @Field(() => TagType, { nullable: true })
  type?: TagType;

  @Field(() => [String], { nullable: true })
  tags?: string[];
}

registerEnumType(TagType, {
  name: 'TagType',
  description: 'Type of tag.',
});

export enum TagSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  Tag = 'Tag',
}

registerEnumType(TagSort, {
  name: 'TagSort',
});

@ObjectType()
export class PaginatedTags extends PaginatedType(Tag) {}

@ArgsType()
export class TagListArgs {
  @Field(() => String, { nullable: true, description: 'Cursor for pagination' })
  cursorId?: string;

  @Field(() => Int, {
    defaultValue: 10,
    description: 'Number of items to fetch',
  })
  take?: number;

  @Field(() => Int, { defaultValue: 0, description: 'Number of items to skip' })
  skip?: number;

  @Field(() => TagFilter, { nullable: true, description: 'Filter for tags' })
  filter?: TagFilter;

  @Field(() => TagSort, {
    defaultValue: TagSort.CreatedAt,
    description: 'Field to sort by',
  })
  sort?: TagSort;

  @Field(() => SortOrder, {
    defaultValue: SortOrder.Descending,
    description: 'Sort order',
    nullable: true,
  })
  order?: SortOrder;
}

@ArgsType()
export class CreateTagInput extends PickType(
  Tag,
  ['tag', 'main', 'type', 'description'] as const,
  ArgsType
) {}

@ArgsType()
export class UpdateTagInput extends PartialType(CreateTagInput, ArgsType) {
  @Field()
  id!: string;
}
