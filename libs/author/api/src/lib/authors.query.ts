import {ArgsType, Field, InputType, Int, ObjectType, registerEnumType} from '@nestjs/graphql'
import {GraphQLSlug, PaginatedType, SortOrder} from '@wepublish/utils/api'
import {Author} from './author.model'

@InputType()
export class AuthorFilter {
  @Field({nullable: true})
  name?: string

  @Field(() => [String], {nullable: true})
  tagIds?: string[]

  @Field({nullable: true})
  hideOnTeam?: boolean
}

export enum AuthorSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt',
  Name = 'name'
}

registerEnumType(AuthorSort, {
  name: 'AuthorSort',
  description: 'Sorting options for authors'
})

@ArgsType()
export class AuthorsQueryArgs {
  @Field(() => AuthorFilter, {nullable: true})
  filter?: AuthorFilter

  @Field(() => AuthorSort, {nullable: true, defaultValue: AuthorSort.ModifiedAt})
  sort?: AuthorSort

  @Field(() => SortOrder, {nullable: true, defaultValue: SortOrder.Descending})
  order?: SortOrder

  @Field({nullable: true})
  cursor?: string

  @Field(() => Int, {nullable: true})
  skip?: number

  @Field(() => Int, {nullable: true})
  take?: number
}

@ArgsType()
export class AuthorArgs {
  @Field({nullable: true})
  id?: string

  @Field(() => GraphQLSlug, {nullable: true})
  slug?: string
}

@ObjectType()
export class PaginatedAuthors extends PaginatedType(Author) {}
