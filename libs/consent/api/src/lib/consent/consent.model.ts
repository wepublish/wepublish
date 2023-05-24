import {Field, ObjectType, InputType} from '@nestjs/graphql'

@ObjectType()
export class Consent {
  @Field()
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field()
  name!: string

  @Field()
  slug!: string

  @Field()
  defaultValue!: boolean
}

@InputType()
export class ConsentInput {
  @Field()
  name!: string

  @Field()
  slug!: string

  @Field()
  defaultValue!: boolean
}

@InputType()
export class ConsentFilter {
  @Field({nullable: true})
  name?: string

  @Field({nullable: true})
  slug?: string

  @Field({nullable: true})
  defaultValue?: boolean
}
