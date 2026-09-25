import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { PaywallMemberPlansDataloader } from './paywall-member-plans.dataloader';

describe('PaywallMemberPlansDataloader', () => {
  let dataloader: PaywallMemberPlansDataloader;
  let prismaMock: {
    paywallMemberplan: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      paywallMemberplan: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaywallMemberPlansDataloader,
        {
          provide: PrismaClient,
          useValue: prismaMock,
        },
      ],
    }).compile();

    dataloader = await module.resolve(PaywallMemberPlansDataloader);
  });

  it('should batch loads into a single query', async () => {
    prismaMock.paywallMemberplan.findMany.mockResolvedValue([]);

    await Promise.all([
      dataloader.load('paywall-1'),
      dataloader.load('paywall-2'),
      dataloader.load('paywall-1'),
    ]);

    expect(prismaMock.paywallMemberplan.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.paywallMemberplan.findMany).toHaveBeenCalledWith({
      where: {
        paywallId: {
          in: ['paywall-1', 'paywall-2'],
        },
      },
      include: {
        memberPlan: {
          include: {
            availablePaymentMethods: true,
          },
        },
      },
    });
  });

  it('should group member plans by paywall', async () => {
    const memberPlan1 = { id: 'plan-1', availablePaymentMethods: [] };
    const memberPlan2 = { id: 'plan-2', availablePaymentMethods: [] };

    prismaMock.paywallMemberplan.findMany.mockResolvedValue([
      { paywallId: 'paywall-1', memberPlan: memberPlan1 },
      { paywallId: 'paywall-1', memberPlan: memberPlan2 },
      { paywallId: 'paywall-2', memberPlan: memberPlan2 },
    ]);

    const result = await dataloader.loadMany([
      'paywall-1',
      'paywall-2',
      'paywall-3',
    ]);

    expect(result).toEqual([[memberPlan1, memberPlan2], [memberPlan2], []]);
  });
});
