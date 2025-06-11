import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'

@ObjectType()
export class Property {
  @Field()
  id!: string

  @Field()
  key!: string

  @Field()
  value!: string

  @Field()
  public!: boolean
}

@ObjectType('PublicProperties')
export class PublicProperty {
  @Field()
  key!: string

  @Field()
  value!: string
}

@InputType()
export class PropertyInput extends OmitType(Property, ['id'] as const, InputType) {
  @Field({nullable: true})
  id?: string
}
