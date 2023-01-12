import { MongoClient, Db } from 'mongodb';
import { DBAdapter } from '@wepublish/api';
import { MongoDBUserAdapter } from './db/user';
import { MongoDBPeerAdapter } from './db/peer';
import { MongoDBSessionAdapter } from './db/session';
import { MongoDBAuthorAdapter } from './db/author';
import { MongoDBNavigationAdapter } from './db/navigation';
import { MongoDBImageAdapter } from './db/image';
import { MongoDBTokenAdapter } from './db/token';
import { MongoDBCommentAdapter } from './db/comment';
import { MongoDBArticleAdapter } from './db/article';
import { MongoDBPageAdapter } from './db/page';
import { DBMigration } from './db/schema';
import { MongoDBUserRoleAdapter } from './db/userRole';
import { MongoDBMemberPlanAdapter } from './db/memberPlan';
import { MongoDBPaymentMethodAdapter } from './db/paymentMethod';
import { MongoDBInvoiceAdapter } from './db/invoice';
import { MongoDBPaymentAdapter } from './db/payment';
import { MongoDBMailLogAdapter } from './db/mailLog';
import { MongoDBSubscriptionAdapter } from './db/subscription';
import { MongoDBSettingAdapter } from './db/setting';
export interface MongoDBAdabterCommonArgs {
    readonly sessionTTL?: number;
    readonly bcryptHashCostFactor?: number;
}
export interface MongoDBAdapterConnectArgs extends MongoDBAdabterCommonArgs {
    readonly url: string;
    readonly locale: string;
}
export interface MongoDBAdapterInitializeArgs extends MongoDBAdabterCommonArgs {
    readonly url: string;
    readonly locale: string;
    readonly seed?: (adapter: MongoDBAdapter) => Promise<void>;
}
export interface InitializationResult {
    readonly migrated?: {
        readonly from?: number;
        readonly to: number;
    };
}
export declare class MongoDBAdapter implements DBAdapter {
    readonly sessionTTL: number;
    readonly bcryptHashCostFactor: number;
    readonly locale: string;
    readonly client: MongoClient;
    readonly db: Db;
    readonly peer: MongoDBPeerAdapter;
    readonly user: MongoDBUserAdapter;
    readonly userRole: MongoDBUserRoleAdapter;
    readonly subscription: MongoDBSubscriptionAdapter;
    readonly session: MongoDBSessionAdapter;
    readonly token: MongoDBTokenAdapter;
    readonly navigation: MongoDBNavigationAdapter;
    readonly author: MongoDBAuthorAdapter;
    readonly image: MongoDBImageAdapter;
    readonly comment: MongoDBCommentAdapter;
    readonly article: MongoDBArticleAdapter;
    readonly page: MongoDBPageAdapter;
    readonly memberPlan: MongoDBMemberPlanAdapter;
    readonly paymentMethod: MongoDBPaymentMethodAdapter;
    readonly invoice: MongoDBInvoiceAdapter;
    readonly payment: MongoDBPaymentAdapter;
    readonly mailLog: MongoDBMailLogAdapter;
    readonly setting: MongoDBSettingAdapter;
    private constructor();
    static createMongoClient(url: string): Promise<MongoClient>;
    static connect({ sessionTTL, bcryptHashCostFactor, url, locale }: MongoDBAdapterConnectArgs): Promise<MongoDBAdapter>;
    static getDBMigrationState(db: Db): Promise<DBMigration | null>;
    static initialize({ sessionTTL, bcryptHashCostFactor, url, locale, seed }: MongoDBAdapterInitializeArgs): Promise<InitializationResult>;
}
//# sourceMappingURL=adapter.d.ts.map