import type { Mock } from 'vitest';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { SessionCacheInvalidator } from '@wepublish/authentication/api';
import { PublicContentCacheInvalidator } from '@wepublish/public-content-cache/api';
import { MailContext, MailchimpContactService } from '@wepublish/mail/api';
import { SortOrder } from '@wepublish/utils/api';
import { HibpService } from './hibp.service';
import { UserDataloaderService } from './user-dataloader.service';
import { USER_LIST_ORDER, type UserListOrder } from './user-list-order';
import { UserSort } from './user.model';
import { UserService } from './user.service';

const user = (id: string) => ({ id, name: id });

const build = async (orders?: UserListOrder[]) => {
  const prisma = {
    user: {
      count: vi.fn(async () => 99),
      findMany: vi.fn(async ({ where }: { where: { id?: { in: string[] } } }) =>
        // the database answers in its own order
        [...(where.id?.in ?? ['u9'])].reverse().map(user)
      ),
    },
  };
  const module = await Test.createTestingModule({
    providers: [
      UserService,
      { provide: PrismaClient, useValue: prisma },
      { provide: MailContext, useValue: {} },
      { provide: HibpService, useValue: {} },
      { provide: MailchimpContactService, useValue: {} },
      { provide: UserDataloaderService, useValue: { prime: vi.fn() } },
      { provide: SessionCacheInvalidator, useValue: {} },
      { provide: PublicContentCacheInvalidator, useValue: {} },
      ...(orders ? [{ provide: USER_LIST_ORDER, useValue: orders }] : []),
    ],
  }).compile();

  return { service: module.get(UserService), prisma };
};

describe('UserService.getUsers sorted by another module', () => {
  it('pages through the order the module computes, keeping it', async () => {
    const orderedIds: Mock = vi.fn(async () => ['u3', 'u1', 'u2', 'u4']);
    const { service, prisma } = await build([
      { sort: UserSort.PrintIssuesOwed, orderedIds },
    ]);

    const page = await service.getUsers({
      filter: { text: 'x' },
      sort: UserSort.PrintIssuesOwed,
      order: SortOrder.Descending,
      skip: 1,
      take: 2,
    });

    expect(orderedIds).toHaveBeenCalledWith(expect.any(Object), 'desc');
    // one more than the page, to know there is a next one
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ['u1', 'u2', 'u4'] } } })
    );
    expect(page.nodes.map(node => node.id)).toEqual(['u1', 'u2']);
    expect(page.totalCount).toBe(4);
    expect(page.pageInfo).toMatchObject({
      hasPreviousPage: true,
      hasNextPage: true,
    });
  });

  it('falls back to the newest users when the module declines', async () => {
    const orderedIds: Mock = vi.fn(async () => null);
    const { service, prisma } = await build([
      { sort: UserSort.PrintIssuesOwed, orderedIds },
    ]);

    const page = await service.getUsers({
      sort: UserSort.PrintIssuesOwed,
      order: SortOrder.Ascending,
      take: 10,
    });

    expect(orderedIds).toHaveBeenCalledWith(expect.any(Object), 'asc');
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'asc' } })
    );
    expect(page.totalCount).toBe(99);
  });

  it('falls back to the newest users while no module sorts that way', async () => {
    const { service, prisma } = await build();

    await service.getUsers({ sort: UserSort.PrintIssuesOwed, take: 10 });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } })
    );
  });
});
