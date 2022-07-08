import {Context} from '../../context'
import {authorise, CanDeleteInvoice} from '../permissions'
import {PrismaClient} from '@prisma/client'

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
