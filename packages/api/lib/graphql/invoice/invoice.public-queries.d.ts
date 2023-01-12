import { Context } from '../../context';
import { PrismaClient } from '@prisma/client';
export declare const getPublicInvoices: (authenticateUser: Context['authenticateUser'], subscription: PrismaClient['subscription'], invoice: PrismaClient['invoice']) => Promise<(import(".prisma/client").Invoice & {
    items: import(".prisma/client").InvoiceItem[];
})[]>;
//# sourceMappingURL=invoice.public-queries.d.ts.map