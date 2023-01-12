import { Invoice, MemberPlan, MetadataProperty, Payment, PaymentMethod, PaymentPeriodicity, PaymentProviderCustomer, PrismaClient, Subscription, SubscriptionDeactivationReason, User } from '@prisma/client';
import { DataLoaderContext } from './context';
import { InvoiceWithItems } from './db/invoice';
import { MemberPlanWithPaymentMethods } from './db/memberPlan';
import { SubscriptionWithRelations } from './db/subscription';
import { MailContext } from './mails/mailContext';
import { PaymentProvider } from './payments/paymentProvider';
export interface HandleSubscriptionChangeProps {
    subscription: SubscriptionWithRelations;
}
export interface RenewSubscriptionForUserProps {
    subscription: SubscriptionWithRelations;
}
export interface RenewSubscriptionForUsersProps {
    startDate?: Date;
    daysToLookAhead: number;
}
export interface ChargeInvoiceProps {
    user: User;
    invoice: InvoiceWithItems;
    paymentMethodID: string;
    customer: PaymentProviderCustomer;
}
export interface SendReminderForInvoiceProps {
    invoice: InvoiceWithItems;
    replyToAddress: string;
}
export interface SendReminderForInvoicesProps {
    replyToAddress: string;
}
export interface CheckOpenInvoiceProps {
    invoice: Invoice;
}
export interface DeactivateSubscriptionForUserProps {
    subscriptionID: string;
    deactivationDate?: Date;
    deactivationReason?: SubscriptionDeactivationReason;
}
export interface MemberContext {
    prisma: PrismaClient;
    loaders: DataLoaderContext;
    paymentProviders: PaymentProvider[];
    mailContext: MailContext;
    getLoginUrlForUser(user: User): string;
    handleSubscriptionChange(props: HandleSubscriptionChangeProps): Promise<Subscription>;
    renewSubscriptionForUser(props: RenewSubscriptionForUserProps): Promise<Invoice | null>;
    renewSubscriptionForUsers(props: RenewSubscriptionForUsersProps): Promise<void>;
    checkOpenInvoices(): Promise<void>;
    checkOpenInvoice(props: CheckOpenInvoiceProps): Promise<void>;
    chargeInvoice(props: ChargeInvoiceProps): Promise<boolean | Payment>;
    chargeOpenInvoices(): Promise<void>;
    sendReminderForInvoice(props: SendReminderForInvoiceProps): Promise<void>;
    sendReminderForInvoices(props: SendReminderForInvoicesProps): Promise<void>;
    deactivateSubscriptionForUser(props: DeactivateSubscriptionForUserProps): Promise<void>;
}
export interface MemberContextProps {
    readonly prisma: PrismaClient;
    readonly loaders: DataLoaderContext;
    readonly paymentProviders: PaymentProvider[];
    readonly mailContext: MailContext;
    getLoginUrlForUser(user: User): string;
}
export declare function getNextDateForPeriodicity(start: Date, periodicity: PaymentPeriodicity): Date;
export declare function calculateAmountForPeriodicity(monthlyAmount: number, periodicity: PaymentPeriodicity): number;
export declare class MemberContext implements MemberContext {
    loaders: DataLoaderContext;
    paymentProviders: PaymentProvider[];
    mailContext: MailContext;
    getLoginUrlForUser: (user: User) => string;
    constructor(props: MemberContextProps);
    private getOffSessionPaymentProviderIDs;
    private getAllOpenInvoices;
    cancelInvoicesForSubscription(subscriptionID: string): Promise<void>;
    /**
     * Function used to
     * @param memberPlanID
     * @param memberPlanSlug
     * @param paymentMethodID
     * @param paymentMethodSlug
     */
    validateInputParamsCreateSubscription(memberPlanID: string | null, memberPlanSlug: string | null, paymentMethodID: string | null, paymentMethodSlug: string | null): Promise<void>;
    getMemberPlanByIDOrSlug(loaders: DataLoaderContext, memberPlanSlug: string, memberPlanID: string): Promise<MemberPlanWithPaymentMethods>;
    getPaymentMethodByIDOrSlug(loaders: DataLoaderContext, paymentMethodSlug: string, paymentMethodID: string): Promise<PaymentMethod>;
    validateSubscriptionPaymentConfiguration(memberPlan: MemberPlanWithPaymentMethods, autoRenew: boolean, paymentPeriodicity: PaymentPeriodicity, paymentMethod: PaymentMethod): Promise<void>;
    processSubscriptionProperties(subscriptionProperties: Omit<MetadataProperty, 'public'>[]): Promise<Pick<MetadataProperty, 'public' | 'key' | 'value'>[]>;
    createSubscription(subscriptionClient: PrismaClient['subscription'], userID: string, paymentMethod: PaymentMethod, paymentPeriodicity: PaymentPeriodicity, monthlyAmount: number, memberPlan: MemberPlan, properties: Pick<MetadataProperty, 'key' | 'value' | 'public'>[], autoRenew: boolean): Promise<SubscriptionWithRelations>;
}
//# sourceMappingURL=memberContext.d.ts.map