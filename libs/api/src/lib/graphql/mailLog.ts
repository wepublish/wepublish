import { MailLog, MailLogState } from '@prisma/client';
import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import { Context } from '../context';
import { MailLogSort } from '../db/mailLog';
import { GraphQLPageInfo } from './common';

export const GraphQLMailLogState = new GraphQLEnumType({
  name: 'MailLogState',
  values: {
    [MailLogState.submitted]: { value: MailLogState.submitted },
    [MailLogState.accepted]: { value: MailLogState.accepted },
    [MailLogState.delivered]: { value: MailLogState.delivered },
    [MailLogState.deferred]: { value: MailLogState.deferred },
    [MailLogState.bounced]: { value: MailLogState.bounced },
    [MailLogState.rejected]: { value: MailLogState.rejected },
  },
});

export const GraphQLMailLog = new GraphQLObjectType<MailLog, Context>({
  name: 'MailLog',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },

    createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    modifiedAt: { type: new GraphQLNonNull(GraphQLDateTime) },

    recipient: { type: new GraphQLNonNull(GraphQLString) },
    subject: { type: new GraphQLNonNull(GraphQLString) },
    state: { type: new GraphQLNonNull(GraphQLMailLogState) },
    mailProviderID: { type: new GraphQLNonNull(GraphQLString) },
    mailData: { type: GraphQLString },
  },
});

export const GraphQLMailLogFilter = new GraphQLInputObjectType({
  name: 'MailLogFilter',
  fields: {
    subject: { type: GraphQLString },
  },
});

export const GraphQLMailLogSort = new GraphQLEnumType({
  name: 'MailLogSort',
  values: {
    [MailLogSort.CreatedAt]: { value: MailLogSort.CreatedAt },
    [MailLogSort.ModifiedAt]: { value: MailLogSort.ModifiedAt },
  },
});

export const GraphQLMailLogConnection = new GraphQLObjectType<any, Context>({
  name: 'MailLogConnection',
  fields: {
    nodes: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLMailLog))
      ),
    },
    pageInfo: { type: new GraphQLNonNull(GraphQLPageInfo) },
    totalCount: { type: new GraphQLNonNull(GraphQLInt) },
  },
});
