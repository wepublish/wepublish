import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLInt,
  GraphQLInputObjectType,
  GraphQLEnumType,
  GraphQLBoolean
} from 'graphql'

import {Context} from '../context'

import {GraphQLPageInfo} from './common'
import {GraphQLDateTime} from 'graphql-iso-date'
import {MailLog, MailLogSort} from '../db/mailLog'

export const GraphQLMailLog = new GraphQLObjectType<MailLog, Context>({
  name: 'MailLog',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    recipients: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},
    subject: {type: GraphQLNonNull(GraphQLString)},
    done: {type: GraphQLNonNull(GraphQLBoolean)},
    successful: {type: GraphQLNonNull(GraphQLBoolean)},
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
