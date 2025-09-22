import {Field, ObjectType} from '@nestjs/graphql'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {HasImage, Image} from '@wepublish/image/api'
import {HasOptionalPeerLc, Peer} from '@wepublish/peering/api'
import {Descendant} from 'slate'
import {GraphQLSlug} from '@wepublish/utils/api'
import {AuthorLink} from './author-link.model'

@ObjectType({
  implements: () => [HasImage, HasOptionalPeerLc]
})
export class Author implements HasImage, HasOptionalPeerLc {
  @Field()
  id!: string

  @Field(() => Date)
  createdAt!: Date

  @Field(() => Date)
  modifiedAt!: Date

  @Field()
  name!: string

  @Field(() => GraphQLSlug)
  slug!: string

  @Field({nullable: true})
  jobTitle?: string

  @Field(() => [AuthorLink], {nullable: true})
  links?: AuthorLink[]

  @Field(() => GraphQLRichText, {nullable: true})
  bio?: Descendant[]

  imageID?: string
  image?: Image

  peerId?: string
  peer?: Peer

  @Field()
  hideOnArticle!: boolean

  @Field()
  hideOnTeaser!: boolean

  @Field()
  hideOnTeam!: boolean

  @Field()
  url!: string
}
