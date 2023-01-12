import { Invoice, Prisma, PrismaClient } from '@prisma/client';
import { ConnectionResult } from '../../db/common';
import { InvoiceFilter, InvoiceSort } from '../../db/invoice';
import { SortOrder } from '../queries/sort';
export declare const createInvoiceOrder: (field: InvoiceSort, sortOrder: SortOrder) => Prisma.InvoiceFindManyArgs['orderBy'];
export declare const createInvoiceFilter: (filter: Partial<InvoiceFilter>) => Prisma.InvoiceWhereInput;
export declare const getInvoices: (filter: Partial<InvoiceFilter>, sortedField: InvoiceSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, invoice: PrismaClient['invoice']) => Promise<ConnectionResult<Invoice>>;
//# sourceMappingURL=invoice.queries.d.ts.map