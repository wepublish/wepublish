import { ConnectionResult, CreatePaymentArgs, DBPaymentAdapter, DeletePaymentArgs, GetPaymentsArgs, OptionalPayment, Payment, UpdatePaymentArgs } from '@wepublish/api';
import { Db } from 'mongodb';
export declare class MongoDBPaymentAdapter implements DBPaymentAdapter {
    private payment;
    private locale;
    constructor(db: Db, locale: string);
    createPayment({ input }: CreatePaymentArgs): Promise<Payment>;
    updatePayment({ id, input }: UpdatePaymentArgs): Promise<OptionalPayment>;
    deletePayment({ id }: DeletePaymentArgs): Promise<string | null>;
    getPaymentsByID(ids: readonly string[]): Promise<OptionalPayment[]>;
    getPaymentsByInvoiceID(invoiceID: string): Promise<OptionalPayment[]>;
    getPayments({ filter, sort, order, cursor, limit }: GetPaymentsArgs): Promise<ConnectionResult<Payment>>;
}
//# sourceMappingURL=payment.d.ts.map