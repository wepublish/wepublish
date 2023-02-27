import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {authorise} from '../permissions'
import {CanCreateEvent, CanDeleteEvent, CanUpdateEvent} from '@wepublish/permissions/api'
import {ApolloError} from 'apollo-server-express'

export const deleteEvent = (
  eventId: string,
  authenticate: Context['authenticate'],
  event: PrismaClient['event']
) => {
  const {roles} = authenticate()
  authorise(CanDeleteEvent, roles)

  return event.delete({
    where: {id: eventId}
  })
}

export type UpdateOrCreateEventInput<
  T = Prisma.EventUncheckedCreateInput | Prisma.EventUncheckedUpdateInput
> = Omit<T, 'createdAt' | 'modifiedAt' | 'tags'>

const validateEvent = ({startsAt, endsAt}: UpdateOrCreateEventInput) => {
  if (endsAt && new Date(startsAt as string) > new Date(endsAt as string)) {
    throw new ApolloError('endsAt can not be earlier than startsAt')
  }
}

export const createEvent = (
  input: UpdateOrCreateEventInput<Prisma.EventUncheckedCreateInput>,
  tagIds: string[] | undefined,
  authenticate: Context['authenticate'],
  event: PrismaClient['event']
) => {
  const {roles} = authenticate()
  authorise(CanCreateEvent, roles)

  validateEvent(input)

  return event.create({
    data: {
      ...input,
      tags: {
        create: tagIds?.map(tagId => ({
          tagId
        }))
      }
    }
  })
}

export const updateEvent = async (
  eventId: string,
  input: UpdateOrCreateEventInput<Prisma.EventUncheckedUpdateInput>,
  tagIds: string[] | undefined,
  authenticate: Context['authenticate'],
  event: PrismaClient['event']
) => {
  const {roles} = authenticate()
  authorise(CanUpdateEvent, roles)

  const oldEvent = await event.findUnique({
    where: {
      id: eventId
    }
  })

  validateEvent({startsAt: oldEvent?.startsAt, endsAt: oldEvent?.endsAt, ...input})

  return event.update({
    where: {id: eventId},
    data: {
      ...input,
      tags: tagIds
        ? {
            connectOrCreate: tagIds.map(tagId => ({
              where: {
                eventId_tagId: {
                  eventId,
                  tagId
                }
              },
              create: {
                tagId
              }
            })),
            deleteMany: {
              eventId,
              tagId: {
                notIn: tagIds
              }
            }
          }
        : undefined
    }
  })
}
