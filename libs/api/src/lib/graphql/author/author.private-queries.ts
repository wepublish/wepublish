import { Context } from '../../context';
import { UserInputError } from '../../error';
import { authorise } from '../permissions';
import { CanGetAuthor, CanGetAuthors } from '@wepublish/permissions';
import { PrismaClient } from '@prisma/client';
import { AuthorFilter, AuthorSort } from '../../db/author';
import { getAuthors } from './author.queries';
import { SortOrder } from '@wepublish/utils/api';

export const getAuthorByIdOrSlug = (
  id: string | null,
  slug: string | null,
  authenticate: Context['authenticate'],
  authorsByID: Context['loaders']['authorsByID'],
  authorsBySlug: Context['loaders']['authorsBySlug']
) => {
  const { roles } = authenticate();
  authorise(CanGetAuthor, roles);

  if ((!id && !slug) || (id && slug)) {
    throw new UserInputError('You must provide either `id` or `slug`.');
  }

  return id ? authorsByID.load(id) : authorsBySlug.load(slug!);
};

export const getAdminAuthors = async (
  filter: Partial<AuthorFilter>,
  sortedField: AuthorSort,
  order: SortOrder,
  cursorId: string | null,
  skip: number,
  take: number,
  authenticate: Context['authenticate'],
  author: PrismaClient['author']
) => {
  const { roles } = authenticate();
  authorise(CanGetAuthors, roles);

  return getAuthors(filter, sortedField, order, cursorId, skip, take, author);
};
