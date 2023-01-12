import { PrismaClient } from '@prisma/client';
import { EventType } from '../../db/activityEvent';
import { Context } from '../../context';
export declare const getActivities: (authenticate: Context['authenticate'], article: PrismaClient['article'], page: PrismaClient['page'], comment: PrismaClient['comment'], subscription: PrismaClient['subscription'], author: PrismaClient['author'], poll: PrismaClient['poll'], user: PrismaClient['user']) => Promise<({
    date: any;
    eventType: EventType;
    id: any;
    summary: any;
} | {
    date: any;
    eventType: EventType;
    id: any;
    creator: any;
})[]>;
//# sourceMappingURL=activityEvent.private-queries.d.ts.map