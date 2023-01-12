import { CreatePaymentMethodArgs, DBPaymentMethodAdapter, OptionalPaymentMethod, PaymentMethod, UpdatePaymentMethodArgs } from '@wepublish/api/lib/db/paymentMethod';
import { Db } from 'mongodb';
export declare class MongoDBPaymentMethodAdapter implements DBPaymentMethodAdapter {
    private paymentMethods;
    constructor(db: Db);
    createPaymentMethod({ input }: CreatePaymentMethodArgs): Promise<PaymentMethod>;
    updatePaymentMethod({ id, input }: UpdatePaymentMethodArgs): Promise<OptionalPaymentMethod>;
    getPaymentMethodsByID(ids: readonly string[]): Promise<OptionalPaymentMethod[]>;
    getPaymentMethodsBySlug(slugs: string[]): Promise<OptionalPaymentMethod[]>;
    getPaymentMethods(): Promise<PaymentMethod[]>;
    getActivePaymentMethods(): Promise<PaymentMethod[]>;
    getActivePaymentMethodsByID(ids: readonly string[]): Promise<OptionalPaymentMethod[]>;
    getActivePaymentMethodsBySlug(slugs: string[]): Promise<OptionalPaymentMethod[]>;
    deletePaymentMethod(id: string): Promise<string | null>;
}
//# sourceMappingURL=paymentMethod.d.ts.map