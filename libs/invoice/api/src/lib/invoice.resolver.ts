import {
  Args,
  Mutation,
  Parent,
  ResolveField,
  Resolver,
  Query,
  Int,
} from '@nestjs/graphql';
import {
  CreateInvoiceInput,
  Invoice,
  InvoiceConnection,
  InvoiceItem,
  InvoiceListArgs,
  UpdateInvoiceInput,
} from './invoice.model';
import {
  Invoice as PInvoice,
  InvoiceItem as PInvoiceItem,
} from '@prisma/client';
import { Permissions } from '@wepublish/permissions/api';
import {
  CanCreateInvoice,
  CanDeleteInvoice,
  CanGetInvoice,
  CanGetInvoices,
} from '@wepublish/permissions';
import { InvoiceService } from './invoice.service';
import { InvoiceDataloader } from './invoice.dataloader';
import { NotFoundException } from '@nestjs/common';
import { InvoiceItemDataloader } from './invoice-items.dataloader';
import {
  Authenticated,
  CurrentUser,
  UserSession,
} from '@wepublish/authentication/api';
import { User, UserDataloaderService } from '@wepublish/user/api';

@Resolver(() => Invoice)
export class InvoiceResolver {
  constructor(
    private service: InvoiceService,
    private dataloader: InvoiceDataloader,
    private itemDataloader: InvoiceItemDataloader,
    private userDataloader: UserDataloaderService
  ) {}

  @Permissions(CanGetInvoice)
  @Query(() => Invoice, {
    description: `Returns a invoice by id.`,
  })
  async invoice(@Args('id') id: string) {
    const invoice = await this.dataloader.load(id);

    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${id} was not found.`);
    }

    return invoice;
  }

  @Permissions(CanGetInvoices)
  @Query(() => InvoiceConnection, {
    description: `Returns a paginated list of invoices based on the filters given.`,
  })
  async invoices(@Args() input: InvoiceListArgs) {
    return this.service.getInvoices(input);
  }

  @Query(() => [Invoice], {
    description: 'Get all invoices for the authenticated user',
  })
  @Authenticated()
  async userInvoices(@CurrentUser() session: UserSession) {
    return this.service.getUserInvoices(session.user.id);
  }

  @Query(() => Invoice, {
    description:
      'Check the status of an invoice and update with information from the payment provider',
  })
  @Authenticated()
  async checkInvoiceStatus(
    @Args('id') id: string,
    @CurrentUser() session: UserSession
  ) {
    return this.service.checkInvoiceStatus(id, session.user.id);
  }

  @Permissions(CanCreateInvoice)
  @Mutation(returns => Invoice, {
    description: `Creates a new invoice.`,
  })
  public createInvoice(@Args() input: CreateInvoiceInput) {
    return this.service.createInvoice(input);
  }

  @Permissions(CanCreateInvoice)
  @Mutation(returns => Invoice, {
    description: `Updates an existing invoice.`,
  })
  public updateInvoice(@Args() input: UpdateInvoiceInput) {
    return this.service.updateInvoice(input);
  }

  @Permissions(CanDeleteInvoice)
  @Mutation(returns => Invoice, {
    description: `Deletes an existing invoice.`,
  })
  public deleteInvoice(@Args('id') id: string) {
    return this.service.deleteInvoice(id);
  }

  @Permissions(CanCreateInvoice)
  @Mutation(returns => Invoice, {
    description: `Marks an invoice as paid.`,
  })
  public markInvoiceAsPaid(
    @Args('id') id: string,
    @CurrentUser() session: UserSession
  ) {
    return this.service.markInvoiceAsPaid(id, session.user.id);
  }

  @ResolveField(() => [InvoiceItem])
  async items(@Parent() invoice: PInvoice & { items?: PInvoiceItem[] }) {
    return invoice.items ?? (await this.itemDataloader.load(invoice.id)) ?? [];
  }

  @ResolveField(() => Int)
  async total(@Parent() invoice: PInvoice & { items?: PInvoiceItem[] }) {
    const items = await this.items(invoice);

    return items.reduce((total, item) => {
      return total + item.quantity * item.amount;
    }, 0);
  }

  @ResolveField(() => User, { nullable: true })
  async manuallySetAsPaidByUser(@Parent() invoice: PInvoice) {
    return invoice.manuallySetAsPaidByUserId ?
        this.userDataloader.load(invoice.manuallySetAsPaidByUserId)
      : null;
  }
}

@Resolver(() => InvoiceItem)
export class InvoiceItemResolver {
  @ResolveField(() => Int)
  total(@Parent() invoiceItem: PInvoiceItem): number {
    return invoiceItem.amount * invoiceItem.quantity;
  }
}
