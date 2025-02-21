import {
  ArgsType,
  Field,
  ID,
  InputType,
  ObjectType,
  OmitType,
  registerEnumType
} from '@nestjs/graphql'
import {BannerAction, CreateBannerActionInput} from './banner-action.model'
import {Image} from '@wepublish/image/api'
import {LoginStatus} from '@prisma/client'

registerEnumType(LoginStatus, {
  name: 'LoginStatus'
})

/*
This is only here to provide the interface for the "showOnPages" field
and can be removed when Pages are moved to APIv2
*/
@ObjectType()
export class PageModel {
  @Field(() => ID)
  id!: string
}

@InputType()
export class PageModelInput {
  @Field(() => ID)
  id!: string
}

@ObjectType()
export class Banner {
  @Field(() => ID)
  id!: string

  @Field()
  title!: string

  @Field()
  text!: string

  @Field(() => String, {nullable: true})
  cta?: string | null

  @Field()
  active!: boolean

  @Field()
  showOnArticles!: boolean

  @Field(() => String, {nullable: true})
  imageId?: string | null

  @Field(() => [PageModel], {nullable: true})
  showOnPages?: PageModel[]

  @Field(() => LoginStatus)
  showForLoginStatus!: LoginStatus

  @Field(() => Image, {nullable: true})
  image?: Image

  @Field(() => [BannerAction], {nullable: true})
  actions?: BannerAction[]
}

@InputType()
export class CreateBannerInput extends OmitType(
  Banner,
  ['id', 'image', 'actions', 'showOnPages'],
  InputType
) {
  @Field(() => [CreateBannerActionInput], {nullable: true})
  actions?: CreateBannerActionInput[]

  @Field(() => [PageModelInput], {nullable: true})
  showOnPages?: PageModelInput[]
}

@InputType()
export class UpdateBannerInput extends OmitType(
  Banner,
  ['image', 'actions', 'showOnPages'],
  InputType
) {
  @Field(() => [CreateBannerActionInput], {nullable: true})
  actions!: CreateBannerActionInput[]

  @Field(() => [PageModelInput], {nullable: true})
  showOnPages?: PageModelInput[]
}

export enum BannerDocumentType {
  PAGE,
  ARTICLE
}

registerEnumType(BannerDocumentType, {
  name: 'BannerDocumentType'
})

@ArgsType()
export class PrimaryBannerArgs {
  @Field(() => BannerDocumentType)
  documentType!: BannerDocumentType

  @Field(() => ID)
  documentId!: string

  @Field()
  loggedIn!: boolean
}
