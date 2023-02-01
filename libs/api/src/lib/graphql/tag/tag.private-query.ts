import {PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {authorise, CanGetTags} from '../permissions'
import {getTags, TagFilter, TagSort} from './tag.query'

export const getAdminTags = async (
  filter: Partial<TagFilter>,
  sortedField: TagSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  authenticate: Context['authenticate'],
  tag: PrismaClient['tag']
) => {
  const {roles} = authenticate()
  authorise(CanGetTags, roles)

  return getTags(filter, sortedField, order, cursorId, skip, take, tag)
}
