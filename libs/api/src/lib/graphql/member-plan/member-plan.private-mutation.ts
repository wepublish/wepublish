import { Context } from '../../context';
import { authorise } from '../permissions';
import {
  CanCreateMemberPlan,
  CanDeleteMemberPlan,
} from '@wepublish/permissions';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  InvalidMemberPlanSettings,
  MonthlyTargetAmountNotEnough,
} from '../../error';

export const deleteMemberPlanById = async (
  id: string,
  authenticate: Context['authenticate'],
  memberPlan: PrismaClient['memberPlan']
) => {
  const { roles } = authenticate();
  authorise(CanDeleteMemberPlan, roles);

  return memberPlan.delete({
    where: {
      id,
    },
    include: {
      availablePaymentMethods: true,
    },
  });
};

type CreateMemberPlanInput = Omit<
  Prisma.MemberPlanUncheckedCreateInput,
  'availablePaymentMethods' | 'modifiedAt'
> & {
  availablePaymentMethods: Prisma.AvailablePaymentMethodUncheckedCreateWithoutMemberPlanInput[];
};

type MemberPlanIntegrityInput = {
  extendable: boolean;
  amountPerMonthMin: number;
  amountPerMonthMax: number | null;
  amountPerMonthTarget: number | null;
  availablePaymentMethods: Prisma.AvailablePaymentMethodUncheckedCreateWithoutMemberPlanInput[];
};

export const createMemberPlan = (
  { availablePaymentMethods, ...input }: CreateMemberPlanInput,
  authenticate: Context['authenticate'],
  memberPlan: PrismaClient['memberPlan']
) => {
  const { roles } = authenticate();
  authorise(CanCreateMemberPlan, roles);

  checkMemberPlanIntegrity({
    extendable: input.extendable ?? true,
    amountPerMonthMin: input.amountPerMonthMin,
    amountPerMonthMax: input.amountPerMonthMax ?? null,
    amountPerMonthTarget: input.amountPerMonthTarget ?? null,
    availablePaymentMethods,
  });

  return memberPlan.create({
    data: {
      ...input,
      availablePaymentMethods: {
        createMany: {
          data: availablePaymentMethods,
        },
      },
    },
    include: {
      availablePaymentMethods: true,
    },
  });
};

type UpdateMemberPlanInput = Omit<
  Prisma.MemberPlanUncheckedUpdateInput,
  'availablePaymentMethods' | 'modifiedAt' | 'createdAt'
> & {
  availablePaymentMethods: Prisma.AvailablePaymentMethodUncheckedCreateWithoutMemberPlanInput[];
};

export const updateMemberPlan = async (
  id: string,
  { availablePaymentMethods, ...input }: UpdateMemberPlanInput,
  authenticate: Context['authenticate'],
  memberPlan: PrismaClient['memberPlan']
) => {
  const { roles } = authenticate();
  authorise(CanCreateMemberPlan, roles);

  const existingMemberPlan = await memberPlan.findUniqueOrThrow({
    where: { id },
    select: {
      extendable: true,
      amountPerMonthMin: true,
      amountPerMonthMax: true,
      amountPerMonthTarget: true,
    },
  });

  checkMemberPlanIntegrity({
    extendable: resolveBooleanUpdate(
      input.extendable,
      existingMemberPlan.extendable
    ),
    amountPerMonthMin: resolveNumberUpdate(
      input.amountPerMonthMin,
      existingMemberPlan.amountPerMonthMin
    ),
    amountPerMonthMax: resolveNullableNumberUpdate(
      input.amountPerMonthMax,
      existingMemberPlan.amountPerMonthMax
    ),
    amountPerMonthTarget: resolveNullableNumberUpdate(
      input.amountPerMonthTarget,
      existingMemberPlan.amountPerMonthTarget
    ),
    availablePaymentMethods,
  });

  return memberPlan.update({
    where: { id },
    data: {
      ...input,
      availablePaymentMethods: {
        deleteMany: {
          memberPlanId: {
            equals: id,
          },
        },
        createMany: {
          data: availablePaymentMethods,
        },
      },
    },
    include: {
      availablePaymentMethods: true,
    },
  });
};

function checkMemberPlanIntegrity(input: MemberPlanIntegrityInput): void {
  const {
    extendable,
    amountPerMonthMin,
    amountPerMonthMax,
    amountPerMonthTarget,
    availablePaymentMethods,
  } = input;
  const hasForceAutoRenew = !!availablePaymentMethods.find(
    apm => apm.forceAutoRenewal
  );

  if (!extendable && hasForceAutoRenew) {
    throw new InvalidMemberPlanSettings();
  }

  if (amountPerMonthMax != null && amountPerMonthMax < amountPerMonthMin) {
    throw new InvalidMemberPlanSettings();
  }

  if (
    amountPerMonthTarget != null &&
    amountPerMonthTarget <= (amountPerMonthMin ?? 0)
  ) {
    throw new MonthlyTargetAmountNotEnough();
  }
}

function resolveBooleanUpdate(
  value: Prisma.BoolFieldUpdateOperationsInput | boolean | undefined,
  fallback: boolean
): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value && typeof value === 'object' && 'set' in value) {
    const nextValue = value.set;

    if (typeof nextValue === 'boolean') {
      return nextValue;
    }
  }

  return fallback;
}

function resolveNumberUpdate(
  value: Prisma.FloatFieldUpdateOperationsInput | number | undefined,
  fallback: number
): number {
  if (typeof value === 'number') {
    return value;
  }

  if (value && typeof value === 'object' && 'set' in value) {
    const nextValue = value.set;

    if (typeof nextValue === 'number') {
      return nextValue;
    }
  }

  return fallback;
}

function resolveNullableNumberUpdate(
  value:
    | Prisma.NullableFloatFieldUpdateOperationsInput
    | number
    | null
    | undefined,
  fallback: number | null
): number | null {
  if (typeof value === 'number') {
    return value;
  }

  if (value === null) {
    return null;
  }

  if (value && typeof value === 'object' && 'set' in value) {
    const nextValue = value.set;

    if (typeof nextValue === 'number' || nextValue === null) {
      return nextValue ?? null;
    }
  }

  return fallback;
}
