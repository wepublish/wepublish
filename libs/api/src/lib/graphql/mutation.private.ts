import { CommentState, UserEvent } from '@prisma/client';
import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import { Context } from '../context';
import { SettingName } from '@wepublish/settings/api';
import { unselectPassword } from '@wepublish/authentication/api';
import { NotFound } from '../error';
import { Validator } from '../validator';

import {
  GraphQLComment,
  GraphQLCommentItemType,
  GraphQLCommentRatingOverrideUpdateInput,
  GraphQLCommentRejectionReason,
  GraphQLCommentRevisionUpdateInput,
} from './comment/comment';

import {
  createAdminComment,
  deleteComment,
  takeActionOnComment,
  updateComment,
} from './comment/comment.private-mutation';
import {
  GraphQLImage,
  GraphQLUpdateImageInput,
  GraphQLUploadImageInput,
} from './image';
import {
  createImage,
  deleteImageById,
  updateImage,
} from './image/image.private-mutation';

import { GraphQLPeerProfile, GraphQLPeerProfileInput } from './peer';
import { upsertPeerProfile } from './peer-profile/peer-profile.private-mutation';
import { authorise } from './permissions';
import {
  GraphQLFullPoll,
  GraphQLPollAnswer,
  GraphQLPollAnswerWithVoteCount,
  GraphQLPollExternalVoteSource,
  GraphQLPollWithAnswers,
  GraphQLUpdatePollAnswer,
  GraphQLUpdatePollExternalVoteSources,
} from './poll/poll';
import {
  createPoll,
  createPollAnswer,
  createPollExternalVoteSource,
  deletePoll,
  deletePollAnswer,
  deletePollExternalVoteSource,
  updatePoll,
} from './poll/poll.private-mutation';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { GraphQLSession, GraphQLSessionWithToken } from './session';
import {
  createJWTSession,
  createSession,
  revokeSessionByToken,
} from './session/session.mutation';
import { revokeSessionById } from './session/session.private-mutation';
import { getSessionsForUser } from './session/session.private-queries';
import { GraphQLUser, GraphQLUserInput } from './user';
import {
  createAdminUser,
  deleteUserById,
  resetUserPassword,
  updateAdminUser,
} from './user/user.private-mutation';

import { CanSendJWTLogin } from '@wepublish/permissions';
import { mailLogType } from '@wepublish/mail/api';

