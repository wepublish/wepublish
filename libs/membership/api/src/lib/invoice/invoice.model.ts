import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  OmitType,
  PartialType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import { Currency } from '@prisma/client';
import { DateFilter, PaginatedType, SortOrder } from '@wepublish/utils/api';
import { User } from '@wepublish/user/api';
import { HasOptionalSubscription } from '../subscription/has-subscription/has-subscription.model';

export enum InvoiceSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  PaidAt = 'PaidAt',
}

registerEnumType(Currency, {
  name: 'Currency',
});

registerEnumType(InvoiceSort, {
  name: 'InvoiceSort',
});

@ObjectType()
export class InvoiceItem {
  @Field()
  id!: string;
  @Field()
  createdAt!: Date;
  @Field()
  modifiedAt!: Date;

  @Field()
  name!: string;
  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Int)
  quantity!: number;
  @Field(() => Int)
  amount!: number;
  @Field(() => Int)
  total!: number;
}

@InputType()
export class InvoiceItemInput extends PickType(
  InvoiceItem,
  ['name', 'description', 'quantity', 'amount'] as const,
  InputType
) {}

@ObjectType({
  implements: () => [HasOptionalSubscription],
})
export class Invoice extends HasOptionalSubscription {
  @Field()
  id!: string;
  @Field(() => Date)
  createdAt!: Date;
  @Field(() => Date)
  modifiedAt!: Date;

  @Field({ nullable: true })
  manuallySetAsPaidByUserId?: string;
  @Field(() => User, { nullable: true })
  manuallySetAsPaidByUser?: User;

  @Field(() => Date, { nullable: true })
  paidAt?: Date;
  @Field(() => Date)
  dueAt!: Date;
  @Field(() => Date)
  scheduledDeactivationAt!: Date;
  @Field(() => Date, { nullable: true })
  canceledAt?: Date;

  @Field()
  mail!: string;
  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Currency)
  currency!: Currency;
  @Field(() => [InvoiceItem])
  items!: InvoiceItem[];
  @Field(() => Int)
  total!: number;
}

@ObjectType()
export class InvoiceConnection extends PaginatedType(Invoice) {}

@ArgsType()
export class CreateInvoiceInput extends PickType(
  Invoice,
  [
    'mail',
    'description',
    'manuallySetAsPaidByUserId',
    'subscriptionID',
    'currency',
    'dueAt',
    'scheduledDeactivationAt',
  ] as const,
  ArgsType
) {
  @Field(() => [InvoiceItemInput])
  items!: InvoiceItemInput[];
}

@ArgsType()
export class ImportInvoiceInput extends OmitType(
  CreateInvoiceInput,
  [] as const,
  ArgsType
) {}

@ArgsType()
export class UpdateInvoiceInput extends PartialType(
  CreateInvoiceInput,
  ArgsType
) {
  @Field()
  id!: string;
}

@InputType()
export class InvoiceFilter {
  @Field({ nullable: true })
  mail?: string;
  @Field(() => DateFilter, { nullable: true })
  paidAt?: DateFilter;
  @Field(() => DateFilter, { nullable: true })
  canceledAt?: DateFilter;
  @Field({ nullable: true })
  userID?: string;
  @Field({ nullable: true })
  subscriptionID?: string;
}

@ArgsType()
export class InvoiceListArgs {
  @Field(() => InvoiceFilter, { nullable: true })
  filter?: InvoiceFilter;

  @Field(type => InvoiceSort, {
    nullable: true,
    defaultValue: InvoiceSort.ModifiedAt,
  })
  sort?: InvoiceSort;

  @Field(type => SortOrder, {
    nullable: true,
    defaultValue: SortOrder.Ascending,
  })
  order?: SortOrder;

  @Field(type => Int, { nullable: true, defaultValue: 10 })
  take?: number;

  @Field(type => Int, { nullable: true, defaultValue: 0 })
  skip?: number;

  @Field({ nullable: true })
  cursorId?: string;
}
