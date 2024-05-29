import {AuthorFilter, AuthorSort} from '../../db/author'
import {PrismaClient} from '@prisma/client'
import {getAuthors} from './author.queries'
import {SortOrder} from '@wepublish/utils/api'

export const getPublicAuthors = async (
  filter: Partial<AuthorFilter>,
  sortedField: AuthorSort,
  order: SortOrder,
  cursorId: string | null,
  skip: number,
  take: number,
  author: PrismaClient['author']
) => getAuthors(filter, sortedField, order, cursorId, skip, take, author)
