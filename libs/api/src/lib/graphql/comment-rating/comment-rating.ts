import {
  CommentRating,
  CommentRatingSystem,
  CommentRatingSystemAnswer,
  RatingSystemType
} from '@prisma/client'
import {
  GraphQLBoolean,
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
import {Context} from '../../context'

export const GraphQLCommentRatingSystem = new GraphQLObjectType<CommentRatingSystem, Context>({
  name: 'CommentRatingSystem',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    name: {type: GraphQLString}
  }
})

export const GraphQLRatingSystemType = new GraphQLEnumType({
  name: 'RatingSystemType',
  values: {
    [RatingSystemType.star]: {value: RatingSystemType.star}
  }
})

export const GraphQLCommentRatingSystemAnswer = new GraphQLObjectType<
  CommentRatingSystemAnswer,
  Context
>({
  name: 'CommentRatingSystemAnswer',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    ratingSystemId: {type: new GraphQLNonNull(GraphQLID)},
    answer: {type: GraphQLString},
    type: {type: new GraphQLNonNull(GraphQLRatingSystemType)}
  }
})

export const GraphQLCommentRating = new GraphQLObjectType<CommentRating, Context>({
  name: 'CommentRating',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    userId: {type: GraphQLID},
    commentId: {type: new GraphQLNonNull(GraphQLID)},
    value: {type: new GraphQLNonNull(GraphQLInt)},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    fingerprint: {type: GraphQLString},
    disabled: {type: GraphQLBoolean},
    answer: {type: new GraphQLNonNull(GraphQLCommentRatingSystemAnswer)}
  }
})

export const GraphQLCommentRatingSystemWithAnswers = new GraphQLObjectType<
  CommentRatingSystem,
  Context
>({
  name: 'CommentRatingSystemWithAnswers',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    name: {type: GraphQLString},
    answers: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLCommentRatingSystemAnswer))
    }
  }
})

export const GraphQLFullCommentRatingSystem = new GraphQLObjectType<CommentRatingSystem, Context>({
  name: 'FullCommentRatingSystem',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    name: {type: GraphQLString},
    answers: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLCommentRatingSystemAnswer))
      )
    }
  }
})

export const GraphQLUpdateCommentRatingSystemAnswer = new GraphQLInputObjectType({
  name: 'UpdateCommentRatingSystemAnswer',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    type: {type: GraphQLRatingSystemType},
    answer: {type: GraphQLString}
  }
})
