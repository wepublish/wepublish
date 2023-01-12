import { BaseMailProvider, MailLogStatus, MailProviderProps, SendMailProps, WebhookForSendMailProps } from './mailProvider';
export interface MailgunMailProviderProps extends MailProviderProps {
    apiKey: string;
    baseDomain: string;
    mailDomain: string;
    webhookEndpointSecret: string;
    fromAddress: string;
}
interface VerifyWebhookSignatureProps {
    timestamp: string;
    token: string;
    signature: string;
}
export declare class MailgunMailProvider extends BaseMailProvider {
    readonly auth: string;
    readonly baseDomain: string;
    readonly mailDomain: string;
    readonly webhookEndpointSecret: string;
    constructor(props: MailgunMailProviderProps);
    verifyWebhookSignature(props: VerifyWebhookSignatureProps): boolean;
    webhookForSendMail({ req }: WebhookForSendMailProps): Promise<MailLogStatus[]>;
    sendMail(props: SendMailProps): Promise<void>;
}
export {};
//# sourceMappingURL=MailgunMailProvider.d.ts.map