import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { InvoiceItem } from '../invoice/invoice.model';
import { GoodieDataloader } from './goodie.dataloader';
import { Goodie } from './goodie.model';

@Resolver(() => InvoiceItem)
export class InvoiceItemGoodieResolver {
  constructor(private dataloader: GoodieDataloader) {}

  @ResolveField(() => Goodie, { nullable: true })
  public goodie(@Parent() invoiceItem: InvoiceItem) {
    if (!invoiceItem.goodieId) {
      return null;
    }

    return this.dataloader.load(invoiceItem.goodieId);
  }
}
