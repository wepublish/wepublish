import { Context } from '../../context';
import { PrismaClient } from '@prisma/client';
export declare const getPaymentMethodById: (id: string, authenticate: Context['authenticate'], paymentMethodsByID: Context['loaders']['paymentMethodsByID']) => Promise<import(".prisma/client").PaymentMethod | null>;
export declare const getPaymentMethods: (authenticate: Context['authenticate'], paymentMethod: PrismaClient['paymentMethod']) => import(".prisma/client").PrismaPromise<import(".prisma/client").PaymentMethod[]>;
//# sourceMappingURL=payment-method.private-queries.d.ts.map