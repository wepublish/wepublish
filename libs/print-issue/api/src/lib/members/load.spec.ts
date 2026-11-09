import type { PrismaClient } from '@prisma/client';
import type { Mock } from 'vitest';
import { loadMembers, USER_BATCH } from './load';

const address = {
  company: null,
  streetAddress: 'Seestrasse',
  streetAddressNumber: '5',
  streetAddress2: null,
  streetAddress2Number: null,
  zipCode: '8002',
  city: 'Zürich',
  country: 'Schweiz',
};

const plan = (overrides: Record<string, unknown> = {}) => ({
  id: 'p1',
  slug: 'nw-jahresabo',
  name: 'Jahresabo',
  productType: 'Subscription',
  // a number for yearly periods only; monthly keeps the pro-rata rule
  periodicityPricing: [
    { periodicity: 'yearly', printIssues: 6 },
    { periodicity: 'monthly', printIssues: null },
  ],
  ...overrides,
});

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 's1',
  startsAt: new Date('2024-01-01T00:00:00.000Z'),
  paidUntil: new Date('2026-12-31T00:00:00.000Z'),
  autoRenew: true,
  deactivation: null,
  memberPlan: plan(),
  properties: [],
  userID: 'u1',
  periods: [],
  invoices: [],
  printDeliveries: [],
  ...overrides,
});

