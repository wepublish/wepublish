import {Context} from '../../context'
import {authorise} from '../permissions'
import {CanGetInvoice, CanGetInvoices} from '@wepublish/permissions/api'
import {InvoiceFilter, InvoiceSort} from '../../db/invoice'
import {PrismaClient} from '@prisma/client'
import {getInvoices} from './invoice.queries'

export const getInvoiceById = (
  id: string,
  authenticate: Context['authenticate'],
  invoicesByID: Context['loaders']['invoicesByID']
) => {
  const {roles} = authenticate()
  authorise(CanGetInvoice, roles)

  return invoicesByID.load(id)
}

export const getAdminInvoices = async (
  filter: Partial<InvoiceFilter>,
  sortedField: InvoiceSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  authenticate: Context['authenticate'],
  invoice: PrismaClient['invoice']
) => {
  const {roles} = authenticate()
  authorise(CanGetInvoices, roles)

  return getInvoices(filter, sortedField, order, cursorId, skip, take, invoice)
}
