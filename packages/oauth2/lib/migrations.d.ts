import { Db } from 'mongodb';
export interface Migration {
    readonly version: number;
    migrate(adapter: Db, locale: string): Promise<void>;
}
export declare const Migrations: Migration[];
export declare const LatestMigration: Migration;
//# sourceMappingURL=migrations.d.ts.map