describe('loadMembers', () => {
  let prisma: {
    subscription: { findMany: Mock };
    user: { findMany: Mock };
  };

  beforeEach(() => {
    prisma = {
      subscription: {
        findMany: vi.fn().mockResolvedValue([
          row({
            deactivation: {
              date: new Date('2027-01-31T00:00:00.000Z'),
              reason: 'userSelfDeactivated',
            },
            properties: [
              { key: 'nw_adressnummer', value: '100', public: false },
            ],
            periods: [
              {
                id: 'per-2026',
                startsAt: new Date('2026-01-01T00:00:00.000Z'),
                endsAt: new Date('2026-12-31T00:00:00.000Z'),
                paymentPeriodicity: 'yearly',
                invoiceID: 'inv-2026',
                invoice: {
                  paidAt: new Date('2025-11-20T10:00:00.000Z'),
                  canceledAt: null,
                },
              },
              {
                id: 'per-2027',
                startsAt: new Date('2027-01-01T00:00:00.000Z'),
                endsAt: new Date('2027-12-31T00:00:00.000Z'),
                paymentPeriodicity: 'yearly',
                invoiceID: 'inv-2027',
                invoice: { paidAt: null, canceledAt: null },
              },
              {
                id: 'per-void',
                startsAt: new Date('2025-01-01T00:00:00.000Z'),
                endsAt: new Date('2025-12-31T00:00:00.000Z'),
                paymentPeriodicity: 'yearly',
                invoiceID: 'inv-void',
                invoice: {
                  paidAt: new Date('2025-01-05T00:00:00.000Z'),
                  canceledAt: new Date('2025-02-01T00:00:00.000Z'),
                },
              },
            ],
            invoices: [{ id: 'inv-2027' }],
            printDeliveries: [{ periodId: 'per-2026' }, { periodId: null }],
          }),
          row({
            id: 's2',
            startsAt: new Date('2025-01-01T00:00:00.000Z'),
            paidUntil: null,
            autoRenew: false,
            memberPlan: plan({
              id: 'p2',
              slug: 'nw-spende',
              name: 'Spende',
              productType: 'Donation',
            }),
            properties: null,
            userID: 'u2',
          }),
        ]),
      },
      user: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'u1',
            email: 'a@example.com',
            firstName: 'Anna',
            name: 'Alpha',
            address,
            properties: [{ key: 'nw_anrede', value: 'Frau', public: false }],
          },
        ]),
      },
    };
  });

  const load = () => loadMembers(prisma as unknown as PrismaClient);

  it('maps subscriptions to the shape the rules read, dates as ISO strings', async () => {
    const { subscriptions } = await load();

    expect(subscriptions[0]).toEqual({
      id: 's1',
      userId: 'u1',
      startsAt: '2024-01-01T00:00:00.000Z',
      paidUntil: '2026-12-31T00:00:00.000Z',
      autoRenew: true,
      deactivation: {
        date: '2027-01-31T00:00:00.000Z',
        reason: 'userSelfDeactivated',
      },
      memberPlan: {
        id: 'p1',
        slug: 'nw-jahresabo',
        name: 'Jahresabo',
        productType: 'Subscription',
        printIssues: { yearly: 6 },
      },
      properties: [{ key: 'nw_adressnummer', value: '100' }],
      periods: [
        {
          id: 'per-2026',
          startsAt: '2026-01-01T00:00:00.000Z',
          endsAt: '2026-12-31T00:00:00.000Z',
          paymentPeriodicity: 'yearly',
          paid: true,
          invoiceId: 'inv-2026',
        },
        {
          id: 'per-2027',
          startsAt: '2027-01-01T00:00:00.000Z',
          endsAt: '2027-12-31T00:00:00.000Z',
          paymentPeriodicity: 'yearly',
          paid: false,
          invoiceId: 'inv-2027',
        },
        {
          id: 'per-void',
          startsAt: '2025-01-01T00:00:00.000Z',
          endsAt: '2025-12-31T00:00:00.000Z',
          paymentPeriodicity: 'yearly',
          paid: false,
          invoiceId: 'inv-void',
        },
      ],
      openInvoiceIds: ['inv-2027'],
      deliveries: [{ periodId: 'per-2026' }, { periodId: null }],
    });
    expect(subscriptions[1]).toMatchObject({
      paidUntil: null,
      deactivation: null,
      properties: [],
      periods: [],
      openInvoiceIds: [],
      deliveries: [],
    });
  });

  it('reads private properties, the periods with their invoice state, the open invoices and the copies handed over', async () => {
    await load();

    expect(prisma.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          properties: true,
          memberPlan: {
            select: {
              id: true,
              slug: true,
              name: true,
              productType: true,
              periodicityPricing: {
                select: { periodicity: true, printIssues: true },
              },
            },
          },
          periods: {
            select: {
              id: true,
              startsAt: true,
              endsAt: true,
              paymentPeriodicity: true,
              invoiceID: true,
              invoice: { select: { paidAt: true, canceledAt: true } },
            },
          },
          invoices: {
            where: { paidAt: null, canceledAt: null },
            select: { id: true },
          },
          printDeliveries: {
            where: { delivery: { deliveredAt: { not: null } } },
            select: { periodId: true },
          },
        }),
      })
    );
  });

  it('loads exactly the users the subscriptions belong to, with address', async () => {
    const { users } = await load();

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['u1', 'u2'] } },
      select: {
        id: true,
        email: true,
        firstName: true,
        name: true,
        properties: true,
        address: {
          select: {
            company: true,
            streetAddress: true,
            streetAddressNumber: true,
            streetAddress2: true,
            streetAddress2Number: true,
            zipCode: true,
            city: true,
            country: true,
          },
        },
      },
    });
    expect(users.get('u1')).toEqual({
      id: 'u1',
      email: 'a@example.com',
      firstName: 'Anna',
      name: 'Alpha',
      address,
      properties: [{ key: 'nw_anrede', value: 'Frau' }],
    });
  });

  it('warns about subscriptions whose user is missing', async () => {
    const { warnings } = await load();

    expect(warnings).toEqual(['1 Abo(s) ohne Benutzer']);
  });

  it('reads users in batches so a large medium never builds one huge IN list', async () => {
    const many = Array.from({ length: USER_BATCH + 1 }, (_, i) =>
      row({ id: `s${i}`, userID: `u${i}` })
    );
    prisma.subscription.findMany.mockResolvedValue(many);
    prisma.user.findMany.mockResolvedValue([]);

    await load();

    expect(prisma.user.findMany).toHaveBeenCalledTimes(2);
  });
});
