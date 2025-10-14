import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  HasOptionalSubscription,
  PublicSubscription,
} from '@wepublish/membership/api';

@ObjectType()
export class InvoiceItem {
  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  modifiedAt!: Date;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Int)
  quantity!: number;

  @Field(() => Int)
  amount!: number;

  @Field(() => Int)
  total!: number;
}

@ObjectType({
  implements: () => [HasOptionalSubscription],
})
export class Invoice {
  @Field()
  id!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  modifiedAt!: Date;

  @Field()
  mail!: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Date, { nullable: true })
  paidAt?: Date | null;

  @Field(() => Date)
  dueAt!: Date;

  @Field(() => Date, { nullable: true })
  canceledAt?: Date | null;

  @Field(() => [InvoiceItem])
  items!: InvoiceItem[];

  subscriptionID!: string;
  subscription?: PublicSubscription | null;

  @Field(() => Int)
  total!: number;
}
