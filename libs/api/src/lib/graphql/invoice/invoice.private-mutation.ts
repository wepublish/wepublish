import {Context} from '../../context'
import {authorise, CanCreateInvoice, CanDeleteInvoice} from '../permissions'
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
