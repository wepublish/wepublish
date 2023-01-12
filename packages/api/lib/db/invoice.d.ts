import { Invoice, InvoiceItem } from '@prisma/client';
import { DateFilter } from './common';
export declare enum InvoiceSort {
    CreatedAt = "modifiedAt",
    ModifiedAt = "modifiedAt",
    PaidAt = "paidAt"
}
export interface InvoiceFilter {
    mail?: string;
    paidAt?: DateFilter;
    canceledAt?: DateFilter;
    userID?: string;
    subscriptionID?: string;
}
export declare type InvoiceWithItems = Invoice & {
    items: InvoiceItem[];
};
//# sourceMappingURL=invoice.d.ts.map