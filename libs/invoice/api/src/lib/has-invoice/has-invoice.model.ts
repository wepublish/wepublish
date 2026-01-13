import { Field, InterfaceType } from '@nestjs/graphql';
import { Invoice } from '../invoice.model';

@InterfaceType()
export abstract class HasOptionalInvoice {
  @Field({ nullable: true })
  invoiceID?: string;

  @Field(() => Invoice, { nullable: true })
  invoice?: Invoice;
}

@InterfaceType()
export abstract class HasInvoice {
  @Field()
  invoiceID!: string;

  @Field(() => Invoice)
  invoice!: Invoice;
}

@InterfaceType()
export abstract class HasOptionalInvoiceLc {
  @Field({ nullable: true })
  invoiceId?: string;

  @Field(() => Invoice, { nullable: true })
  invoice?: Invoice;
}

@InterfaceType()
export abstract class HasInvoiceLc {
  @Field()
  invoiceId!: string;

  @Field(() => Invoice)
  invoice!: Invoice;
}
