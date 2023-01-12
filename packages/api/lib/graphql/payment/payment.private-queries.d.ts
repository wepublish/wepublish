import { Context } from '../../context';
import { PaymentFilter, PaymentSort } from '../../db/payment';
import { PrismaClient } from '@prisma/client';
export declare const getPaymentById: (id: string, authenticate: Context['authenticate'], paymentsByID: Context['loaders']['paymentsByID']) => Promise<import(".prisma/client").Payment | null>;
export declare const getAdminPayments: (filter: Partial<PaymentFilter>, sortedField: PaymentSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, authenticate: Context['authenticate'], payment: PrismaClient['payment']) => Promise<import("../..").ConnectionResult<import(".prisma/client").Payment>>;
//# sourceMappingURL=payment.private-queries.d.ts.map