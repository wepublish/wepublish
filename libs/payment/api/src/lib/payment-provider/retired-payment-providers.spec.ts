import {
  isPaymentMethodRetired,
  retiredPaymentProviderIds,
} from './retired-payment-providers';

const providers = [
  { id: 'stripe', deletedAt: null },
  { id: 'mollie', deletedAt: new Date('2026-09-28') },
];

const createPrisma = () => ({
  settingPaymentProvider: {
    findMany: jest.fn(
      async ({ where }: { where: { deletedAt: { not: null } } }) =>
        providers
          .filter(provider =>
            where.deletedAt?.not === null ? provider.deletedAt !== null : true
          )
          .map(({ id }) => ({ id }))
    ),
  },
});

describe('retiredPaymentProviderIds', () => {
  it('names the providers that were deleted', async () => {
    const prisma = createPrisma();

    const retired = await retiredPaymentProviderIds(prisma as never);

    expect([...retired]).toEqual(['mollie']);
    expect(prisma.settingPaymentProvider.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: { not: null } } })
    );
  });
});

describe('isPaymentMethodRetired', () => {
  it('is true for a payment method of a deleted provider', async () => {
    await expect(
      isPaymentMethodRetired(createPrisma() as never, {
        paymentProviderID: 'mollie',
      })
    ).resolves.toBe(true);
  });

  it('is false for a payment method of an active provider', async () => {
    await expect(
      isPaymentMethodRetired(createPrisma() as never, {
        paymentProviderID: 'stripe',
      })
    ).resolves.toBe(false);
  });
});
