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
    id: {type: new GraphQLNonNull(GraphQLID)},

    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: new GraphQLNonNull(GraphQLDateTime)},

    recipient: {type: new GraphQLNonNull(GraphQLString)},
    subject: {type: new GraphQLNonNull(GraphQLString)},
    state: {type: new GraphQLNonNull(GraphQLMailLogState)},
    mailProviderID: {type: new GraphQLNonNull(GraphQLString)},
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
    nodes: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLMailLog)))},
    pageInfo: {type: new GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: new GraphQLNonNull(GraphQLInt)}
  }
})
