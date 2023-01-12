import { Author, Image, MailLog, Payment, PaymentMethod, Peer, PrismaClient, UserRole } from '@prisma/client';
import DataLoader from 'dataloader';
import { GraphQLSchema } from 'graphql';
import { Fetcher } from 'graphql-tools';
import { IncomingMessage } from 'http';
import { Client } from 'openid-client';
import { ChallengeProvider } from './challenges/challengeProvider';
import { ArticleWithRevisions, PublicArticle } from './db/article';
import { InvoiceWithItems } from './db/invoice';
import { MemberPlanWithPaymentMethods } from './db/memberPlan';
import { NavigationWithLinks } from './db/navigation';
import { PageWithRevisions, PublicPage } from './db/page';
import { Session, TokenSession, UserSession } from './db/session';
import { FullPoll } from './graphql/poll/poll.public-queries';
import { Hooks } from './hooks';
import { MailContext, MailContextOptions } from './mails/mailContext';
import { BaseMailProvider } from './mails/mailProvider';
import { MediaAdapter } from './media/mediaAdapter';
import { MemberContext } from './memberContext';
import { PaymentProvider } from './payments/paymentProvider';
import { URLAdapter } from './urlAdapter';
export interface DataLoaderContext {
    readonly navigationByID: DataLoader<string, NavigationWithLinks | null>;
    readonly navigationByKey: DataLoader<string, NavigationWithLinks | null>;
    readonly authorsByID: DataLoader<string, Author | null>;
    readonly authorsBySlug: DataLoader<string, Author | null>;
    readonly images: DataLoader<string, Image | null>;
    readonly articles: DataLoader<string, ArticleWithRevisions | null>;
    readonly publicArticles: DataLoader<string, PublicArticle | null>;
    readonly pages: DataLoader<string, PageWithRevisions | null>;
    readonly publicPagesByID: DataLoader<string, PublicPage | null>;
    readonly publicPagesBySlug: DataLoader<string, PublicPage | null>;
    readonly userRolesByID: DataLoader<string, UserRole | null>;
    readonly mailLogsByID: DataLoader<string, MailLog | null>;
    readonly peer: DataLoader<string, Peer | null>;
    readonly peerBySlug: DataLoader<string, Peer | null>;
    readonly peerSchema: DataLoader<string, GraphQLSchema | null>;
    readonly peerAdminSchema: DataLoader<string, GraphQLSchema | null>;
    readonly memberPlansByID: DataLoader<string, MemberPlanWithPaymentMethods | null>;
    readonly memberPlansBySlug: DataLoader<string, MemberPlanWithPaymentMethods | null>;
    readonly activeMemberPlansByID: DataLoader<string, MemberPlanWithPaymentMethods | null>;
    readonly activeMemberPlansBySlug: DataLoader<string, MemberPlanWithPaymentMethods | null>;
    readonly paymentMethodsByID: DataLoader<string, PaymentMethod | null>;
    readonly activePaymentMethodsByID: DataLoader<string, PaymentMethod | null>;
    readonly activePaymentMethodsBySlug: DataLoader<string, PaymentMethod | null>;
    readonly invoicesByID: DataLoader<string, InvoiceWithItems | null>;
    readonly paymentsByID: DataLoader<string, Payment | null>;
    readonly pollById: DataLoader<string, FullPoll | null>;
}
export interface OAuth2Clients {
    name: string;
    provider: Oauth2Provider;
    client: Client;
}
export interface Context {
    readonly hostURL: string;
    readonly websiteURL: string;
    readonly sessionTTL: number;
    readonly hashCostFactor: number;
    readonly session: Session | null;
    readonly loaders: DataLoaderContext;
    readonly mailContext: MailContext;
    readonly memberContext: MemberContext;
    readonly prisma: PrismaClient;
    readonly mediaAdapter: MediaAdapter;
    readonly urlAdapter: URLAdapter;
    readonly oauth2Providers: Oauth2Provider[];
    readonly paymentProviders: PaymentProvider[];
    readonly hooks?: Hooks;
    readonly challenge: ChallengeProvider;
    getOauth2Clients(): Promise<OAuth2Clients[]>;
    authenticate(): Session;
    authenticateToken(): TokenSession;
    authenticateUser(): UserSession;
    optionalAuthenticateUser(): UserSession | null;
    generateJWT(props: GenerateJWTProps): string;
    verifyJWT(token: string): string;
    createPaymentWithProvider(props: CreatePaymentWithProvider): Promise<Payment>;
}
export interface Oauth2Provider {
    readonly name: string;
    readonly discoverUrl: string;
    readonly clientId: string;
    readonly clientKey: string;
    readonly scopes: string[];
    readonly redirectUri: string[];
}
export interface ContextOptions {
    readonly hostURL: string;
    readonly websiteURL: string;
    readonly sessionTTL?: number;
    readonly hashCostFactor?: number;
    readonly prisma: PrismaClient;
    readonly mediaAdapter: MediaAdapter;
    readonly urlAdapter: URLAdapter;
    readonly mailProvider?: BaseMailProvider;
    readonly mailContextOptions: MailContextOptions;
    readonly oauth2Providers: Oauth2Provider[];
    readonly paymentProviders: PaymentProvider[];
    readonly hooks?: Hooks;
    readonly challenge: ChallengeProvider;
}
export interface SendMailFromProviderProps {
    recipient: string;
    replyToAddress: string;
    subject: string;
    message?: string;
    template?: string;
    templateData?: Record<string, any>;
}
export interface CreatePaymentWithProvider {
    paymentMethodID: string;
    invoice: InvoiceWithItems;
    saveCustomer: boolean;
    successURL?: string;
    failureURL?: string;
}
export interface GenerateJWTProps {
    id: string;
    audience?: string;
    expiresInMinutes?: number;
}
export declare function contextFromRequest(req: IncomingMessage | null, { hostURL, websiteURL, prisma, mediaAdapter, urlAdapter, oauth2Providers, hooks, mailProvider, mailContextOptions, paymentProviders, challenge, sessionTTL, hashCostFactor }: ContextOptions): Promise<Context>;
export declare function tokenFromRequest(req: IncomingMessage | null): string | null;
export declare function createFetcher(hostURL: string, token: string, peerTimeOut: number): Fetcher;
//# sourceMappingURL=context.d.ts.map