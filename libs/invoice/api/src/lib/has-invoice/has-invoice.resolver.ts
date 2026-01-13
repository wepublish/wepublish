import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  HasOptionalInvoice,
  HasOptionalInvoiceLc,
  HasInvoice,
  HasInvoiceLc,
} from './has-invoice.model';
import { Invoice } from '../invoice.model';
import { InvoiceDataloader } from '../invoice.dataloader';

@Resolver(() => HasInvoice)
export class HasInvoiceResolver {
  constructor(private invoiceDataloader: InvoiceDataloader) {}

  @ResolveField(() => Invoice, { nullable: true })
  public invoice(@Parent() { invoiceID }: HasOptionalInvoice | HasInvoice) {
    if (!invoiceID) {
      return null;
    }

    return this.invoiceDataloader.load(invoiceID);
  }
}

@Resolver(() => HasOptionalInvoice)
export class HasOptionalInvoiceResolver extends HasInvoiceResolver {}

@Resolver(() => HasInvoiceLc)
export class HasInvoiceLcResolver {
  constructor(private invoiceDataloader: InvoiceDataloader) {}

  @ResolveField(() => Invoice, { nullable: true })
  public invoice(@Parent() { invoiceId }: HasOptionalInvoiceLc | HasInvoiceLc) {
    if (!invoiceId) {
      return null;
    }
    return this.invoiceDataloader.load(invoiceId);
  }
}

@Resolver(() => HasOptionalInvoiceLc)
export class HasOptionalInvoiceLcResolver extends HasInvoiceResolver {}
