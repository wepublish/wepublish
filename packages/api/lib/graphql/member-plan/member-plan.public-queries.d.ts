import { MemberPlanFilter, MemberPlanSort } from '../../db/memberPlan';
import { PrismaClient } from '@prisma/client';
export declare const getActiveMemberPlans: (filter: Partial<MemberPlanFilter>, sortedField: MemberPlanSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, memberPlan: PrismaClient['memberPlan']) => Promise<import("../..").ConnectionResult<import(".prisma/client").MemberPlan>>;
//# sourceMappingURL=member-plan.public-queries.d.ts.map