import { ConnectionResult, CreateSubscriptionArgs, CreateSubscriptionPeriodArgs, DBSubscriptionAdapter, DeleteSubscriptionArgs, DeleteSubscriptionPeriodArgs, GetSubscriptionArgs, OptionalSubscription, Subscription, UpdateSubscriptionArgs } from '@wepublish/api';
import { Db } from 'mongodb';
export declare class MongoDBSubscriptionAdapter implements DBSubscriptionAdapter {
    private subscriptions;
    private locale;
    constructor(db: Db, locale: string);
    createSubscription({ input }: CreateSubscriptionArgs): Promise<OptionalSubscription>;
    updateSubscription({ id, input }: UpdateSubscriptionArgs): Promise<OptionalSubscription>;
    updateUserID(subscriptionID: string, userID: string): Promise<OptionalSubscription>;
    deleteSubscription({ id }: DeleteSubscriptionArgs): Promise<string | null>;
    addSubscriptionPeriod({ subscriptionID, input }: CreateSubscriptionPeriodArgs): Promise<OptionalSubscription>;
    deleteSubscriptionPeriod({ subscriptionID, periodID }: DeleteSubscriptionPeriodArgs): Promise<OptionalSubscription>;
    getSubscriptionByID(id: string): Promise<OptionalSubscription>;
    getSubscriptionsByID(ids: readonly string[]): Promise<OptionalSubscription[]>;
    getSubscriptionsByUserID(userID: string): Promise<OptionalSubscription[]>;
    getSubscriptions({ filter, joins, sort, order, cursor, limit }: GetSubscriptionArgs): Promise<ConnectionResult<Subscription>>;
}
//# sourceMappingURL=subscription.d.ts.map