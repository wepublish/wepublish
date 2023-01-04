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
    id: {type: GraphQLNonNull(GraphQLID)},
    name: {type: GraphQLString}
  }
})

export const GraphQLRatingSystemType = new GraphQLEnumType({
  name: 'RatingSystemType',
  values: {
    STAR: {value: RatingSystemType.star}
  }
})

export const GraphQLCommentRatingSystemAnswer = new GraphQLObjectType<
  CommentRatingSystemAnswer,
  Context
>({
  name: 'CommentRatingSystemAnswer',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    ratingSystemId: {type: GraphQLNonNull(GraphQLID)},
    answer: {type: GraphQLString},
    type: {type: GraphQLNonNull(GraphQLRatingSystemType)}
  }
})

export const GraphQLCommentRating = new GraphQLObjectType<CommentRating, Context>({
  name: 'CommentRating',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    userId: {type: GraphQLID},
    commentId: {type: GraphQLNonNull(GraphQLID)},
    value: {type: GraphQLInt},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    fingerprint: {type: GraphQLString},
    disabled: {type: GraphQLBoolean},
    answer: {type: GraphQLCommentRatingSystemAnswer}
  }
})

export const GraphQLCommentRatingSystemWithAnswers = new GraphQLObjectType<
  CommentRatingSystem,
  Context
>({
  name: 'CommentRatingSystemWithAnswers',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    name: {type: GraphQLString},
    answers: {
      type: GraphQLList(GraphQLNonNull(GraphQLCommentRatingSystemAnswer))
    }
  }
})

export const GraphQLFullCommentRatingSystem = new GraphQLObjectType<CommentRatingSystem, Context>({
  name: 'FullCommentRatingSystem',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    name: {type: GraphQLString},
    answers: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLCommentRatingSystemAnswer)))
    }
  }
})

export const GraphQLUpdateCommentRatingSystemAnswer = new GraphQLInputObjectType({
  name: 'UpdateCommentRatingSystemAnswer',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    type: {type: GraphQLRatingSystemType},
    answer: {type: GraphQLString}
  }
})
