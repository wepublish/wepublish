import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Permission {
  @Field()
  id!: string;

  @Field()
  description!: string;

  @Field()
  deprecated!: boolean;
}
