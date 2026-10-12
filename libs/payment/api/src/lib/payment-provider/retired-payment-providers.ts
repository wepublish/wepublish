import { PrismaClient } from '@prisma/client';

export const retiredPaymentProviderIds = async (
  prisma: PrismaClient
): Promise<Set<string>> => {
  const retired = await prisma.settingPaymentProvider.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true },
  });

  return new Set(retired.map(({ id }) => id));
};

export const isPaymentMethodRetired = async (
  prisma: PrismaClient,
  { paymentProviderID }: { paymentProviderID: string }
): Promise<boolean> =>
  (await retiredPaymentProviderIds(prisma)).has(paymentProviderID);
