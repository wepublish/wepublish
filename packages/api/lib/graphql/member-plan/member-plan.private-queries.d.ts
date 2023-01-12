import { PrismaClient } from '@prisma/client';
import { Context } from '../../context';
import { MemberPlanFilter, MemberPlanSort } from '../../db/memberPlan';
export declare const getMemberPlanByIdOrSlug: (id: string | null, slug: string | null, authenticate: Context['authenticate'], memberPlansByID: Context['loaders']['memberPlansByID'], memberPlansBySlug: Context['loaders']['memberPlansBySlug']) => Promise<import("../../db/memberPlan").MemberPlanWithPaymentMethods | null>;
export declare const getAdminMemberPlans: (filter: Partial<MemberPlanFilter>, sortedField: MemberPlanSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, authenticate: Context['authenticate'], memberPlan: PrismaClient['memberPlan']) => Promise<import("../..").ConnectionResult<import(".prisma/client").MemberPlan>>;
//# sourceMappingURL=member-plan.private-queries.d.ts.map