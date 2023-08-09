import {Prisma} from '@prisma/client'
import {DateFilterComparison} from '../db/common'
import {AuthSession, AuthSessionType} from '@wepublish/authentication/api'

export const mapDateFilterToPrisma = (
  comparison: DateFilterComparison
): keyof Prisma.DateTimeFilter => {
  return comparison === DateFilterComparison.Equal ? 'equals' : comparison
}

export const isMeBySession = (id: string, session: AuthSession | null | undefined) =>
  session?.type === AuthSessionType.User && session.user.id === id
