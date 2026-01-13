import { CanLoginAsOtherUser } from '@wepublish/permissions';
import { SortOrder } from '@wepublish/utils/api';
import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { Context } from '../context';
import { CommentSort } from '../db/comment';
import { ImageSort } from '../db/image';
import { UserSort } from '../db/user';
import { GivenTokeExpiryToLongError, UserIdNotFound } from '../error';

import { GraphQLJWTToken } from './auth';

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

import { GraphQLPeerProfile } from './peer';
import {
  getAdminPeerProfile,
  getRemotePeerProfile,
} from './peer-profile/peer-profile.private-queries';
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
