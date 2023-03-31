import {Field, ObjectType, InputType, registerEnumType} from '@nestjs/graphql'
import {ConsentValue} from '@prisma/client'

registerEnumType(ConsentValue, {
  name: 'ConsentValue'
})

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

  @Field(type => ConsentValue)
  defaultValue!: ConsentValue
}

@InputType()
export class ConsentInput {
  @Field()
  name!: string

  @Field()
  slug!: string

  @Field(type => ConsentValue)
  defaultValue!: ConsentValue
}

@InputType()
export class ConsentFilter {
  @Field({nullable: true})
  name?: string

  @Field({nullable: true})
  slug?: string

  @Field(type => ConsentValue, {nullable: true})
  defaultValue?: ConsentValue
}