export const GraphQLAdminMutation = new GraphQLObjectType<undefined, Context>({
  name: 'Mutation',
  fields: {
    // Peering
    // =======

    updatePeerProfile: {
      type: new GraphQLNonNull(GraphQLPeerProfile),
      args: { input: { type: new GraphQLNonNull(GraphQLPeerProfileInput) } },
      resolve: (
        root,
        { input },
        { hostURL, authenticate, prisma: { peerProfile } }
      ) => upsertPeerProfile(input, hostURL, authenticate, peerProfile),
    },

    // Session
    // =======

    createSession: {
      type: new GraphQLNonNull(GraphQLSessionWithToken),
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { email, password }, { sessionTTL, prisma }) =>
        createSession(
          email,
          password,
          sessionTTL,
          prisma.session,
          prisma.user,
          prisma.userRole
        ),
    },

    createSessionWithJWT: {
      type: new GraphQLNonNull(GraphQLSessionWithToken),
      args: {
        jwt: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { jwt }, { sessionTTL, prisma, verifyJWT }) =>
        createJWTSession(
          jwt,
          sessionTTL,
          verifyJWT,
          prisma.session,
          prisma.user,
          prisma.userRole
        ),
    },

    revokeSession: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: { id: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: (root, { id }, { authenticateUser, prisma: { session } }) =>
        revokeSessionById(id, authenticateUser, session),
    },

    revokeActiveSession: {
      type: new GraphQLNonNull(GraphQLBoolean),
      args: {},
      resolve: (root, _, { authenticateUser, prisma: { session } }) =>
        revokeSessionByToken(authenticateUser, session),
    },

    sessions: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLSession))
      ),
      args: {},
      resolve: (root, _, { authenticateUser, prisma: { session, userRole } }) =>
        getSessionsForUser(authenticateUser, session, userRole),
    },

    sendJWTLogin: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        url: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(
        root,
        { url, email },
        { authenticate, prisma, generateJWT, mailContext }
      ) {
        const { roles } = authenticate();
        authorise(CanSendJWTLogin, roles);

        email = email.toLowerCase();
        await Validator.login.parse({ email });

        const user = await prisma.user.findUnique({
          where: { email },
          select: unselectPassword,
        });
        if (!user) throw new NotFound('User', email);

        const jwtExpiresSetting = await prisma.setting.findUnique({
          where: { name: SettingName.SEND_LOGIN_JWT_EXPIRES_MIN },
        });
        const jwtExpires =
          (jwtExpiresSetting?.value as number) ??
          parseInt(process.env['SEND_LOGIN_JWT_EXPIRES_MIN'] ?? '');

        if (!jwtExpires) {
          throw new Error('No value set for SEND_LOGIN_JWT_EXPIRES_MIN');
        }

        const remoteTemplate = await mailContext.getUserTemplateName(
          UserEvent.LOGIN_LINK
        );
        await mailContext.sendMail({
          externalMailTemplateId: remoteTemplate,
          recipient: user,
          optionalData: {},
          mailType: mailLogType.UserFlow,
        });
        return email;
      },
    },

    sendWebsiteLogin: {
      type: new GraphQLNonNull(GraphQLString),
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(
        root,
        { url, email },
        { authenticate, prisma, generateJWT, mailContext, urlAdapter }
      ) {
        email = email.toLowerCase();
        await Validator.login.parse({ email });
        const { roles } = authenticate();
        authorise(CanSendJWTLogin, roles);

        const jwtExpiresSetting = await prisma.setting.findUnique({
          where: { name: SettingName.SEND_LOGIN_JWT_EXPIRES_MIN },
        });
        const jwtExpires =
          (jwtExpiresSetting?.value as number) ??
          parseInt(process.env['SEND_LOGIN_JWT_EXPIRES_MIN'] ?? '');

        if (!jwtExpires)
          throw new Error('No value set for SEND_LOGIN_JWT_EXPIRES_MIN');

        const user = await prisma.user.findUnique({
          where: { email },
          select: unselectPassword,
        });

        if (!user) throw new NotFound('User', email);

        const remoteTemplate = await mailContext.getUserTemplateName(
          UserEvent.LOGIN_LINK
        );
        await mailContext.sendMail({
          externalMailTemplateId: remoteTemplate,
          recipient: user,
          optionalData: {},
          mailType: mailLogType.UserFlow,
        });

        return email;
      },
    },

    // User
    // ====

    createUser: {
      type: GraphQLUser,
      args: {
        input: { type: new GraphQLNonNull(GraphQLUserInput) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (
        root,
        { input, password },
        { hashCostFactor, authenticate, prisma, mailContext }
      ) =>
        createAdminUser(
          { ...input, password },
          authenticate,
          hashCostFactor,
          prisma,
          mailContext
        ),
    },

    updateUser: {
      type: GraphQLUser,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        input: { type: new GraphQLNonNull(GraphQLUserInput) },
      },
      resolve: (root, { id, input }, { authenticate, prisma: { user } }) =>
        updateAdminUser(id, input, authenticate, user),
    },

    resetUserPassword: {
      type: GraphQLUser,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
        sendMail: { type: GraphQLBoolean },
      },
      resolve: (
        root,
        { id, password, sendMail },
        { authenticate, mailContext, prisma: { user }, hashCostFactor }
      ) =>
        resetUserPassword(
          id,
          password,
          sendMail,
          hashCostFactor,
          authenticate,
          mailContext,
          user
        ),
    },

    deleteUser: {
      type: GraphQLUser,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { id }, { authenticate, prisma: { user } }) =>
        deleteUserById(id, authenticate, user),
    },

    // Image
    // =====

    uploadImage: {
      type: GraphQLImage,
      args: { input: { type: new GraphQLNonNull(GraphQLUploadImageInput) } },
      resolve: (
        root,
        { input },
        { authenticate, mediaAdapter, prisma: { image } }
      ) => createImage(input, authenticate, mediaAdapter, image),
    },

    updateImage: {
      type: GraphQLImage,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        input: { type: new GraphQLNonNull(GraphQLUpdateImageInput) },
      },
      resolve: (root, { id, input }, { authenticate, prisma: { image } }) =>
        updateImage(id, input, authenticate, image),
    },

    deleteImage: {
      type: GraphQLImage,
      args: { id: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: (
        root,
        { id },
        { authenticate, mediaAdapter, prisma: { image } }
      ) => deleteImageById(id, authenticate, image, mediaAdapter),
    },

    // Comment
    // ======
    updateComment: {
      type: new GraphQLNonNull(GraphQLComment),
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        revision: { type: GraphQLCommentRevisionUpdateInput },
        userID: { type: GraphQLString },
        guestUsername: { type: GraphQLString },
        guestUserImageID: { type: GraphQLString },
        featured: { type: GraphQLBoolean },
        source: { type: GraphQLString },
        tagIds: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
        ratingOverrides: {
          type: new GraphQLList(
            new GraphQLNonNull(GraphQLCommentRatingOverrideUpdateInput)
          ),
        },
      },
      resolve: (
        root,
        {
          id,
          revision,
          ratingOverrides,
          userID,
          guestUsername,
          guestUserImageID,
          featured,
          source,
          tagIds,
        },
        { authenticate, prisma: { comment, commentRatingSystemAnswer } }
      ) =>
        updateComment(
          id,
          revision,
          userID,
          guestUsername,
          guestUserImageID,
          source,
          featured,
          tagIds,
          ratingOverrides,
          authenticate,
          commentRatingSystemAnswer,
          comment
        ),
    },

    createComment: {
      type: new GraphQLNonNull(GraphQLComment),
      args: {
        text: { type: GraphQLRichText },
        tagIds: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
        itemID: { type: new GraphQLNonNull(GraphQLString) },
        parentID: { type: GraphQLString },
        itemType: {
          type: new GraphQLNonNull(GraphQLCommentItemType),
        },
      },
      resolve: (
        root,
        { text, tagIds, itemID, itemType, parentID },
        { authenticate, prisma: { comment } }
      ) =>
        createAdminComment(
          itemID,
          itemType,
          parentID,
          text,
          tagIds,
          authenticate,
          comment
        ),
    },

    approveComment: {
      type: new GraphQLNonNull(GraphQLComment),
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { id }, { authenticate, prisma: { comment } }) =>
        takeActionOnComment(
          id,
          { state: CommentState.approved },
          authenticate,
          comment
        ),
    },

    rejectComment: {
      type: new GraphQLNonNull(GraphQLComment),
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        rejectionReason: { type: GraphQLCommentRejectionReason },
      },
      resolve: (
        root,
        { id, rejectionReason },
        { authenticate, prisma: { comment } }
      ) =>
        takeActionOnComment(
          id,
          { state: CommentState.rejected, rejectionReason },
          authenticate,
          comment
        ),
    },

    requestChangesOnComment: {
      type: new GraphQLNonNull(GraphQLComment),
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        rejectionReason: {
          type: new GraphQLNonNull(GraphQLCommentRejectionReason),
        },
      },
      resolve: (
        root,
        { id, rejectionReason },
        { authenticate, prisma: { comment } }
      ) =>
        takeActionOnComment(
          id,
          { state: CommentState.pendingUserChanges, rejectionReason },
          authenticate,
          comment
        ),
    },

    deleteComment: {
      type: new GraphQLNonNull(GraphQLComment),
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { id }, { authenticate, prisma: { comment } }) =>
        deleteComment(id, authenticate, comment),
    },

    // Poll
    // ==========

    createPoll: {
      type: GraphQLPollWithAnswers,
      args: {
        opensAt: { type: GraphQLDateTime },
        closedAt: { type: GraphQLDateTime },
        question: { type: GraphQLString },
      },
      resolve: (root, input, { authenticate, prisma: { poll } }) =>
        createPoll(input, authenticate, poll),
    },

    createPollAnswer: {
      type: GraphQLPollAnswer,
      args: {
        pollId: { type: new GraphQLNonNull(GraphQLString) },
        answer: { type: GraphQLString },
      },
      resolve: (
        root,
        { pollId, answer },
        { authenticate, prisma: { pollExternalVoteSource, pollAnswer } }
      ) =>
        createPollAnswer(
          pollId,
          answer,
          authenticate,
          pollExternalVoteSource,
          pollAnswer
        ),
    },

    createPollExternalVoteSource: {
      type: GraphQLPollExternalVoteSource,
      args: {
        pollId: { type: new GraphQLNonNull(GraphQLString) },
        source: { type: GraphQLString },
      },
      resolve: (
        root,
        { pollId, source },
        { authenticate, prisma: { pollExternalVoteSource, pollAnswer } }
      ) =>
        createPollExternalVoteSource(
          pollId,
          source,
          authenticate,
          pollAnswer,
          pollExternalVoteSource
        ),
    },

    updatePoll: {
      type: GraphQLFullPoll,
      args: {
        pollId: { type: new GraphQLNonNull(GraphQLString) },
        opensAt: { type: GraphQLDateTime },
        closedAt: { type: GraphQLDateTime },
        question: { type: GraphQLString },
        infoText: { type: GraphQLRichText },
        answers: {
          type: new GraphQLList(new GraphQLNonNull(GraphQLUpdatePollAnswer)),
        },
        externalVoteSources: {
          type: new GraphQLList(
            new GraphQLNonNull(GraphQLUpdatePollExternalVoteSources)
          ),
        },
      },
      resolve: (
        root,
        { pollId, answers, externalVoteSources, ...pollInput },
        { authenticate, prisma: { poll } }
      ) =>
        updatePoll(
          pollId,
          pollInput,
          answers,
          externalVoteSources,
          authenticate,
          poll
        ),
    },

    deletePoll: {
      type: GraphQLFullPoll,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { id }, { authenticate, prisma: { poll } }) =>
        deletePoll(id, authenticate, poll),
    },

    deletePollAnswer: {
      type: GraphQLPollAnswerWithVoteCount,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { id }, { authenticate, prisma: { pollAnswer } }) =>
        deletePollAnswer(id, authenticate, pollAnswer),
    },

    deletePollExternalVoteSource: {
      type: GraphQLPollExternalVoteSource,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (
        root,
        { id },
        { authenticate, prisma: { pollExternalVoteSource } }
      ) =>
        deletePollExternalVoteSource(id, authenticate, pollExternalVoteSource),
    },
  },
});
