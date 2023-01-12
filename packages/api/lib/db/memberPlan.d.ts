import { MemberPlan as PrismaMemberPlan, PaymentPeriodicity, AvailablePaymentMethod } from '@prisma/client';
import { RichTextNode } from '../graphql/richText';
export declare const AllPaymentPeriodicity: PaymentPeriodicity[];
export interface MemberPlan extends Omit<PrismaMemberPlan, 'description'> {
    readonly description: RichTextNode[];
}
export declare enum MemberPlanSort {
    CreatedAt = "modifiedAt",
    ModifiedAt = "modifiedAt"
}
export interface MemberPlanFilter {
    name?: string;
    active?: boolean;
    tags?: string[];
}
export declare type MemberPlanWithPaymentMethods = PrismaMemberPlan & {
    availablePaymentMethods: AvailablePaymentMethod[];
};
//# sourceMappingURL=memberPlan.d.ts.map