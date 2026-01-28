import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DashboardInvoice {
  @Field({ nullable: true })
  paidAt?: Date;

  @Field()
  dueAt!: Date;

  @Field({ nullable: true })
  memberPlan?: string;

  @Field(type => Int)
  amount!: number;
}
