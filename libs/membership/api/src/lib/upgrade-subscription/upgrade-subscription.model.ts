import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UpgradeSubscription {
  @Field()
  discountAmount!: number;
}
