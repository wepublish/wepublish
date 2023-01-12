import { Db } from 'mongodb';
import { DBMigration } from './schema';
export interface MongoDBAdapterInitializeArgs {
    readonly url: string;
    readonly database: string;
    readonly locale: string;
    readonly seed?: (adapter: MongoDBAdapter) => Promise<void>;
}
export interface InitializationResult {
    readonly migrated?: {
        readonly from?: number;
        readonly to: number;
    };
}
export declare class MongoDBAdapter {
    static DefaultSessionTTL: number;
    static DefaultBcryptHashCostFactor: number;
    static MaxResultsPerPage: number;
    static DatabaseName: string;
    private readonly name;
    private static client;
    constructor(name: string);
    upsert(_id: string, payload: any, expiresIn: number): Promise<void>;
    find(_id: string): Promise<any>;
    findByUserCode(userCode: string): Promise<any>;
    findByUid(uid: string): Promise<any>;
    destroy(_id: string): Promise<void>;
    revokeByGrantId(grantId: string): Promise<void>;
    consume(_id: string): Promise<void>;
    coll(name: string): import("mongodb").Collection<any>;
    static connect(url: string): Promise<void>;
    static getDBMigrationState(db: Db): Promise<DBMigration | null>;
    static initialize(url: string, locale: string): Promise<InitializationResult>;
}
//# sourceMappingURL=adapter.d.ts.map