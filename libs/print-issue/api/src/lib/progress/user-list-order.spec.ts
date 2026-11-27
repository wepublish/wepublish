import { Global, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FeaturesService } from '@wepublish/features/api';
import {
  USER_LIST_ORDER,
  UserSort,
  type UserListOrder,
} from '@wepublish/user/api';
import { PrismaClient } from '@prisma/client';
import { PrintIssueProgressService } from './progress.service';
import { PrintIssueUserListOrderModule } from './user-list-order';

const build = async (enabled: boolean) => {
  const usersByOwed = vi.fn(async () => ['u2', 'u1']);

  // stands in for the app's global FeaturesModule
  @Global()
  @Module({
    providers: [
      {
        provide: FeaturesService,
        useValue: { isEnabled: vi.fn(async () => enabled) },
      },
    ],
    exports: [FeaturesService],
  })
  class FeaturesStubModule {}

  const module = await Test.createTestingModule({
    imports: [FeaturesStubModule, PrintIssueUserListOrderModule],
  })
    .overrideProvider(PrismaClient)
    .useValue({})
    .overrideProvider(PrintIssueProgressService)
    .useValue({ usersByOwed })
    .compile();

  const [order] = module.get<UserListOrder[]>(USER_LIST_ORDER);

  return { order, usersByOwed };
};

describe('PrintIssueUserListOrderModule', () => {
  it('sorts users by the issues still owed them', async () => {
    const { order, usersByOwed } = await build(true);

    expect(order.sort).toBe(UserSort.PrintIssuesOwed);
    expect(await order.orderedIds({ name: 'x' }, 'desc')).toEqual(['u2', 'u1']);
    expect(usersByOwed).toHaveBeenCalledWith({ name: 'x' }, 'desc');
  });

  it('declines while print-export is off', async () => {
    const { order, usersByOwed } = await build(false);

    expect(await order.orderedIds({}, 'asc')).toBeNull();
    expect(usersByOwed).not.toHaveBeenCalled();
  });
});
