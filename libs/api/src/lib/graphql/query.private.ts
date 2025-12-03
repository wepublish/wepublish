import {
  CanGetPaymentProviders,
  CanLoginAsOtherUser,
} from '@wepublish/permissions';
import { SortOrder } from '@wepublish/utils/api';
import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { Context } from '../context';
import { AuthorSort } from '../db/author';
import { CommentSort } from '../db/comment';
import { ImageSort } from '../db/image';
import { InvoiceSort } from '../db/invoice';
import { MemberPlanSort } from '../db/memberPlan';
import { PaymentSort } from '../db/payment';
import { SubscriptionSort } from '../db/subscription';
import { UserSort } from '../db/user';
import { GivenTokeExpiryToLongError, UserIdNotFound } from '../error';

import { GraphQLJWTToken } from './auth';
import {
  GraphQLAuthor,
  GraphQLAuthorConnection,
  GraphQLAuthorFilter,
  GraphQLAuthorSort,
} from './author';
import {
  getAdminAuthors,
  getAuthorByIdOrSlug,
} from './author/author.private-queries';
import { GraphQLFullCommentRatingSystem } from './comment-rating/comment-rating';
import { getRatingSystem } from './comment-rating/comment-rating.public-queries';
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
  GraphQLImage,
  GraphQLImageConnection,
  GraphQLImageFilter,
  GraphQLImageSort,
} from './image';
import { getAdminImages, getImageById } from './image/image.private-queries';
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
import {
  getAdminMemberPlans,
  getMemberPlanByIdOrSlug,
} from './member-plan/member-plan.private-queries';
import {
  GraphQLMemberPlan,
  GraphQLMemberPlanConnection,
  GraphQLMemberPlanFilter,
  GraphQLMemberPlanSort,
} from './memberPlan';
import {
  GraphQLPayment,
  GraphQLPaymentConnection,
  GraphQLPaymentFilter,
  GraphQLPaymentSort,
} from './payment';
import {
  getPaymentMethodById,
  getPaymentMethods,
} from './payment-method/payment-method.private-queries';
import {
  getAdminPayments,
  getPaymentById,
} from './payment/payment.private-queries';
import { GraphQLPaymentMethod, GraphQLPaymentProvider } from './paymentMethod';
import { GraphQLPeer, GraphQLPeerProfile } from './peer';
import {
  getAdminPeerProfile,
  getRemotePeerProfile,
} from './peer-profile/peer-profile.private-queries';
import { getPeerById, getPeers } from './peer/peer.private-queries';
import { authorise } from './permissions';
import {
  GraphQLFullPoll,
  GraphQLPollConnection,
  GraphQLPollFilter,
  GraphQLPollSort,
} from './poll/poll';
import { PollSort, getPolls } from './poll/poll.private-queries';
import { getPoll } from './poll/poll.public-queries';
import { GraphQLSession } from './session';
import { getSessionsForUser } from './session/session.private-queries';
import { GraphQLSlug } from '@wepublish/utils/api';
import {
  GraphQLSubscribersPerMonth,
  GraphQLSubscription,
  GraphQLSubscriptionConnection,
  GraphQLSubscriptionFilter,
  GraphQLSubscriptionSort,
} from './subscription';
import {
  getAdminSubscriptions,
  getNewSubscribersPerMonth,
  getSubscriptionById,
  getSubscriptionsAsCSV,
} from './subscription/subscription.private-queries';
import {
  GraphQLTag,
  GraphQLTagConnection,
  GraphQLTagFilter,
  GraphQLTagSort,
} from './tag/tag';
import { getTags, getTag } from './tag/tag.private-query';
import { TagSort } from './tag/tag.query';
import { GraphQLToken } from './token';
import { getTokens } from './token/token.private-queries';
import {
  GraphQLUser,
  GraphQLUserConnection,
  GraphQLUserFilter,
  GraphQLUserSort,
} from './user';
import { getAdminUsers, getMe, getUserById } from './user/user.private-queries';

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

    createJWTForUser: {
      type: GraphQLJWTToken,
      args: {
        userId: { type: new GraphQLNonNull(GraphQLString) },
        expiresInMinutes: { type: new GraphQLNonNull(GraphQLInt) },
      },
      async resolve(
        root,
        { userId, expiresInMinutes },
        { authenticate, generateJWT, prisma },
        info
      ) {
        const TWO_YEARS_IN_MIN = 2 * 365 * 24 * 60;
        const { roles } = authenticate();
        authorise(CanLoginAsOtherUser, roles);

        if (expiresInMinutes > TWO_YEARS_IN_MIN) {
          throw new GivenTokeExpiryToLongError();
        }

        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new UserIdNotFound();
        }

        const expiresAt = new Date(
          new Date().getTime() + expiresInMinutes * 60 * 1000
        ).toISOString();

        const token = generateJWT({ id: userId, expiresInMinutes });

        return {
          token,
          expiresAt,
        };
      },
    },

    createJWTForWebsiteLogin: {
      type: GraphQLJWTToken,
      args: {},
      async resolve(root, _, { authenticateUser, generateJWT }) {
        const expiresInMinutes = 1;
        const { user } = authenticateUser();

        const expiresAt = new Date(
          new Date().getTime() + expiresInMinutes * 60 * 1000
        ).toISOString();

        const token = generateJWT({ id: user.id, expiresInMinutes });

        return {
          token,
          expiresAt,
        };
      },
    },

    peerProfile: {
      type: new GraphQLNonNull(GraphQLPeerProfile),
      resolve: (
        root,
        args,
        { authenticate, hostURL, websiteURL, prisma: { peerProfile } }
      ) => getAdminPeerProfile(hostURL, websiteURL, authenticate, peerProfile),
    },

    peers: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLPeer)),
      resolve: (root, _, { authenticate, prisma: { peer } }) =>
        getPeers(authenticate, peer),
    },

    peer: {
      type: GraphQLPeer,
      args: { id: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: (root, { id }, { authenticate, loaders: { peer } }) =>
        getPeerById(id, authenticate, peer),
    },

    // User
    // ====

    me: {
      type: GraphQLUser,
      resolve: (root, args, { authenticate }) => getMe(authenticate),
    },

    // Session
    // =======

    sessions: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLSession))
      ),
      resolve: (root, _, { authenticateUser, prisma: { session, userRole } }) =>
        getSessionsForUser(authenticateUser, session, userRole),
    },

    // Users
    // ==========
    user: {
      type: GraphQLUser,
      args: { id: { type: GraphQLString } },
      resolve: (root, { id }, { authenticate, prisma: { user } }) => {
        return getUserById(id, authenticate, user);
      },
    },

    users: {
      type: new GraphQLNonNull(GraphQLUserConnection),
      args: {
        cursor: { type: GraphQLString },
        take: { type: GraphQLInt, defaultValue: 10 },
        skip: { type: GraphQLInt, defaultValue: 0 },
        filter: { type: GraphQLUserFilter },
        sort: { type: GraphQLUserSort, defaultValue: UserSort.ModifiedAt },
        order: { type: GraphQLSortOrder, defaultValue: SortOrder.Descending },
      },
      resolve: (
        root,
        { filter, sort, order, take, skip, cursor },
        { authenticate, prisma: { user } }
      ) =>
        getAdminUsers(
          filter,
          sort,
          order,
          cursor,
          skip,
          take,
          authenticate,
          user
        ),
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

    // Token
    // =====

    tokens: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLToken))
      ),
      resolve: (root, args, { authenticateUser, prisma: { token } }) =>
        getTokens(authenticateUser, token),
    },

    // Author
    // ======

    author: {
      type: GraphQLAuthor,
      args: { id: { type: GraphQLString }, slug: { type: GraphQLSlug } },
      resolve: (
        root,
        { id, slug },
        { authenticate, loaders: { authorsByID, authorsBySlug } }
      ) =>
        getAuthorByIdOrSlug(id, slug, authenticate, authorsByID, authorsBySlug),
    },

    authors: {
      type: new GraphQLNonNull(GraphQLAuthorConnection),
      args: {
        cursor: { type: GraphQLString },
        take: { type: GraphQLInt, defaultValue: 10 },
        skip: { type: GraphQLInt, defaultValue: 0 },
        filter: { type: GraphQLAuthorFilter },
        sort: { type: GraphQLAuthorSort, defaultValue: AuthorSort.ModifiedAt },
        order: { type: GraphQLSortOrder, defaultValue: SortOrder.Descending },
      },
      resolve: (
        root,
        { filter, sort, order, take, skip, cursor },
        { authenticate, prisma: { author } }
      ) =>
        getAdminAuthors(
          filter,
          sort,
          order,
          cursor,
          skip,
          take,
          authenticate,
          author
        ),
    },

    // Image
    // =====

    image: {
      type: GraphQLImage,
      args: { id: { type: GraphQLString } },
      resolve: (root, { id }, { authenticate, loaders: { images } }) =>
        getImageById(id, authenticate, images),
    },

    images: {
      type: new GraphQLNonNull(GraphQLImageConnection),
      args: {
        cursor: { type: GraphQLString },
        take: { type: GraphQLInt, defaultValue: 5 },
        skip: { type: GraphQLInt, defaultValue: 0 },
        filter: { type: GraphQLImageFilter },
        sort: { type: GraphQLImageSort, defaultValue: ImageSort.ModifiedAt },
        order: { type: GraphQLSortOrder, defaultValue: SortOrder.Descending },
      },
      resolve: (
        root,
        { filter, sort, order, skip, take, cursor },
        { authenticate, prisma: { image } }
      ) =>
        getAdminImages(
          filter,
          sort,
          order,
          cursor,
          skip,
          take,
          authenticate,
          image
        ),
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

    // MemberPlan
    // ======

    memberPlan: {
      type: GraphQLMemberPlan,
      args: { id: { type: GraphQLString }, slug: { type: GraphQLSlug } },
      resolve: (
        root,
        { id, slug },
        { authenticate, loaders: { memberPlansByID, memberPlansBySlug } }
      ) =>
        getMemberPlanByIdOrSlug(
          id,
          slug,
          authenticate,
          memberPlansByID,
          memberPlansBySlug
        ),
    },

    memberPlans: {
      type: new GraphQLNonNull(GraphQLMemberPlanConnection),
      args: {
        cursor: { type: GraphQLString },
        take: { type: GraphQLInt, defaultValue: 10 },
        skip: { type: GraphQLInt, defaultValue: 0 },
        filter: { type: GraphQLMemberPlanFilter },
        sort: {
          type: GraphQLMemberPlanSort,
          defaultValue: MemberPlanSort.ModifiedAt,
        },
        order: { type: GraphQLSortOrder, defaultValue: SortOrder.Descending },
      },
      resolve: (
        root,
        { filter, sort, order, cursor, take, skip },
        { authenticate, prisma: { memberPlan } }
      ) =>
        getAdminMemberPlans(
          filter,
          sort,
          order,
          cursor,
          skip,
          take,
          authenticate,
          memberPlan
        ),
    },

    // PaymentMethod
    // ======

    paymentMethod: {
      type: GraphQLPaymentMethod,
      args: { id: { type: GraphQLString } },
      resolve: (
        root,
        { id },
        { authenticate, loaders: { paymentMethodsByID } }
      ) => getPaymentMethodById(id, authenticate, paymentMethodsByID),
    },

    paymentMethods: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLPaymentMethod))
      ),
      resolve: (root, _, { authenticate, prisma: { paymentMethod } }) =>
        getPaymentMethods(authenticate, paymentMethod),
    },

    paymentProviders: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLPaymentProvider))
      ),
      resolve(root, _, { authenticate, paymentProviders }) {
        const { roles } = authenticate();
        authorise(CanGetPaymentProviders, roles);

        return paymentProviders.map(({ id, name }) => ({
          id,
          name,
        }));
      },
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

    // Payment
    // ======

    payment: {
      type: GraphQLPayment,
      args: { id: { type: GraphQLString } },
      resolve: (root, { id }, { authenticate, loaders: { paymentsByID } }) =>
        getPaymentById(id, authenticate, paymentsByID),
    },

    payments: {
      type: new GraphQLNonNull(GraphQLPaymentConnection),
      args: {
        cursor: { type: GraphQLString },
        take: { type: GraphQLInt, defaultValue: 10 },
        skip: { type: GraphQLInt, defaultValue: 0 },
        filter: { type: GraphQLPaymentFilter },
        sort: {
          type: GraphQLPaymentSort,
          defaultValue: PaymentSort.ModifiedAt,
        },
        order: { type: GraphQLSortOrder, defaultValue: SortOrder.Descending },
      },
      resolve: (
        root,
        { filter, sort, order, cursor, take, skip },
        { authenticate, prisma: { payment } }
      ) =>
        getAdminPayments(
          filter,
          sort,
          order,
          cursor,
          skip,
          take,
          authenticate,
          payment
        ),
    },

    // Rating System
    // ==========

    ratingSystem: {
      type: new GraphQLNonNull(GraphQLFullCommentRatingSystem),
      resolve: (root, input, { prisma: { commentRatingSystem } }) =>
        getRatingSystem(commentRatingSystem),
    },

    // Tag
    // ==========

    tags: {
      type: GraphQLTagConnection,
      args: {
        cursor: { type: GraphQLString },
        take: { type: GraphQLInt, defaultValue: 10 },
        skip: { type: GraphQLInt, defaultValue: 0 },
        filter: { type: GraphQLTagFilter },
        sort: { type: GraphQLTagSort, defaultValue: TagSort.CreatedAt },
        order: { type: GraphQLSortOrder, defaultValue: SortOrder.Descending },
      },
      resolve: (
        root,
        { filter, sort, order, cursor, take, skip },
        { authenticate, prisma }
      ) =>
        getTags(
          filter,
          sort,
          order,
          cursor,
          skip,
          take,
          authenticate,
          prisma.tag
        ),
    },

    tag: {
      type: GraphQLTag,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { id }, { authenticate, prisma }) =>
        getTag(id, authenticate, prisma.tag),
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

    // Stats
    newSubscribersPerMonth: {
      type: new GraphQLList(GraphQLSubscribersPerMonth),
      args: { monthsBack: { type: GraphQLInt } },
      resolve: (
        root,
        { monthsBack },
        { authenticate, prisma: { subscription } }
      ) => {
        return getNewSubscribersPerMonth(
          authenticate,
          subscription,
          monthsBack
        );
      },
    },
  },
});
