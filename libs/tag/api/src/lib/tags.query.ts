import {ArgsType, Field, InputType, Int, ObjectType, registerEnumType} from '@nestjs/graphql'
import {PaginatedType, SortOrder} from '@wepublish/utils/api'
import {Tag} from './tag.model'
import {TagType} from '@prisma/client'

@InputType()
export class TagFilter {
  @Field(() => String, {nullable: true})
  tag?: string

  @Field(() => TagType, {nullable: true})
  type?: TagType
}

export enum TagSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  Tag = 'Tag'
}

registerEnumType(TagSort, {
  name: 'TagSort'
})

@ObjectType()
export class TagConnection extends PaginatedType(Tag) {}

@ArgsType()
export class TagsArgs {
  @Field(() => String, {nullable: true, description: 'Cursor for pagination'})
  cursor?: string

  @Field(() => Int, {defaultValue: 10, description: 'Number of items to fetch'})
  take?: number

  @Field(() => Int, {defaultValue: 0, description: 'Number of items to skip'})
  skip?: number

  @Field(() => TagFilter, {nullable: true, description: 'Filter for tags'})
  filter?: TagFilter

  @Field(() => TagSort, {defaultValue: TagSort.CreatedAt, description: 'Field to sort by'})
  sort?: TagSort

  @Field(() => SortOrder, {
    defaultValue: SortOrder.Descending,
    description: 'Sort order',
    nullable: true
  })
  order?: SortOrder
}
