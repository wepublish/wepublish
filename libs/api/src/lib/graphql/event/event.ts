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
import {Context} from '../../context'
import {ConnectionResult} from '../../db/common'
import {createProxyingResolver} from '../../utility'
import {GraphQLPageInfo} from '../common'
import {GraphQLImage} from '../image'
import {GraphQLTag} from '../tag/tag'
import {EventSort} from './event.queries'
import {GraphQLRichText} from '../richText'
import {GraphQLDateTime} from 'graphql-scalars'

export const GraphQLEventStatus = new GraphQLEnumType({
  name: 'EventStatus',
  values: {
    CANCELLED: {value: EventStatus.Cancelled},
    RESCHEDULED: {value: EventStatus.Rescheduled},
    POSTPONED: {value: EventStatus.Postponed},
    SCHEDULED: {value: EventStatus.Scheduled}
  }
})

export const GraphQLEvent = new GraphQLObjectType<Event, Context>({
  name: 'Event',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    name: {type: GraphQLNonNull(GraphQLString)},
    status: {type: GraphQLNonNull(GraphQLEventStatus)},
    description: {type: GraphQLRichText},

    location: {type: GraphQLString},
    startsAt: {type: GraphQLNonNull(GraphQLDateTime)},
    endsAt: {type: GraphQLDateTime},

    tags: {
      type: GraphQLList(GraphQLNonNull(GraphQLTag)),
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
      resolve: createProxyingResolver(({imageId}, args, {loaders}, info) => {
        return imageId ? loaders.images.load(imageId) : null
      })
    }
  }
})

export const GraphQLEventConnection = new GraphQLObjectType<ConnectionResult<Event>, Context>({
  name: 'EventConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLEvent)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLEventFilter = new GraphQLInputObjectType({
  name: 'EventFilter',
  fields: {
    upcomingOnly: {type: GraphQLBoolean},
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLID))}
  }
})

export const GraphQLEventSort = new GraphQLEnumType({
  name: 'EventSort',
  values: {
    STARTS_AT: {value: EventSort.StartsAt},
    ENDS_AT: {value: EventSort.EndsAt},
    CREATED_AT: {value: EventSort.CreatedAt},
    MODIFIED_AT: {value: EventSort.ModifiedAt}
  }
})
