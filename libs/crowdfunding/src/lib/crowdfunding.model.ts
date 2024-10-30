import {Directive, Field, ID, ObjectType} from '@nestjs/graphql'
import {PaginatedType} from '@wepublish/api'

@ObjectType()
@Directive('@key(fields: "id")')
export class Crowdfunding {
  @Field(() => ID)
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field()
  name!: string
}

@ObjectType()
export class PaginatedCrowdfundings extends PaginatedType(Crowdfunding) {}
