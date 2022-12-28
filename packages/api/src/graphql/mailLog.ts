import {MailLog, MailLogState} from '@prisma/client'
import {
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
import {Context} from '../context'
import {MailLogSort} from '../db/mailLog'
import {GraphQLPageInfo} from './common'

export const GraphQLMailLogState = new GraphQLEnumType({
  name: 'MailLogState',
  values: {
    SUBMITTED: {value: MailLogState.submitted},
    ACCEPTED: {value: MailLogState.accepted},
    DELIVERED: {value: MailLogState.delivered},
    DEFERRED: {value: MailLogState.deferred},
    BOUNCED: {value: MailLogState.bounced},
    REJECTED: {value: MailLogState.rejected}
  }
})

export const GraphQLMailLog = new GraphQLObjectType<MailLog, Context>({
  name: 'MailLog',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    recipient: {type: GraphQLNonNull(GraphQLString)},
    subject: {type: GraphQLNonNull(GraphQLString)},
    state: {type: GraphQLNonNull(GraphQLMailLogState)},
    mailProviderID: {type: GraphQLNonNull(GraphQLString)},
    mailData: {type: GraphQLString}
  }
})

export const GraphQLMailLogFilter = new GraphQLInputObjectType({
  name: 'MailLogFilter',
  fields: {
    subject: {type: GraphQLString}
  }
})

export const GraphQLMailLogSort = new GraphQLEnumType({
  name: 'MailLogSort',
  values: {
    CREATED_AT: {value: MailLogSort.CreatedAt},
    MODIFIED_AT: {value: MailLogSort.ModifiedAt}
  }
})

export const GraphQLMailLogConnection = new GraphQLObjectType<any, Context>({
  name: 'MailLogConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLMailLog)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})
