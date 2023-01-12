import { Context } from '../../context';
import { PrismaClient, Prisma } from '@prisma/client';
export declare const deleteMemberPlanById: (id: string, authenticate: Context['authenticate'], memberPlan: PrismaClient['memberPlan']) => Promise<import(".prisma/client").MemberPlan & {
    availablePaymentMethods: import(".prisma/client").AvailablePaymentMethod[];
}>;
declare type CreateMemberPlanInput = Omit<Prisma.MemberPlanUncheckedCreateInput, 'availablePaymentMethods' | 'modifiedAt'> & {
    availablePaymentMethods: Prisma.AvailablePaymentMethodUncheckedCreateWithoutMemberPlanInput[];
};
export declare const createMemberPlan: ({ availablePaymentMethods, ...input }: CreateMemberPlanInput, authenticate: Context['authenticate'], memberPlan: PrismaClient['memberPlan']) => Prisma.Prisma__MemberPlanClient<import(".prisma/client").MemberPlan & {
    availablePaymentMethods: import(".prisma/client").AvailablePaymentMethod[];
}>;
declare type UpdateMemberPlanInput = Omit<Prisma.MemberPlanUncheckedUpdateInput, 'availablePaymentMethods' | 'modifiedAt' | 'createdAt'> & {
    availablePaymentMethods: Prisma.AvailablePaymentMethodUncheckedCreateWithoutMemberPlanInput[];
};
export declare const updateMemberPlan: (id: string, { availablePaymentMethods, ...input }: UpdateMemberPlanInput, authenticate: Context['authenticate'], memberPlan: PrismaClient['memberPlan']) => Promise<import(".prisma/client").MemberPlan & {
    availablePaymentMethods: import(".prisma/client").AvailablePaymentMethod[];
}>;
export {};
//# sourceMappingURL=member-plan.private-mutation.d.ts.map