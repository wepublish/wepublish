import { Mandrill } from 'mandrill-api';
import { BaseMailProvider, MailLogStatus, MailProviderProps, SendMailProps, WebhookForSendMailProps } from './mailProvider';
export interface MailchimpMailProviderProps extends MailProviderProps {
    readonly apiKey: string;
    readonly baseURL: string;
    readonly webhookEndpointSecret: string;
    readonly fromAddress: string;
}
interface VerifyWebhookSignatureProps {
    signature: string;
    url: string;
    params: Record<string, any>;
}
export declare class MailchimpMailProvider extends BaseMailProvider {
    readonly mandrill: Mandrill;
    readonly webhookEndpointSecret: string;
    constructor(props: MailchimpMailProviderProps);
    verifyWebhookSignature({ signature, url, params }: VerifyWebhookSignatureProps): boolean;
    webhookForSendMail({ req }: WebhookForSendMailProps): Promise<MailLogStatus[]>;
    sendMail(props: SendMailProps): Promise<void>;
}
export {};
//# sourceMappingURL=MailchimpMailProvider.d.ts.map