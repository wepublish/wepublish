import {ObjectType, Field, InputType, OmitType} from '@nestjs/graphql'

// Object Types
@ObjectType()
export class Property {
  @Field()
  key!: string

  @Field()
  value!: string

  @Field()
  public!: boolean
}

// Input Types
@InputType()
export class PropertyInput {
  @Field()
  key!: string

  @Field()
  value!: string

  @Field()
  public!: boolean
}

@InputType()
export class PublicProperty extends OmitType(PropertyInput, ['public'], InputType) {}
