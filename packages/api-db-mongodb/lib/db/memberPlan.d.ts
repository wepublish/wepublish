import { ConnectionResult, GetMemberPlansArgs, CreateMemberPlanArgs, DBMemberPlanAdapter, DeleteMemberPlanArgs, MemberPlan, OptionalMemberPlan, UpdateMemberPlanArgs } from '@wepublish/api';
import { Db } from 'mongodb';
export declare class MongoDBMemberPlanAdapter implements DBMemberPlanAdapter {
    private memberPlans;
    private locale;
    constructor(db: Db, locale: string);
    createMemberPlan({ input }: CreateMemberPlanArgs): Promise<MemberPlan>;
    updateMemberPlan({ id, input }: UpdateMemberPlanArgs): Promise<OptionalMemberPlan>;
    deleteMemberPlan({ id }: DeleteMemberPlanArgs): Promise<string | null>;
    getMemberPlanById(id: string): Promise<OptionalMemberPlan>;
    getMemberPlansByID(ids: readonly string[]): Promise<OptionalMemberPlan[]>;
    getMemberPlansBySlug(slugs: string[]): Promise<OptionalMemberPlan[]>;
    getMemberPlans({ filter, sort, order, cursor, limit }: GetMemberPlansArgs): Promise<ConnectionResult<MemberPlan>>;
    getActiveMemberPlansByID(ids: readonly string[]): Promise<OptionalMemberPlan[]>;
    getActiveMemberPlansBySlug(slugs: string[]): Promise<OptionalMemberPlan[]>;
    getActiveMemberPlans({ filter, sort, order, cursor, limit }: GetMemberPlansArgs): Promise<ConnectionResult<MemberPlan>>;
}
//# sourceMappingURL=memberPlan.d.ts.map