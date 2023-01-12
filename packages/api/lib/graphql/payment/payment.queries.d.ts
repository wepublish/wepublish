import { Payment, Prisma, PrismaClient } from '@prisma/client';
import { ConnectionResult } from '../../db/common';
import { PaymentFilter, PaymentSort } from '../../db/payment';
import { SortOrder } from '../queries/sort';
export declare const createPaymentOrder: (field: PaymentSort, sortOrder: SortOrder) => Prisma.PaymentFindManyArgs['orderBy'];
export declare const createPaymentFilter: (filter: Partial<PaymentFilter>) => Prisma.PaymentWhereInput;
export declare const getPayments: (filter: Partial<PaymentFilter>, sortedField: PaymentSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, payment: PrismaClient['payment']) => Promise<ConnectionResult<Payment>>;
//# sourceMappingURL=payment.queries.d.ts.map