import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UpgradeSubscription {
  @Field()
  discountAmount!: number;

  @Field(() => Float, { nullable: true })
  discountPercent?: number;

  @Field({ nullable: true })
  discountCodeValid?: boolean;
}
