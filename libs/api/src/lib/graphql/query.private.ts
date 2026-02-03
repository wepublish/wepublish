import { SortOrder } from '@wepublish/utils/api';
import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { Context } from '../context';
import { CommentSort } from '../db/comment';
import { InvoiceSort } from '../db/invoice';
import { SubscriptionSort } from '../db/subscription';

import {
  GraphQLComment,
  GraphQLCommentConnection,
  GraphQLCommentFilter,
  GraphQLCommentSort,
} from './comment/comment';
import {
  getAdminComments,
  getComment,
} from './comment/comment.private-queries';
import { GraphQLSortOrder } from './common';

import {
  GraphQLInvoice,
  GraphQLInvoiceConnection,
  GraphQLInvoiceSort,
  GraphQLinvoiceFilter,
} from './invoice';
import {
  getAdminInvoices,
  getInvoiceById,
} from './invoice/invoice.private-queries';

import { GraphQLPeerProfile } from './peer';
import {
  getAdminPeerProfile,
  getRemotePeerProfile,
} from './peer-profile/peer-profile.private-queries';
import {
  GraphQLFullPoll,
  GraphQLPollConnection,
  GraphQLPollFilter,
  GraphQLPollSort,
} from './poll/poll';
import { PollSort, getPolls } from './poll/poll.private-queries';
import { getPoll } from './poll/poll.public-queries';
import {
  GraphQLSubscription,
  GraphQLSubscriptionConnection,
  GraphQLSubscriptionFilter,
  GraphQLSubscriptionSort,
} from './subscription';
import {
  getAdminSubscriptions,
  getSubscriptionById,
  getSubscriptionsAsCSV,
} from './subscription/subscription.private-queries';

export const GraphQLQuery = new GraphQLObjectType<undefined, Context>({
  name: 'Query',
  fields: {
    // Peering
    // =======

    remotePeerProfile: {
      type: GraphQLPeerProfile,
      args: {
        hostURL: { type: new GraphQLNonNull(GraphQLString) },
        token: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (
        root,
        { hostURL, token },
        { authenticate, prisma: { setting } },
        info
      ) => getRemotePeerProfile(hostURL, token, authenticate, info, setting),
    },

    peerProfile: {
      type: new GraphQLNonNull(GraphQLPeerProfile),
      resolve: (
        root,
        args,
        { authenticate, hostURL, websiteURL, prisma: { peerProfile } }
      ) => getAdminPeerProfile(hostURL, websiteURL, authenticate, peerProfile),
    },

    // Subscriptions
    // ==========
    subscription: {
      type: GraphQLSubscription,
      args: { id: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: (root, { id }, { authenticate, prisma: { subscription } }) => {
        return getSubscriptionById(id, authenticate, subscription);
      },
    },

    subscriptions: {
      type: new GraphQLNonNull(GraphQLSubscriptionConnection),
      args: {
        cursor: { type: GraphQLString },
        take: { type: GraphQLInt, defaultValue: 10 },
        skip: { type: GraphQLInt, defaultValue: 0 },
        filter: { type: GraphQLSubscriptionFilter },
        sort: {
          type: GraphQLSubscriptionSort,
          defaultValue: SubscriptionSort.ModifiedAt,
        },
        order: { type: GraphQLSortOrder, defaultValue: SortOrder.Descending },
      },
      resolve: (
        root,
        { filter, sort, order, take, skip, cursor },
        { authenticate, prisma: { subscription } }
      ) =>
        getAdminSubscriptions(
          filter,
          sort,
          order,
          cursor,
          skip,
          take,
          authenticate,
          subscription
        ),
    },

    subscriptionsAsCsv: {
      type: GraphQLString,
      args: { filter: { type: GraphQLSubscriptionFilter } },
      resolve: (root, { filter }, { prisma: { subscription }, authenticate }) =>
        getSubscriptionsAsCSV(filter, authenticate, subscription),
    },

    // Comments
    // =======

    comment: {
      type: GraphQLComment,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { id }, { authenticate, prisma: { comment } }) => {
        return getComment(id, authenticate, comment);
      },
    },

    comments: {
      type: new GraphQLNonNull(GraphQLCommentConnection),
      args: {
        cursor: { type: GraphQLString },
        take: { type: GraphQLInt, defaultValue: 10 },
        skip: { type: GraphQLInt, defaultValue: 0 },
        filter: { type: GraphQLCommentFilter },
        sort: {
          type: GraphQLCommentSort,
          defaultValue: CommentSort.ModifiedAt,
        },
        order: { type: GraphQLSortOrder, defaultValue: SortOrder.Descending },
      },
      resolve: (
        root,
        { filter, sort, order, skip, take, cursor },
        { authenticate, prisma: { comment } }
      ) =>
        getAdminComments(
          filter,
          sort,
          order,
          cursor,
          skip,
          take,
          authenticate,
          comment
        ),
    },

    // Invoice
    // ======

    invoice: {
      type: GraphQLInvoice,
      args: { id: { type: GraphQLString } },
      resolve: (root, { id }, { authenticate, loaders: { invoicesByID } }) =>
        getInvoiceById(id, authenticate, invoicesByID),
    },

    invoices: {
      type: new GraphQLNonNull(GraphQLInvoiceConnection),
      args: {
        cursor: { type: GraphQLString },
        take: { type: GraphQLInt, defaultValue: 10 },
        skip: { type: GraphQLInt, defaultValue: 0 },
        filter: { type: GraphQLinvoiceFilter },
        sort: {
          type: GraphQLInvoiceSort,
          defaultValue: InvoiceSort.ModifiedAt,
        },
        order: { type: GraphQLSortOrder, defaultValue: SortOrder.Descending },
      },
      resolve: (
        root,
        { filter, sort, order, cursor, take, skip },
        { authenticate, prisma: { invoice } }
      ) =>
        getAdminInvoices(
          filter,
          sort,
          order,
          cursor,
          skip,
          take,
          authenticate,
          invoice
        ),
    },

    // Polls
    // =======

    polls: {
      type: GraphQLPollConnection,
      args: {
        cursor: { type: GraphQLString },
        take: { type: GraphQLInt, defaultValue: 10 },
        skip: { type: GraphQLInt, defaultValue: 0 },
        filter: { type: GraphQLPollFilter },
        sort: { type: GraphQLPollSort, defaultValue: PollSort.OpensAt },
        order: { type: GraphQLSortOrder, defaultValue: SortOrder.Descending },
      },
      resolve: (
        root,
        { cursor, take, skip, filter, sort, order },
        { authenticate, prisma: { poll } }
      ) =>
        getPolls(filter, sort, order, cursor, skip, take, authenticate, poll),
    },

    poll: {
      type: GraphQLFullPoll,
      args: {
        id: { type: GraphQLString },
      },
      resolve: (root, { id }, { prisma: { poll } }) => getPoll(id, poll),
    },
  },
});
