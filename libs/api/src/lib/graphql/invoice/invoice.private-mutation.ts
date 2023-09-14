import {Context} from '../../context'
import {authorise} from '../permissions'
import {CanCreateInvoice, CanDeleteInvoice} from '@wepublish/permissions/api'
import {PrismaClient, Prisma, Invoice} from '@prisma/client'
import {InvoiceWithItems} from '../../db/invoice'

export const deleteInvoiceById = async (
  id: string,
  authenticate: Context['authenticate'],
  invoice: PrismaClient['invoice']
): Promise<Invoice> => {
  const {roles} = authenticate()
  authorise(CanDeleteInvoice, roles)

  return invoice.delete({
    where: {
      id
    }
  })
}

type CreateInvoiceInput = Omit<Prisma.InvoiceUncheckedCreateInput, 'items' | 'modifiedAt'> & {
  items: Prisma.InvoiceItemUncheckedCreateWithoutInvoicesInput[]
}

export const createInvoice = (
  {items, ...input}: CreateInvoiceInput,
  authenticate: Context['authenticate'],
  invoice: PrismaClient['invoice']
): Promise<InvoiceWithItems> => {
  const {roles} = authenticate()
  authorise(CanCreateInvoice, roles)

  return invoice.create({
    data: {
      ...input,
      items: {
        create: items
      }
    },
    include: {
      items: true
    }
  })
}

type UpdateInvoiceInput = Omit<
  Prisma.InvoiceUncheckedUpdateInput,
  'items' | 'modifiedAt' | 'createdAt'
> & {
  items: Prisma.InvoiceItemUncheckedCreateWithoutInvoicesInput[]
}

export const updateInvoice = async (
  id: string,
  {items, ...input}: UpdateInvoiceInput,
  authenticate: Context['authenticate'],
  invoice: PrismaClient['invoice']
): Promise<InvoiceWithItems> => {
  const {roles} = authenticate()
  authorise(CanCreateInvoice, roles)

  return invoice.update({
    where: {id},
    data: {
      ...input,
      items: {
        deleteMany: {
          invoiceId: {
            equals: id
          }
        },
        createMany: {
          data: items
        }
      }
    },
    include: {
      items: true
    }
  })
}

export const markInvoiceAsPaid = async (
  id: string,
  authenticate: Context['authenticate'],
  userSession: Context['authenticateUser'],
  prismaClient: PrismaClient
): Promise<InvoiceWithItems> => {
  const {roles} = authenticate()
  authorise(CanCreateInvoice, roles)
  const user = userSession()

  const invoice = await prismaClient.invoice.findUnique({
    where: {
      id
    },
    include: {
      subscriptionPeriods: true
    }
  })

  // Should not happen since a invoice is limited to one subscription
  if (invoice.subscriptionPeriods.length !== 1) {
    throw new Error('More than one period is linked to the invoice')
  }

  await prismaClient.subscription.update({
    where: {
      id: invoice.subscriptionID
    },
    data: {
      paidUntil: invoice.subscriptionPeriods[0].endsAt
    }
  })

  return prismaClient.invoice.update({
    where: {id},
    data: {
      manuallySetAsPaidByUserId: user.id,
      paidAt: new Date()
    },
    include: {
      items: true
    }
  })
}
