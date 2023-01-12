import { Prisma, PrismaClient } from '@prisma/client';
import { Context } from './context';
export declare const onFindArticle: (prisma: PrismaClient) => Prisma.Middleware;
export declare const onFindPage: (prisma: PrismaClient) => Prisma.Middleware;
/**
 * This event listener is used after invoice has been marked as paid. The following logic is responsible to
 * update the subscription periode, eventually create a permanent user out of the temp user and sending mails
 * to the user.
 */
export declare const onInvoiceUpdate: (context: Context) => Prisma.Middleware;
//# sourceMappingURL=events.d.ts.map