import { Payment, PaymentState, PrismaClient } from '@prisma/client';
import { NextHandleFunction } from 'connect';
import express, { Router } from 'express';
import { Context } from '../context';
import { InvoiceWithItems } from '../db/invoice';
import { WepublishServerOpts } from '../server';
export declare const PAYMENT_WEBHOOK_PATH_PREFIX = "payment-webhooks";
export interface WebhookForPaymentIntentProps {
    req: express.Request;
}
export interface IntentState {
    paymentID: string;
    state: PaymentState;
    paidAt?: Date;
    paymentData?: string;
    customerID?: string;
}
export interface CreatePaymentIntentProps {
    paymentID: string;
    invoice: InvoiceWithItems;
    saveCustomer: boolean;
    customerID?: string;
    successURL?: string;
    failureURL?: string;
}
export interface CheckIntentProps {
    intentID: string;
}
export interface UpdatePaymentWithIntentStateProps {
    intentState: IntentState;
    paymentClient: PrismaClient['payment'];
    paymentsByID: Context['loaders']['paymentsByID'];
    invoicesByID: Context['loaders']['invoicesByID'];
    subscriptionClient: PrismaClient['subscription'];
    userClient: PrismaClient['user'];
    invoiceClient: PrismaClient['invoice'];
    subscriptionPeriodClient: PrismaClient['subscriptionPeriod'];
    invoiceItemClient: PrismaClient['invoiceItem'];
}
export interface WebhookUpdatesProps {
    payment: Payment;
    body: any;
    headers: any;
}
export interface GetInvoiceIDFromWebhookProps {
    body: any;
    headers: any;
}
export interface Intent {
    intentID: string;
    intentSecret: string;
    state: PaymentState;
    paidAt?: Date;
    intentData?: string;
    paymentData?: string;
    errorCode?: string;
}
export interface PaymentProvider {
    id: string;
    name: string;
    offSessionPayments: boolean;
    incomingRequestHandler: NextHandleFunction;
    webhookForPaymentIntent(props: WebhookForPaymentIntentProps): Promise<IntentState[]>;
    createIntent(props: CreatePaymentIntentProps): Promise<Intent>;
    checkIntentStatus(props: CheckIntentProps): Promise<IntentState>;
    updatePaymentWithIntentState(props: UpdatePaymentWithIntentStateProps): Promise<Payment>;
}
export interface PaymentProviderProps {
    id: string;
    name: string;
    offSessionPayments: boolean;
    incomingRequestHandler?: NextHandleFunction;
}
export declare abstract class BasePaymentProvider implements PaymentProvider {
    readonly id: string;
    readonly name: string;
    readonly offSessionPayments: boolean;
    readonly incomingRequestHandler: NextHandleFunction;
    protected constructor(props: PaymentProviderProps);
    abstract webhookForPaymentIntent(props: WebhookForPaymentIntentProps): Promise<IntentState[]>;
    abstract createIntent(props: CreatePaymentIntentProps): Promise<Intent>;
    abstract checkIntentStatus(props: CheckIntentProps): Promise<IntentState>;
    updatePaymentWithIntentState({ intentState, paymentClient, paymentsByID, invoicesByID, subscriptionClient, userClient }: UpdatePaymentWithIntentStateProps): Promise<Payment>;
    /**
     * adding or updating paymentProvider customer ID for user
     *
     * @param userClient
     * @param subscription
     * @param customerID
     * @private
     */
    private updatePaymentProvider;
}
export declare function setupPaymentProvider(opts: WepublishServerOpts): Router;
//# sourceMappingURL=paymentProvider.d.ts.map