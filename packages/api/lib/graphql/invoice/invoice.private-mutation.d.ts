import { Context } from '../../context';
import { PrismaClient, Prisma, Invoice } from '@prisma/client';
import { InvoiceWithItems } from '../../db/invoice';
export declare const deleteInvoiceById: (id: string, authenticate: Context['authenticate'], invoice: PrismaClient['invoice']) => Promise<Invoice>;
declare type CreateInvoiceInput = Omit<Prisma.InvoiceUncheckedCreateInput, 'items' | 'modifiedAt'> & {
    items: Prisma.InvoiceItemUncheckedCreateWithoutInvoiceInput[];
};
export declare const createInvoice: ({ items, ...input }: CreateInvoiceInput, authenticate: Context['authenticate'], invoice: PrismaClient['invoice']) => Promise<InvoiceWithItems>;
declare type UpdateInvoiceInput = Omit<Prisma.InvoiceUncheckedUpdateInput, 'items' | 'modifiedAt' | 'createdAt'> & {
    items: Prisma.InvoiceItemUncheckedCreateWithoutInvoiceInput[];
};
export declare const updateInvoice: (id: string, { items, ...input }: UpdateInvoiceInput, authenticate: Context['authenticate'], invoice: PrismaClient['invoice']) => Promise<InvoiceWithItems>;
export {};
//# sourceMappingURL=invoice.private-mutation.d.ts.map