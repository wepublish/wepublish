import { ConnectionResult, CreateMailLogArgs, DBMailLogAdapter, MailLog, OptionalMailLog, UpdateMailLogArgs, DeleteMailLogArgs, GetMailLogsArgs } from '@wepublish/api';
import { Db } from 'mongodb';
export declare class MongoDBMailLogAdapter implements DBMailLogAdapter {
    private mailLog;
    private locale;
    constructor(db: Db, locale: string);
    createMailLog({ input }: CreateMailLogArgs): Promise<MailLog>;
    updateMailLog({ id, input }: UpdateMailLogArgs): Promise<OptionalMailLog>;
    deleteMailLog({ id }: DeleteMailLogArgs): Promise<string | null>;
    getMailLogsByID(ids: readonly string[]): Promise<OptionalMailLog[]>;
    getMailLogs({ filter, sort, order, cursor, limit }: GetMailLogsArgs): Promise<ConnectionResult<MailLog>>;
}
//# sourceMappingURL=mailLog.d.ts.map