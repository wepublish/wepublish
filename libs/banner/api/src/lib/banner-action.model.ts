import {ArgsType, Field, ID, InputType, ObjectType} from '@nestjs/graphql'

@ArgsType()
export class BannerActionArgs {
  @Field()
  bannerId!: string
}

@ObjectType()
@InputType()
export class BannerActionFields {
  @Field()
  label!: string

  @Field()
  url!: string

  @Field()
  style!: string
}

@ObjectType()
export class BannerAction extends BannerActionFields {
  @Field(() => ID)
  id!: string
}

@InputType()
export class CreateBannerActionInput extends BannerActionFields {}

@InputType()
export class UpdateBannerActionInput extends BannerActionFields {
  @Field(() => ID)
  id!: string
}
