import { MemberPlan, Prisma, PrismaClient } from '@prisma/client';
import { ConnectionResult } from '../../db/common';
import { MemberPlanFilter, MemberPlanSort } from '../../db/memberPlan';
import { SortOrder } from '../queries/sort';
export declare const createMemberPlanOrder: (field: MemberPlanSort, sortOrder: SortOrder) => Prisma.MemberPlanFindManyArgs['orderBy'];
export declare const createMemberPlanFilter: (filter: Partial<MemberPlanFilter>) => Prisma.MemberPlanWhereInput;
export declare const getMemberPlans: (filter: Partial<MemberPlanFilter>, sortedField: MemberPlanSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, memberPlan: PrismaClient['memberPlan']) => Promise<ConnectionResult<MemberPlan>>;
//# sourceMappingURL=member-plan.queries.d.ts.map