import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  Authenticated,
  CurrentUser,
  UserSession,
} from '@wepublish/authentication/api';
import { Invoice, InvoiceItem } from './invoice.model';
import { InvoiceService } from './invoice.service';

@Resolver(() => Invoice)
export class InvoiceResolver {
  constructor(private invoiceService: InvoiceService) {}

  @Query(() => [Invoice], {
    description: 'Get all invoices for the authenticated user',
  })
  @Authenticated()
  async invoices(@CurrentUser() session: UserSession) {
    return this.invoiceService.getInvoicesByUser(session.user.id);
  }

  @Query(() => Invoice, {
    description:
      'Check the status of an invoice and update with information from the payment provider',
    nullable: true,
  })
  @Authenticated()
  async checkInvoiceStatus(
    @Args('id') id: string,
    @CurrentUser() session: UserSession
  ) {
    return this.invoiceService.checkInvoiceStatus(id, session.user.id);
  }

  @ResolveField(() => Int)
  total(@Parent() invoice: Invoice): number {
    return (invoice.items || []).reduce((previousValue, currentValue) => {
      return previousValue + currentValue.quantity * currentValue.amount;
    }, 0);
  }
}

@Resolver(() => InvoiceItem)
export class InvoiceItemResolver {
  @ResolveField(() => Int)
  total(@Parent() invoiceItem: InvoiceItem): number {
    return invoiceItem.amount * invoiceItem.quantity;
  }
}
