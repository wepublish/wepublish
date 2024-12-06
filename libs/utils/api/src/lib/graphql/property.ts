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

@InputType()
export class PropertyInput extends OmitType(Property, [] as const, InputType) {}
