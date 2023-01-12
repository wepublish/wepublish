import { PrismaClient } from '@prisma/client';
import Email from 'email-templates';
import { BaseMailProvider } from './mailProvider';
export declare enum SendMailType {
    LoginLink = 0,
    TestMail = 1,
    PasswordReset = 2,
    NewMemberSubscription = 3,
    RenewedMemberSubscription = 4,
    MemberSubscriptionOffSessionBefore = 5,
    MemberSubscriptionOnSessionBefore = 6,
    MemberSubscriptionOnSessionAfter = 7,
    MemberSubscriptionOffSessionFailed = 8
}
export interface SendEMailProps {
    readonly type: SendMailType;
    readonly recipient: string;
    readonly data: Record<string, any>;
}
export interface MailTemplateMap {
    type: SendMailType;
    subject?: string;
    fromAddress?: string;
    replyToAddress?: string;
    local: boolean;
    localTemplate?: string;
    remoteTemplate?: string;
}
export interface MailContextOptions {
    readonly defaultFromAddress: string;
    readonly defaultReplyToAddress?: string;
    readonly mailTemplateMaps: MailTemplateMap[];
    readonly mailTemplatesPath?: string;
}
export interface MailContext {
    mailProvider: BaseMailProvider | null;
    prisma: PrismaClient;
    email: Email;
    mailTemplateMaps: MailTemplateMap[];
    defaultFromAddress: string;
    defaultReplyToAddress?: string;
    sendMail(props: SendEMailProps): Promise<void>;
}
export interface MailContextProps extends MailContextOptions {
    readonly mailProvider?: BaseMailProvider;
    readonly prisma: PrismaClient;
}
export declare class MailContext implements MailContext {
    mailProvider: BaseMailProvider | null;
    email: Email;
    mailTemplateMaps: MailTemplateMap[];
    defaultFromAddress: string;
    defaultReplyToAddress?: string;
    constructor(props: MailContextProps);
}
//# sourceMappingURL=mailContext.d.ts.map