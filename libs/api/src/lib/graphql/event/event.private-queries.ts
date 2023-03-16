import {PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {authorise} from '../permissions'
import {CanGetEvent} from '@wepublish/permissions/api'
import {EventFilter, EventSort, getEvents} from './event.query'

export const getAdminEvents = async (
  filter: Partial<EventFilter>,
  sortedField: EventSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  authenticate: Context['authenticate'],
  event: PrismaClient['event']
) => {
  const {roles} = authenticate()
  authorise(CanGetEvent, roles)

  return getEvents(filter, sortedField, order, cursorId, skip, take, event)
}
