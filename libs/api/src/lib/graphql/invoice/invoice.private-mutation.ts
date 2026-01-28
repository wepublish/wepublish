import { Context } from '../../context';
import { authorise } from '../permissions';
import { CanCreateInvoice, CanDeleteInvoice } from '@wepublish/permissions';
import { Invoice, Prisma, PrismaClient } from '@prisma/client';
import { InvoiceWithItems } from '@wepublish/payment/api';

export const deleteInvoiceById = async (
  id: string,
  authenticate: Context['authenticate'],
  invoice: PrismaClient['invoice']
): Promise<Invoice> => {
  const { roles } = authenticate();
  authorise(CanDeleteInvoice, roles);

  return invoice.delete({
    where: {
      id,
    },
  });
};

type CreateInvoiceInput = Omit<
  Prisma.InvoiceUncheckedCreateInput,
  'items' | 'modifiedAt'
> & {
  items: Prisma.InvoiceItemUncheckedCreateWithoutInvoicesInput[];
};

export const createInvoice = (
  { items, ...input }: CreateInvoiceInput,
  authenticate: Context['authenticate'],
  invoice: PrismaClient['invoice']
): Promise<InvoiceWithItems> => {
  const { roles } = authenticate();
  authorise(CanCreateInvoice, roles);

  return invoice.create({
    data: {
      ...input,
      items: {
        create: items,
      },
    },
    include: {
      items: true,
    },
  });
};

type UpdateInvoiceInput = Omit<
  Prisma.InvoiceUncheckedUpdateInput,
  'items' | 'modifiedAt' | 'createdAt'
> & {
  items: Prisma.InvoiceItemUncheckedCreateWithoutInvoicesInput[];
};

export const updateInvoice = async (
  id: string,
  { items, ...input }: UpdateInvoiceInput,
  authenticate: Context['authenticate'],
  invoice: PrismaClient['invoice']
): Promise<InvoiceWithItems> => {
  const { roles } = authenticate();
  authorise(CanCreateInvoice, roles);

  return invoice.update({
    where: { id },
    data: {
      ...input,
      items: {
        deleteMany: {
          invoiceId: {
            equals: id,
          },
        },
        createMany: {
          data: items,
        },
      },
    },
    include: {
      items: true,
    },
  });
};

export const markInvoiceAsPaid = async (
  id: string,
  authenticate: Context['authenticate'],
  userSession: Context['authenticateUser'],
  prismaClient: PrismaClient
): Promise<InvoiceWithItems> => {
  const { roles } = authenticate();
  authorise(CanCreateInvoice, roles);

  const session = userSession();
  const invoice = await prismaClient.invoice.findUnique({
    where: {
      id,
    },
    include: {
      subscriptionPeriods: true,
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (!invoice.subscriptionID) {
    throw new Error('Subscription not found');
  }

  await prismaClient.subscription.update({
    where: { id: invoice.subscriptionID },
    data: {
      confirmed: true,
    },
  });

  // Should not happen since an invoice is limited to one subscription
  if (invoice.subscriptionPeriods.length !== 1) {
    throw new Error('Not one period is linked to the invoice');
  }

  if (!invoice.subscriptionID) {
    throw new Error('Invoice has no subscriptionID');
  }

  await prismaClient.subscription.update({
    where: {
      id: invoice.subscriptionID,
    },
    data: {
      paidUntil: invoice.subscriptionPeriods[0].endsAt,
    },
  });

  return prismaClient.invoice.update({
    where: { id },
    data: {
      manuallySetAsPaidByUserId: session.user.id,
      paidAt: new Date(),
    },
    include: {
      items: true,
    },
  });
};
