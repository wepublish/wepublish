import { MemberPlan, PaymentMethod } from '@prisma/client';
import { GraphQLFieldResolver, GraphQLIsTypeOfFn } from 'graphql';
import { IDelegateToSchemaOptions } from 'graphql-tools';
import { Context } from './context';
import { SettingRestriction } from './db/setting';
import { SubscriptionWithRelations } from './db/subscription';
import { UserWithRelations } from './db/user';
export declare const MAX_COMMENT_LENGTH = 1000;
export declare const MAX_PAYLOAD_SIZE = "1MB";
export declare const ONE_HOUR_IN_MILLISECONDS: number;
export declare const ONE_DAY_IN_MILLISECONDS: number;
export declare const FIFTEEN_MINUTES_IN_MILLISECONDS = 900000;
export declare const ONE_MONTH_IN_MILLISECONDS: number;
export declare const USER_PROPERTY_LAST_LOGIN_LINK_SEND = "_wepLastLoginLinkSentTimestamp";
export declare function mapSubscriptionsAsCsv(subscriptions: (SubscriptionWithRelations & {
    user: UserWithRelations;
    paymentMethod: PaymentMethod;
    memberPlan: MemberPlan;
})[]): string;
export declare function slugify(str: string): string;
export declare function base64Encode(str: string): string;
export declare function base64Decode(str: string): string;
export declare const IsProxiedSymbol: unique symbol;
export declare function markResultAsProxied(result: any): any;
export declare function isSourceProxied<T>(source: T): source is T & {
    __typename?: string;
};
export declare function createProxyingResolver<TSource, TContext, TArgs = {
    [argName: string]: any;
}>(resolver: GraphQLFieldResolver<TSource, TContext, TArgs>): GraphQLFieldResolver<TSource, TContext, TArgs>;
export declare function createProxyingIsTypeOf<TSource, TContext>(isTypeOf: GraphQLIsTypeOfFn<TSource, TContext>): GraphQLIsTypeOfFn<TSource, TContext>;
export declare function mapEnumsBack(result: any): any;
export declare function delegateToPeerSchema(peerID: string, fetchAdminEndpoint: boolean, context: Context, opts: Omit<IDelegateToSchemaOptions, 'schema'>): Promise<any>;
export declare function capitalizeFirstLetter(str: string): string;
export declare function countRichtextChars(blocksCharLength: number, nodes: any): any;
export declare type DiscriminateUnion<T, K extends keyof T, V extends T[K]> = T extends Record<K, V> ? T : never;
export declare type MapDiscriminatedUnion<T extends Record<K, string>, K extends keyof T> = {
    [V in T[K]]: DiscriminateUnion<T, K, V>;
};
export declare function isObject<T>(unknown: unknown): unknown is Record<any, T>;
export declare function isArray<T>(unknown: unknown): unknown is T[];
export declare function isString(unknown: unknown): unknown is string;
export declare function isBoolean(unknown: unknown): unknown is boolean;
export declare function checkSettingRestrictions(val: unknown, currentVal: unknown, restriction: SettingRestriction | undefined): void;
//# sourceMappingURL=utility.d.ts.map