import {
  CommentAuthorType,
  CommentItemType,
  CommentRejectionReason,
  CommentState,
} from '@prisma/client';
import { unselectPassword } from '@wepublish/authentication/api';
import { GraphQLRichText } from '@wepublish/richtext/api';
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import { Context } from '../../context';
import {
  CalculatedRating,
  Comment,
  CommentRevision,
  CommentSort,
} from '../../db/comment';
import { createProxyingResolver } from '../../utility';
import { GraphQLPageInfo } from '../common';
import { GraphQLImage } from '../image';
import { GraphQLTag } from '../tag/tag';
import { GraphQLUser } from '../user';

export const GraphQLCommentState = new GraphQLEnumType({
  name: 'CommentState',
  values: {
    [CommentState.approved]: { value: CommentState.approved },
    [CommentState.pendingApproval]: { value: CommentState.pendingApproval },
    [CommentState.pendingUserChanges]: {
      value: CommentState.pendingUserChanges,
    },
    [CommentState.rejected]: { value: CommentState.rejected },
  },
});

export const GraphQLCommentRejectionReason = new GraphQLEnumType({
  name: 'CommentRejectionReason',
  values: {
    [CommentRejectionReason.misconduct]: {
      value: CommentRejectionReason.misconduct,
    },
    [CommentRejectionReason.spam]: { value: CommentRejectionReason.spam },
  },
});

export const GraphQLCommentAuthorType = new GraphQLEnumType({
  name: 'CommentAuthorType',
  values: {
    [CommentAuthorType.author]: { value: CommentAuthorType.author },
    [CommentAuthorType.team]: { value: CommentAuthorType.team },
    [CommentAuthorType.verifiedUser]: { value: CommentAuthorType.verifiedUser },
    [CommentAuthorType.guestUser]: { value: CommentAuthorType.guestUser },
  },
});

export const GraphQLCommentItemType = new GraphQLEnumType({
  name: 'CommentItemType',
  values: {
    [CommentItemType.article]: { value: CommentItemType.article },
    [CommentItemType.page]: { value: CommentItemType.page },
  },
});

export const GraphQLCommentSort = new GraphQLEnumType({
  name: 'CommentSort',
  values: {
    [CommentSort.ModifiedAt]: { value: CommentSort.ModifiedAt },
    [CommentSort.CreatedAt]: { value: CommentSort.CreatedAt },
  },
});

export const GraphQLCommentFilter = new GraphQLInputObjectType({
  name: 'CommentFilter',
  fields: {
    item: { type: GraphQLString },
    tags: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
    states: { type: new GraphQLList(new GraphQLNonNull(GraphQLCommentState)) },
    itemType: { type: GraphQLCommentItemType },
    itemID: { type: GraphQLString },
  },
});

export const GraphQLCommentRevision = new GraphQLObjectType<
  CommentRevision,
  Context
>({
  name: 'CommentRevision',
  fields: {
    text: { type: GraphQLRichText },
    title: { type: GraphQLString },
    lead: { type: GraphQLString },
    createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
  },
});

export const GraphQLCommentRevisionUpdateInput = new GraphQLInputObjectType({
  name: 'CommentRevisionUpdateInput',
  fields: {
    text: { type: GraphQLRichText },
    title: { type: GraphQLString },
    lead: { type: GraphQLString },
  },
});

export const GraphQLCommentRatingOverrideUpdateInput =
  new GraphQLInputObjectType({
    name: 'CommentRatingOverrideUpdateInput',
    fields: {
      answerId: { type: new GraphQLNonNull(GraphQLString) },
      value: { type: GraphQLInt },
    },
  });

export const GraphQLChallengeInput = new GraphQLInputObjectType({
  name: 'ChallengeInput',
  fields: {
    challengeID: {
      type: GraphQLString,
    },
    challengeSolution: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
});

export const GraphQLoverriddenRating = new GraphQLObjectType<
  CalculatedRating,
  Context
>({
  name: 'overriddenRating',
  fields: {
    answerId: { type: new GraphQLNonNull(GraphQLString) },
    value: { type: GraphQLInt },
  },
});

export const GraphQLComment: GraphQLObjectType<Comment, Context> =
  new GraphQLObjectType<Comment, Context>({
    name: 'Comment',
    fields: () => ({
      id: { type: new GraphQLNonNull(GraphQLString) },
      guestUsername: { type: GraphQLString },
      guestUserImage: {
        type: GraphQLImage,
        resolve: createProxyingResolver(
          ({ guestUserImageID }, _, { prisma: { image } }) =>
            guestUserImageID ?
              image.findUnique({
                where: {
                  id: guestUserImageID,
                },
              })
            : null
        ),
      },
      user: {
        type: GraphQLUser,
        resolve: createProxyingResolver(
          ({ userID }, _, { prisma: { user } }) =>
            userID ?
              user.findUnique({
                where: {
                  id: userID,
                },
                select: unselectPassword,
              })
            : null
        ),
      },
      tags: {
        type: new GraphQLNonNull(
          new GraphQLList(new GraphQLNonNull(GraphQLTag))
        ),
        resolve: createProxyingResolver(
          async ({ id }, _, { prisma: { tag } }) => {
            const tags = await tag.findMany({
              where: {
                comments: {
                  some: {
                    commentId: id,
                  },
                },
              },
            });

            return tags;
          }
        ),
      },
      authorType: { type: new GraphQLNonNull(GraphQLCommentAuthorType) },
      itemID: { type: new GraphQLNonNull(GraphQLString) },
      itemType: {
        type: new GraphQLNonNull(GraphQLCommentItemType),
      },
      parentComment: {
        type: GraphQLComment,
        resolve: createProxyingResolver(
          ({ parentID }, _, { prisma: { comment } }) =>
            parentID ?
              comment.findUnique({
                where: {
                  id: parentID,
                },
                include: {
                  revisions: { orderBy: { createdAt: 'asc' } },
                },
              })
            : null
        ),
      },
      revisions: {
        type: new GraphQLNonNull(
          new GraphQLList(new GraphQLNonNull(GraphQLCommentRevision))
        ),
      },
      source: {
        type: GraphQLString,
      },
      state: { type: new GraphQLNonNull(GraphQLCommentState) },
      rejectionReason: { type: GraphQLCommentRejectionReason },
      featured: { type: GraphQLBoolean },
      createdAt: { type: new GraphQLNonNull(GraphQLDateTime) },
      modifiedAt: { type: new GraphQLNonNull(GraphQLDateTime) },
      overriddenRatings: {
        type: new GraphQLList(new GraphQLNonNull(GraphQLoverriddenRating)),
      },
    }),
  });

export const GraphQLCommentConnection = new GraphQLObjectType({
  name: 'CommentConnection',
  fields: {
    nodes: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLComment))
      ),
    },
    pageInfo: { type: new GraphQLNonNull(GraphQLPageInfo) },
    totalCount: { type: new GraphQLNonNull(GraphQLInt) },
  },
});
