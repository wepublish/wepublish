import { Context } from '../../context';
import { InvoiceFilter, InvoiceSort } from '../../db/invoice';
import { PrismaClient } from '@prisma/client';
export declare const getInvoiceById: (id: string, authenticate: Context['authenticate'], invoicesByID: Context['loaders']['invoicesByID']) => Promise<import("../../db/invoice").InvoiceWithItems | null>;
export declare const getAdminInvoices: (filter: Partial<InvoiceFilter>, sortedField: InvoiceSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, authenticate: Context['authenticate'], invoice: PrismaClient['invoice']) => Promise<import("../..").ConnectionResult<import(".prisma/client").Invoice>>;
//# sourceMappingURL=invoice.private-queries.d.ts.map