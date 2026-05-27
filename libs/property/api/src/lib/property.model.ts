import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';

@ObjectType()
export class Property {
  @Field()
  key!: string;

  @Field()
  value!: string;

  @Field()
  public!: boolean;
}

@InputType()
export class PropertyInput extends OmitType(Property, [] as const, InputType) {
  @Field({ nullable: true })
  id?: string;
}
