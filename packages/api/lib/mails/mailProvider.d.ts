import { WepublishServerOpts } from '../server';
import express, { Router } from 'express';
import { NextHandleFunction } from 'connect';
import { MailLogState } from '@prisma/client';
export declare const MAIL_WEBHOOK_PATH_PREFIX = "mail-webhooks";
export interface WebhookForSendMailProps {
    req: express.Request;
}
export interface SendMailProps {
    mailLogID: string;
    recipient: string;
    replyToAddress: string;
    subject: string;
    message?: string;
    messageHtml?: string;
    template?: string;
    templateData?: Record<string, any>;
}
export interface MailLogStatus {
    mailLogID: string;
    state: MailLogState;
    mailData?: string;
}
export interface MailProvider {
    id: string;
    name: string;
    incomingRequestHandler: NextHandleFunction;
    webhookForSendMail(props: WebhookForSendMailProps): Promise<MailLogStatus[]>;
    sendMail(props: SendMailProps): Promise<void>;
}
export interface MailProviderProps {
    id: string;
    name: string;
    fromAddress: string;
    incomingRequestHandler?: NextHandleFunction;
}
export declare abstract class BaseMailProvider implements MailProvider {
    readonly id: string;
    readonly name: string;
    readonly fromAddress: string;
    readonly incomingRequestHandler: NextHandleFunction;
    protected constructor(props: MailProviderProps);
    abstract webhookForSendMail(props: WebhookForSendMailProps): Promise<MailLogStatus[]>;
    abstract sendMail(props: SendMailProps): Promise<void>;
}
export declare function setupMailProvider(opts: WepublishServerOpts): Router;
//# sourceMappingURL=mailProvider.d.ts.map