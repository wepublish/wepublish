import {Context} from '../../context'
import {authorise, CanDeleteInvoice, CanCreateInvoice} from '../permissions'
import {Prisma, PrismaClient} from '@prisma/client'

export const deleteInvoiceById = (
  id: string,
  authenticate: Context['authenticate'],
  invoice: PrismaClient['invoice']
) => {
  const {roles} = authenticate()
  authorise(CanDeleteInvoice, roles)

  return invoice.delete({
    where: {
      id
    }
  })
}

export const createInvoice = (
  input: Omit<Prisma.InvoiceUncheckedCreateInput, 'modifiedAt'>,
  authenticate: Context['authenticate'],
  invoice: PrismaClient['invoice']
) => {
  const {roles} = authenticate()
  authorise(CanCreateInvoice, roles)

  return invoice.create({
    data: {...input, modifiedAt: new Date()}
  })
}
