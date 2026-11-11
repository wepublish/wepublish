import { Test, TestingModule } from '@nestjs/testing';
import { DashboardSubscriptionService } from './dashboard-subscription.service';
import { PrismaModule } from '@wepublish/nest-modules';
import { PrismaClient } from '@prisma/client';

describe('DashboardSubscriptionService', () => {
  let service: DashboardSubscriptionService;
  let prisma: PrismaClient;

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01'));
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [DashboardSubscriptionService],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    service = module.get<DashboardSubscriptionService>(
      DashboardSubscriptionService
    );
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('should get the new subscribers', async () => {
    const mockValue = Promise.resolve([
      {
        id: 'cld4loaff0008sepx1x3ebj3w',
        createdAt: '2023-01-20T14:11:26.283Z',
        modifiedAt: '2023-01-20T14:11:26.284Z',
        paymentPeriodicity: 'monthly',
        monthlyAmount: 50,
        autoRenew: false,
        startsAt: '2023-01-02T00:00:00.000Z',
        paidUntil: '2023-02-01T00:00:00.000Z',
        paymentMethodID: 'cld4loaff0015sepxhvpl4rco',
        memberPlanID: 'cld4k0qaa0017depxbiveealk',
        userID: 'cld4ign5c00104hpx1gkx0n2q',
        deactivation: {
          id: 'cld4loaff0010sepxnup35t78',
          createdAt: '2023-01-20T14:11:26.283Z',
          modifiedAt: '2023-01-20T14:11:26.284Z',
          date: '2023-02-02T00:00:00.000Z',
          reason: 'invoiceNotPaid',
          subscriptionID: 'cld4loaff0008sepx1x3ebj3w',
        },
        memberPlan: { name: 'Bar' },
      },
      {
        id: 'cld4loaff0007sepxszmvhvca',
        createdAt: '2023-01-20T14:11:26.283Z',
        modifiedAt: '2023-01-20T14:11:26.284Z',
        paymentPeriodicity: 'monthly',
        monthlyAmount: 50,
        autoRenew: true,
        startsAt: '2023-01-01T00:00:00.000Z',
        paidUntil: '2023-02-01T00:00:00.000Z',
        paymentMethodID: 'cld4loaff0009sepx0iu4n8n5',
        memberPlanID: 'cld4ign5c00084hpxwqncmpjk',
        userID: 'cld4ign5c00104hpx1gkx0n2q',
        deactivation: null,
        memberPlan: { name: 'foo' },
      },
    ]);
    const start = new Date('2023-01-01');
    const end = new Date('2023-02-01');
    const mockFunction = vi
      .spyOn(prisma.subscription, 'findMany')
      .mockReturnValue(mockValue as any);

    const result = await service.newSubscribers(start, end);
    expect(result).toMatchSnapshot();
    expect(mockFunction.mock.calls[0][0]).toMatchSnapshot();
  });

  test('should get all active subscribers', async () => {
    const mockValue = Promise.resolve([
      {
        id: 'cld4lprbk0073vjpx0kk8f8hu',
        createdAt: '2023-01-20T14:12:34.832Z',
        modifiedAt: '2023-01-20T14:12:34.832Z',
        paymentPeriodicity: 'monthly',
        monthlyAmount: 500,
        autoRenew: false,
        startsAt: '2023-02-03T00:00:00.000Z',
        paidUntil: null,
        paymentMethodID: 'cld4lprbk0075vjpxarv1c5r9',
        memberPlanID: 'cld4ign5c00084hpxwqncmpjk',
        userID: 'cld4ign5c00104hpx1gkx0n2q',
        deactivation: null,
        memberPlan: { name: 'foo' },
      },
      {
        id: 'cld4lprbk0071vjpxf33kh4ax',
        createdAt: '2023-01-20T14:12:34.832Z',
        modifiedAt: '2023-01-20T14:12:34.832Z',
        paymentPeriodicity: 'monthly',
        monthlyAmount: 50,
        autoRenew: false,
        startsAt: '2023-02-02T00:00:00.000Z',
        paidUntil: '2023-02-02T00:00:00.000Z',
        paymentMethodID: 'cld4lprbk0080vjpxvabbr8gz',
        memberPlanID: 'cld4k0qaa0017depxbiveealk',
        userID: 'cld4ign5c00104hpx1gkx0n2q',
        deactivation: {
          id: 'cld4lprbk0074vjpxniv9piwb',
          createdAt: '2023-01-20T14:12:34.832Z',
          modifiedAt: '2023-01-20T14:12:34.832Z',
          date: '2023-02-03T00:00:00.000Z',
          reason: 'invoiceNotPaid',
          subscriptionID: 'cld4lprbk0071vjpxf33kh4ax',
        },
        memberPlan: { name: 'Bar' },
      },
      {
        id: 'cld4lprbk0072vjpxohwln37y',
        createdAt: '2023-01-20T14:12:34.832Z',
        modifiedAt: '2023-01-20T14:12:34.832Z',
        paymentPeriodicity: 'monthly',
        monthlyAmount: 50,
        autoRenew: true,
        startsAt: '2023-01-01T00:00:00.000Z',
        paidUntil: '2023-02-01T00:00:00.000Z',
        paymentMethodID: 'cld4lprbk0076vjpxvdfs0vmv',
        memberPlanID: 'cld4ign5c00084hpxwqncmpjk',
        userID: 'cld4ign5c00104hpx1gkx0n2q',
        deactivation: null,
        memberPlan: { name: 'foo' },
      },
    ]);
    const mockFunction = vi
      .spyOn(prisma.subscription, 'findMany')
      .mockReturnValue(mockValue as any);

    const result = await service.activeSubscribers();
    expect(result).toMatchSnapshot();
    expect(mockFunction.mock.calls[0][0]).toMatchSnapshot();
  });

  test('should get the renewing subscribers', async () => {
    const mockValue = Promise.resolve([
      {
        id: 'cld4lqqyd0144yopxgx80v9pk',
        createdAt: '2023-01-20T14:13:21.013Z',
        modifiedAt: '2023-01-20T14:13:21.014Z',
        paymentPeriodicity: 'monthly',
        monthlyAmount: 50,
        autoRenew: true,
        startsAt: '2023-01-01T00:00:00.000Z',
        paidUntil: '2023-01-29T00:00:00.000Z',
        paymentMethodID: 'cld4lqqyd0151yopxt3wk1l3d',
        memberPlanID: 'cld4ign5c00084hpxwqncmpjk',
        userID: 'cld4ign5c00104hpx1gkx0n2q',
        memberPlan: { name: 'foo' },
      },
    ]);
    const start = new Date('2023-01-01');
    const end = new Date('2023-02-01');
    const mockFunction = vi
      .spyOn(prisma.subscription, 'findMany')
      .mockReturnValue(mockValue as any);

    const result = await service.renewingSubscribers(start, end);
    expect(result).toMatchSnapshot();
    expect(mockFunction.mock.calls[0][0]).toMatchSnapshot();
  });

  test('should get the new deactivations', async () => {
    const mockValue = Promise.resolve([
      {
        id: 'cld4lrmbf02270gpx8ktw6mz1',
        createdAt: '2023-01-20T14:14:01.659Z',
        modifiedAt: '2023-01-20T14:14:01.660Z',
        paymentPeriodicity: 'monthly',
        monthlyAmount: 50,
        autoRenew: true,
        startsAt: '2023-01-01T00:00:00.000Z',
        paidUntil: '2023-02-01T00:00:00.000Z',
        paymentMethodID: 'cld4lrmbf02340gpxs45cwwjn',
        memberPlanID: 'cld4ign5c00084hpxwqncmpjk',
        userID: 'cld4ign5c00104hpx1gkx0n2q',
        deactivation: {
          id: 'cld4lrmbf02300gpxz8rf1o5u',
          createdAt: '2023-01-01T00:00:00.000Z',
          modifiedAt: '2023-01-20T14:14:01.660Z',
          date: '2023-02-03T00:00:00.000Z',
          reason: 'invoiceNotPaid',
          subscriptionID: 'cld4lrmbf02270gpx8ktw6mz1',
        },
        memberPlan: { name: 'foo' },
      },
    ]);
    const start = new Date('2023-01-01');
    const end = new Date('2023-02-01');
    const mockFunction = vi
      .spyOn(prisma.subscription, 'findMany')
      .mockReturnValue(mockValue as any);

    const result = await service.newDeactivations(start, end);
    expect(result).toMatchSnapshot();
    expect(mockFunction.mock.calls[0][0]).toMatchSnapshot();
  });

  describe('daily stats and upgrades', () => {
    const day = new Date('2023-01-01');

    // An upgrade creates a replacement subscription and deactivates the old
    // one with reason userReplacedSubscription. Neither side is a new
    // subscription or a cancellation; the upgrade only shows as "replaced".
    const subscriptions = [
      {
        id: 'sub-new',
        createdAt: new Date('2023-01-01T10:00:00.000Z'),
        paidUntil: new Date('2024-01-01T00:00:00.000Z'),
        replacesSubscriptionID: null,
        deactivation: null,
        user: {
          id: 'user-new',
          firstName: 'Nora',
          name: 'Neu',
          email: 'nora@example.com',
        },
      },
      {
        id: 'sub-upgrade',
        createdAt: new Date('2023-01-01T11:00:00.000Z'),
        paidUntil: new Date('2024-01-01T00:00:00.000Z'),
        replacesSubscriptionID: 'sub-old',
        deactivation: null,
        user: {
          id: 'user-up',
          firstName: 'Ueli',
          name: 'Upgrade',
          email: 'ueli@example.com',
        },
      },
      {
        id: 'sub-old',
        createdAt: new Date('2022-01-01T10:00:00.000Z'),
        paidUntil: new Date('2023-01-01T11:00:00.000Z'),
        replacesSubscriptionID: null,
        deactivation: {
          date: new Date('2023-01-01T11:00:00.000Z'),
          reason: 'userReplacedSubscription',
        },
        user: {
          id: 'user-up',
          firstName: 'Ueli',
          name: 'Upgrade',
          email: 'ueli@example.com',
        },
      },
      {
        id: 'sub-cancelled',
        createdAt: new Date('2022-01-01T10:00:00.000Z'),
        paidUntil: new Date('2023-01-01T00:00:00.000Z'),
        replacesSubscriptionID: null,
        deactivation: {
          date: new Date('2023-01-01T09:00:00.000Z'),
          reason: 'userSelfDeactivated',
        },
        user: {
          id: 'user-gone',
          firstName: 'Gabi',
          name: 'Gone',
          email: 'gabi@example.com',
        },
      },
    ];

    // Answers the service's queries the way the database would, so the
    // filters decide what comes back.
    const findManyLikeTheDatabase = async (args: any) => {
      const where = args?.where ?? {};
      const rows = subscriptions.map(subscription => ({
        ...subscription,
        user: { ...subscription.user },
      }));

      if (where.periods) {
        return [];
      }

      if (where.deactivation?.date) {
        return rows.filter(
          row =>
            row.deactivation &&
            row.deactivation.date >= where.deactivation.date.gte &&
            row.deactivation.date <= where.deactivation.date.lte &&
            (where.deactivation.reason?.not === undefined ||
              row.deactivation.reason !== where.deactivation.reason.not)
        );
      }

      if (where.createdAt?.gte) {
        return rows.filter(row => {
          if (
            row.createdAt < where.createdAt.gte ||
            row.createdAt > where.createdAt.lte
          ) {
            return false;
          }
          if (where.replacesSubscriptionID === null) {
            return row.replacesSubscriptionID === null;
          }
          if (where.replacesSubscriptionID?.not === null) {
            return row.replacesSubscriptionID !== null;
          }
          return true;
        });
      }

      return [];
    };

    beforeEach(() => {
      vi.spyOn(prisma.subscription, 'findMany').mockImplementation(
        findManyLikeTheDatabase as any
      );
      vi.spyOn(prisma.subscription, 'count').mockResolvedValue(0);
    });

    test('counts an upgrade only as a replaced subscription', async () => {
      const stats = await service.generateDailyData(day, [], day);

      expect(stats.createdSubscriptionCount).toBe(1);
      expect(
        stats.createdSubscriptionUsers.map(user => user.subscriptionID)
      ).toEqual(['sub-new']);

      expect(stats.replacedSubscriptionCount).toBe(1);
      expect(
        stats.replacedSubscriptionUsers.map(user => user.subscriptionID)
      ).toEqual(['sub-upgrade']);

      expect(stats.deactivatedSubscriptionCount).toBe(1);
      expect(
        stats.deactivatedSubscriptionUsers.map(user => user.subscriptionID)
      ).toEqual(['sub-cancelled']);
    });

    test('queries new, replaced and deactivated subscriptions with the upgrade filters', async () => {
      const findMany = vi.spyOn(prisma.subscription, 'findMany');

      await service['getDailyCreatedSubscriptions'](day);
      expect(findMany.mock.lastCall?.[0]?.where).toMatchObject({
        paidUntil: { not: null },
        replacesSubscriptionID: null,
      });

      await service['getDailyReplacedSubscriptions'](day);
      expect(findMany.mock.lastCall?.[0]?.where).toMatchObject({
        paidUntil: { not: null },
        replacesSubscriptionID: { not: null },
      });

      await service['getDailyDeactivatedSubscriptions'](day);
      expect(findMany.mock.lastCall?.[0]?.where).toMatchObject({
        paidUntil: { not: null },
        deactivation: { reason: { not: 'userReplacedSubscription' } },
      });
    });
  });
});
