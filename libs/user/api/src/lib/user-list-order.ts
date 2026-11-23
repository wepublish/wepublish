import { Prisma } from '@prisma/client';
import { UserSort } from './user.model';

/**
 * Lets another module sort the user list by something the user library can't
 * express in Prisma (e.g. print issues still owed). The module computes the
 * full ordered id list for the filter; `getUsers` pages through it in memory.
 * Returning `null` declines (e.g. its feature is off): the list then falls
 * back to the creation date.
 */
export const USER_LIST_ORDER = Symbol('USER_LIST_ORDER');

export type UserListOrder = {
  sort: UserSort;
  orderedIds(
    where: Prisma.UserWhereInput,
    order: 'asc' | 'desc'
  ): Promise<string[] | null>;
};
