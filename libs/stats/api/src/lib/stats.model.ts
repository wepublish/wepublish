import {Field, ObjectType} from '@nestjs/graphql'

@ObjectType()
export class Stats {
  @Field()
  authorsCount!: number

  @Field()
  articlesCount!: number

  @Field()
  modifiedAt!: Date
}
