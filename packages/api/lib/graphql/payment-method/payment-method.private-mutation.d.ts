import { Prisma, PrismaClient } from '@prisma/client';
import { Context } from '../../context';
export declare const deletePaymentMethodById: (id: string, authenticate: Context['authenticate'], paymentMethod: PrismaClient['paymentMethod']) => Prisma.Prisma__PaymentMethodClient<import(".prisma/client").PaymentMethod>;
export declare const createPaymentMethod: (input: Omit<Prisma.PaymentMethodUncheckedCreateInput, 'modifiedAt'>, authenticate: Context['authenticate'], paymentMethod: PrismaClient['paymentMethod']) => Prisma.Prisma__PaymentMethodClient<import(".prisma/client").PaymentMethod>;
export declare const updatePaymentMethod: (id: string, input: Omit<Prisma.PaymentMethodUncheckedUpdateInput, 'modifiedAt' | 'createdAt'>, authenticate: Context['authenticate'], paymentMethod: PrismaClient['paymentMethod']) => Prisma.Prisma__PaymentMethodClient<import(".prisma/client").PaymentMethod>;
//# sourceMappingURL=payment-method.private-mutation.d.ts.map