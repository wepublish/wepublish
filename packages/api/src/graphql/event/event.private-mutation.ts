import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {authorise, CanCreateEvent, CanDeleteEvent, CanUpdateEvent} from '../permissions'

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

export type UpdateOrCreateEventInput = Omit<
  Prisma.EventUncheckedCreateInput,
  'createdAt' | 'modifiedAt' | 'tags'
>

export const createEvent = (
  input: UpdateOrCreateEventInput,
  tagIds: string[] | undefined,
  authenticate: Context['authenticate'],
  event: PrismaClient['event']
) => {
  const {roles} = authenticate()
  authorise(CanCreateEvent, roles)

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

export const updateEvent = (
  eventId: string,
  input: UpdateOrCreateEventInput,
  tagIds: string[] | undefined,
  authenticate: Context['authenticate'],
  event: PrismaClient['event']
) => {
  const {roles} = authenticate()
  authorise(CanUpdateEvent, roles)

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
