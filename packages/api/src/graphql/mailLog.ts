import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLInt,
  GraphQLInputObjectType,
  GraphQLEnumType
} from 'graphql'

import {Context} from '../context'

import {GraphQLPageInfo} from './common'
import {GraphQLDateTime} from 'graphql-iso-date'
import {MailLog, MailLogSort, MailLogState} from '../db/mailLog'

export const GraphQLMailLogState = new GraphQLEnumType({
  name: 'MailLogState',
  values: {
    SUBMITTED: {value: MailLogState.Submitted},
    ACCEPTED: {value: MailLogState.Accepted},
    DELIVERED: {value: MailLogState.Delivered},
    DEFERRED: {value: MailLogState.Deferred},
    BOUNCED: {value: MailLogState.Bounced},
    REJECTED: {value: MailLogState.Rejected}
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
