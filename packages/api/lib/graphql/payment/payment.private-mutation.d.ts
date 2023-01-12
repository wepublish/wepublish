import { Context } from '../../context';
import { Payment, PrismaClient } from '@prisma/client';
export declare const createPaymentFromInvoice: (input: {
    invoiceID: string;
    paymentMethodID: string;
    successURL: string;
    failureURL: string;
}, authenticate: Context['authenticate'], paymentProviders: Context['paymentProviders'], invoicesByID: Context['loaders']['invoicesByID'], paymentMethodsByID: Context['loaders']['paymentMethodsByID'], paymentClient: PrismaClient['payment']) => Promise<Payment>;
//# sourceMappingURL=payment.private-mutation.d.ts.map