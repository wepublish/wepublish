import {ObjectType, Field, InputType, OmitType} from '@nestjs/graphql'

// Object Types
@ObjectType()
export class Property {
  @Field(() => String)
  key!: string

  @Field(() => String)
  value!: string

  @Field(() => Boolean)
  public!: boolean
}

@ObjectType()
export class PublicProperties extends OmitType(Property, ['public'], ObjectType) {}

// Input Types
@InputType()
export class PropertyInput extends OmitType(Property, [], InputType) {}

@InputType()
export class PublicPropertyInput extends OmitType(Property, ['public'], InputType) {}
