import {Directive, Field, ID, InputType, ObjectType} from '@nestjs/graphql'
import {BannerAction, CreateBannerActionInput} from './banner-action.model'
import {Image} from '@wepublish/image/api'

/*
This is only here to provide the interface for the "showOnPages" field
and can be removed when Pages are moved to APIv2
*/
@ObjectType()
export class PageModel {
  @Field(type => ID)
  id!: string
}

@ObjectType()
@InputType()
export class BannerFields {
  @Field()
  title!: string

  @Field()
  text!: string

  @Field({nullable: true})
  cta?: string

  @Field({})
  active!: boolean

  @Field(() => [String])
  tags!: string[]

  @Field()
  showOnArticles!: boolean

  @Field(() => String, {nullable: true})
  imageId?: string | undefined | null
}

@ObjectType()
export class Banner extends BannerFields {
  @Field(type => ID)
  id!: string

  @Field(() => [PageModel], {nullable: true})
  showOnPages?: PageModel[]

  @Field(() => Image, {nullable: true})
  image?: Image

  @Field(() => [BannerAction], {nullable: true})
  actions?: BannerAction[]
}

@InputType()
export class CreateBannerInput extends BannerFields {
  @Field(() => [CreateBannerActionInput], {nullable: true})
  actions?: CreateBannerActionInput[]

  @Field(() => [PageModelInput], {nullable: true})
  showOnPages?: PageModelInput[]
}

@InputType()
export class UpdateBannerInput extends BannerFields {
  @Field(type => ID)
  id!: string

  @Field(() => [CreateBannerActionInput], {nullable: true})
  actions?: CreateBannerActionInput[]

  @Field(() => [PageModelInput], {nullable: true})
  showOnPages?: PageModelInput[]
}

@InputType()
export class PageModelInput {
  @Field(type => ID)
  id!: string
}
