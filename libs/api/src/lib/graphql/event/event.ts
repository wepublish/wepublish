import {Event, EventStatus} from '@prisma/client'
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import {GraphQLDateTime} from 'graphql-scalars'
import {Context} from '../../context'
import {ConnectionResult} from '../../db/common'
import {createProxyingResolver} from '../../utility'
import {GraphQLPageInfo} from '../common'
import {GraphQLImage} from '../image'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {GraphQLTag} from '../tag/tag'
import {EventSort} from './event.query'

export const GraphQLEventStatus = new GraphQLEnumType({
  name: 'EventStatus',
  values: {
    Cancelled: {value: EventStatus.Cancelled},
    Rescheduled: {value: EventStatus.Rescheduled},
    Postponed: {value: EventStatus.Postponed},
    Scheduled: {value: EventStatus.Scheduled}
  }
})

export const GraphQLEvent = new GraphQLObjectType<Event, Context>({
  name: 'Event',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},

    name: {type: new GraphQLNonNull(GraphQLString)},
    lead: {type: GraphQLString},
    status: {type: new GraphQLNonNull(GraphQLEventStatus)},
    description: {type: GraphQLRichText},

    location: {type: GraphQLString},
    startsAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    endsAt: {type: GraphQLDateTime},

    externalSourceId: {type: GraphQLString},
    externalSourceName: {type: GraphQLString},

    tags: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLTag))),
      resolve: createProxyingResolver(async ({id}, _, {prisma: {tag}}) => {
        const tags = await tag.findMany({
          where: {
            events: {
              some: {
                eventId: id
              }
            }
          }
        })

        return tags
      })
    },
    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageId}, args, {loaders}) => {
        return imageId ? loaders.images.load(imageId) : null
      })
    },
    url: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: createProxyingResolver(async (event, args, {urlAdapter}) => {
        return await urlAdapter.getEventURL(event)
      })
    }
  }
})

export const GraphQLEventConnection = new GraphQLObjectType<ConnectionResult<Event>, Context>({
  name: 'EventConnection',
  fields: {
    nodes: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLEvent)))},
    pageInfo: {type: new GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: new GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLEventFilter = new GraphQLInputObjectType({
  name: 'EventFilter',
  fields: {
    upcomingOnly: {type: GraphQLBoolean},
    from: {type: GraphQLDateTime},
    to: {type: GraphQLDateTime},
    tags: {type: new GraphQLList(new GraphQLNonNull(GraphQLID))},
    name: {type: GraphQLString},
    location: {type: GraphQLString}
  }
})

export const GraphQLEventSort = new GraphQLEnumType({
  name: 'EventSort',
  values: {
    StartsAt: {value: EventSort.StartsAt},
    EndsAt: {value: EventSort.EndsAt},
    CreatedAt: {value: EventSort.CreatedAt},
    ModifiedAt: {value: EventSort.ModifiedAt}
  }
})

export const GraphQLEventResolver = {
  __resolveReference: async (reference, {loaders}) => {
    const {id} = reference
    const event = await loaders.eventById.load(id)
    if (!event) throw new Error('Event not found')
    return event
  }
}
