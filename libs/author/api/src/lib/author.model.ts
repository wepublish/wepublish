import {
  ObjectType,
  Field,
  InputType,
  ArgsType,
  registerEnumType,
  ID,
  Directive
} from '@nestjs/graphql'
import {GraphQLSlug, PaginatedArgsType, PaginatedType, SortOrder} from '@wepublish/utils/api'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {Node} from 'slate'

export enum AuthorSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  Name = 'Name'
}

registerEnumType(AuthorSort, {
  name: 'AuthorSort'
})

@ObjectType()
@Directive('@key(fields: "id")')
export class Author {
  @Field(() => ID)
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field()
  name!: string

  @Field(() => GraphQLSlug)
  slug!: string

  @Field({nullable: true})
  jobTitle?: string

  @Field(type => GraphQLRichText, {nullable: true})
  bio!: Node[]

  @Field({nullable: true})
  imageID?: string

  @Field(() => [AuthorLink], {nullable: true})
  links?: AuthorLink[]
}

@ObjectType()
export class AuthorLink {
  @Field()
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field()
  title!: string

  @Field()
  url!: string
}

@ObjectType()
export class TaggedAuthors {
  @Field()
  authorId!: string

  @Field()
  tagId!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date
}

@ObjectType()
export class PaginatedAuthors extends PaginatedType(Author) {}

@ArgsType()
export class AuthorBySlugArgs {
  @Field(() => String)
  slug!: string
}

@ArgsType()
export class AuthorByIdArgs {
  @Field(() => ID)
  id!: string
}

@InputType()
export class AuthorFilter {
  @Field({nullable: true})
  name?: string

  @Field(() => [ID], {nullable: true})
  tagIds?: string[]
}

@ArgsType()
export class GetAuthorsArgs extends PaginatedArgsType {
  @Field(() => AuthorFilter, {nullable: true})
  filter?: Partial<AuthorFilter>

  @Field(() => AuthorSort, {nullable: true})
  sortedField?: AuthorSort

  @Field(() => SortOrder, {nullable: true, defaultValue: SortOrder.Ascending})
  order?: SortOrder
}

@InputType()
export class CreateAuthorInput {
  @Field()
  name!: string

  @Field(() => GraphQLSlug)
  slug!: string

  @Field({nullable: true})
  jobTitle?: string

  @Field(type => GraphQLRichText, {nullable: true})
  bio?: Node[]

  @Field({nullable: true})
  imageID?: string

  @Field(() => [AuthorsLinksInput])
  links!: AuthorsLinksInput[]

  @Field(() => [String])
  tagIds!: string[]
}

@ArgsType()
export class CreateAuthorArgs {
  @Field(() => CreateAuthorInput)
  author!: CreateAuthorInput
}

@InputType()
export class UpdateAuthorInput {
  @Field()
  id!: string

  @Field({nullable: true})
  name?: string

  @Field(() => GraphQLSlug, {nullable: true})
  slug?: string

  @Field({nullable: true})
  jobTitle?: string

  @Field(type => GraphQLRichText, {nullable: true})
  bio?: Node[]

  @Field({nullable: true})
  imageID?: string

  @Field(() => [AuthorsLinksInput], {nullable: true})
  links?: AuthorsLinksInput[]

  @Field(() => [String], {nullable: true})
  tagIds?: string[]
}

@ArgsType()
export class UpdateAuthorArgs {
  @Field(() => UpdateAuthorInput)
  author!: UpdateAuthorInput
}

@InputType()
export class AuthorsLinksInput {
  @Field()
  title!: string

  @Field()
  url!: string
}