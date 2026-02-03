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
import { GraphQLRichText } from '@wepublish/richtext/api';
import { HasImage, Image } from '@wepublish/image/api';
import { HasOptionalPeerLc, Peer } from '@wepublish/peering/api';
import { Descendant } from 'slate';
import { GraphQLSlug, PaginatedType, SortOrder } from '@wepublish/utils/api';
import { Tag } from '@wepublish/tag/api';

@ObjectType()
export class AuthorLink {
  @Field()
  title!: string;

  @Field()
  url!: string;
}

@InputType()
export class AuthorLinkInput extends OmitType(
  AuthorLink,
  [] as const,
  InputType
) {}

@ObjectType({
  implements: () => [HasImage, HasOptionalPeerLc],
})
export class Author implements HasImage, HasOptionalPeerLc {
  @Field()
  id!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  modifiedAt!: Date;

  @Field()
  name!: string;

  @Field(() => GraphQLSlug)
  slug!: string;

  @Field({ nullable: true })
  jobTitle?: string;

  @Field(() => [AuthorLink], { nullable: true })
  links?: AuthorLink[];

  @Field(() => GraphQLRichText, { nullable: true })
  bio?: Descendant[];

  @Field(() => [Tag])
  tags!: Tag[];

  imageID?: string;
  image?: Image;

  peerId?: string;
  peer?: Peer;

  @Field()
  hideOnArticle!: boolean;

  @Field()
  hideOnTeaser!: boolean;

  @Field()
  hideOnTeam!: boolean;

  @Field()
  url!: string;
}

@InputType()
export class AuthorFilter {
  @Field({ nullable: true })
  name?: string;

  @Field(() => [String], { nullable: true })
  tagIds?: string[];

  @Field({ nullable: true })
  hideOnTeam?: boolean;
}

export enum AuthorSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt',
  Name = 'name',
}

registerEnumType(AuthorSort, {
  name: 'AuthorSort',
  description: 'Sorting options for authors',
});

@ArgsType()
export class AuthorListArgs {
  @Field(() => AuthorFilter, { nullable: true })
  filter?: AuthorFilter;

  @Field(() => AuthorSort, {
    nullable: true,
    defaultValue: AuthorSort.ModifiedAt,
  })
  sort?: AuthorSort;

  @Field(() => SortOrder, {
    nullable: true,
    defaultValue: SortOrder.Descending,
  })
  order?: SortOrder;

  @Field({ nullable: true })
  cursorId?: string;

  @Field(() => Int, { nullable: true })
  skip?: number;

  @Field(() => Int, { nullable: true })
  take?: number;
}

@ArgsType()
export class AuthorArgs {
  @Field({ nullable: true })
  id?: string;

  @Field({ nullable: true })
  slug?: string;
}

@ObjectType()
export class PaginatedAuthors extends PaginatedType(Author) {}

@ArgsType()
export class CreateAuthorInput extends PickType(
  Author,
  [
    'slug',
    'name',
    'jobTitle',
    'bio',
    'hideOnArticle',
    'hideOnTeam',
    'hideOnTeaser',
  ] as const,
  ArgsType
) {
  @Field(() => [String])
  tagIds!: string[];

  @Field(() => [AuthorLinkInput])
  links!: AuthorLinkInput[];

  @Field({ nullable: true })
  imageID?: string;
}

@ArgsType()
export class UpdateAuthorInput extends PartialType(
  CreateAuthorInput,
  ArgsType
) {
  @Field()
  id!: string;
}
