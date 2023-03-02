import {Prisma} from '@prisma/client'
import {DateFilterComparison} from '../db/common'

export const mapDateFilterToPrisma = (
  comparison: DateFilterComparison
): keyof Prisma.DateTimeFilter => {
  return comparison === DateFilterComparison.Equal ? 'equals' : comparison
}
