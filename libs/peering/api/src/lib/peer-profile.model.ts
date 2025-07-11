import {Field, ObjectType} from '@nestjs/graphql'
import {Image} from '@wepublish/image/api'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {ColorScalar} from './scalars/color.scalar'
import {Node} from 'slate'

@ObjectType('PeerProfile')
export class PeerProfile {
  @Field()
  name!: string

  @Field({nullable: true})
  logoID?: string

  @Field(() => Image, {nullable: true})
  logo?: Image

  @Field({nullable: true})
  squareLogoId?: string

  @Field(() => Image, {nullable: true})
  squareLogo?: Image

  @Field(() => ColorScalar)
  themeColor!: string

  @Field(() => ColorScalar)
  themeFontColor!: string

  @Field()
  hostURL!: string

  @Field()
  websiteURL!: string

  @Field(() => GraphQLRichText)
  callToActionText!: Node[]

  @Field()
  callToActionURL!: string

  @Field({nullable: true})
  callToActionImageURL?: string

  @Field({nullable: true})
  callToActionImageID?: string

  @Field(() => Image, {nullable: true})
  callToActionImage?: Image
}
