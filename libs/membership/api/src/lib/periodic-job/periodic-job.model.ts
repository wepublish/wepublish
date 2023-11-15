import {Field, ObjectType} from '@nestjs/graphql'
@ObjectType()
export class PeriodicJobModel {
  @Field()
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field()
  date!: Date

  @Field({nullable: true})
  executionTime?: Date | null

  @Field({nullable: true})
  successfullyFinished?: Date | null

  @Field({nullable: true})
  finishedWithError?: Date | null

  @Field()
  tries!: number

  @Field({nullable: true})
  error?: string | null
}
