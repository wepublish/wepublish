import { CommentRating, CommentRatingSystem, CommentRatingSystemAnswer } from '@prisma/client';
import { GraphQLEnumType, GraphQLInputObjectType, GraphQLObjectType } from 'graphql';
import { Context } from '../../context';
export declare const GraphQLCommentRatingSystem: GraphQLObjectType<CommentRatingSystem, Context, {
    [key: string]: any;
}>;
export declare const GraphQLRatingSystemType: GraphQLEnumType;
export declare const GraphQLCommentRatingSystemAnswer: GraphQLObjectType<CommentRatingSystemAnswer, Context, {
    [key: string]: any;
}>;
export declare const GraphQLCommentRating: GraphQLObjectType<CommentRating, Context, {
    [key: string]: any;
}>;
export declare const GraphQLCommentRatingSystemWithAnswers: GraphQLObjectType<CommentRatingSystem, Context, {
    [key: string]: any;
}>;
export declare const GraphQLFullCommentRatingSystem: GraphQLObjectType<CommentRatingSystem, Context, {
    [key: string]: any;
}>;
export declare const GraphQLUpdateCommentRatingSystemAnswer: GraphQLInputObjectType;
//# sourceMappingURL=comment-rating.d.ts.map