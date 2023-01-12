import { ConnectionResult, CreateInvoiceArgs, DBInvoiceAdapter, DeleteInvoiceArgs, GetInvoicesArgs, Invoice, OptionalInvoice, UpdateInvoiceArgs } from '@wepublish/api';
import { Db } from 'mongodb';
export declare class MongoDBInvoiceAdapter implements DBInvoiceAdapter {
    private invoices;
    private locale;
    constructor(db: Db, locale: string);
    createInvoice({ input }: CreateInvoiceArgs): Promise<Invoice>;
    updateInvoice({ id, input }: UpdateInvoiceArgs): Promise<OptionalInvoice>;
    deleteInvoice({ id }: DeleteInvoiceArgs): Promise<string | null>;
    getInvoiceByID(id: string): Promise<OptionalInvoice>;
    getInvoicesByID(ids: readonly string[]): Promise<OptionalInvoice[]>;
    getInvoicesBySubscriptionID(subscriptionID: string): Promise<OptionalInvoice[]>;
    getInvoices({ filter, sort, order, cursor, limit }: GetInvoicesArgs): Promise<ConnectionResult<Invoice>>;
}
//# sourceMappingURL=invoice.d.ts.map