import {Optional} from '@nestjs/common'
import {ArgsType, Field, ID, InputType, Int, ObjectType} from '@nestjs/graphql'
import {PaginationArgs} from '@wepublish/api'

@ObjectType({description: 'Banner'})
export class Banner {
  @Field(type => ID)
  id!: string

  @Field()
  title!: string

  @Field({nullable: true})
  text!: string
}

@ArgsType()
export class BannerArgs extends PaginationArgs {}

@InputType()
export class NewBannerInput {
  @Field()
  title!: string

  @Field()
  text!: string
}

@InputType()
export class UpdateBannerInput {
  @Field()
  id!: string

  @Field()
  @Optional()
  title!: string

  @Field()
  @Optional()
  text!: string
}
