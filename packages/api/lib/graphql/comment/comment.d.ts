import { GraphQLEnumType, GraphQLInputObjectType, GraphQLObjectType } from 'graphql';
import { Context } from '../../context';
import { CommentRevision, PublicComment, Comment } from '../../db/comment';
import { CalculatedRating } from './comment.public-queries';
export declare const GraphQLCommentState: GraphQLEnumType;
export declare const GraphQLCommentRejectionReason: GraphQLEnumType;
export declare const GraphQLCommentAuthorType: GraphQLEnumType;
export declare const GraphQLCommentItemType: GraphQLEnumType;
export declare const GraphQLCommentSort: GraphQLEnumType;
export declare const GraphQLPublicCommentSort: GraphQLEnumType;
export declare const GraphQLCommentFilter: GraphQLInputObjectType;
export declare const GraphQLCommentRevision: GraphQLObjectType<CommentRevision, Context, {
    [key: string]: any;
}>;
export declare const GraphQLCommentRevisionUpdateInput: GraphQLInputObjectType;
export declare const GraphQLCommentRatingOverrideUpdateInput: GraphQLInputObjectType;
export declare const GraphQLPublicCommentUpdateInput: GraphQLInputObjectType;
export declare const GraphQLChallengeInput: GraphQLInputObjectType;
export declare const GraphQLPublicCommentInput: GraphQLInputObjectType;
export declare const GraphQLoverriddenRating: GraphQLObjectType<CalculatedRating, Context, {
    [key: string]: any;
}>;
export declare const GraphQLComment: GraphQLObjectType<Comment, Context>;
export declare const GraphQLCalculatedRating: GraphQLObjectType<CalculatedRating, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicComment: GraphQLObjectType<PublicComment, Context>;
export declare const GraphQLCommentConnection: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
export declare const GraphQLPublicCommentConnection: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
//# sourceMappingURL=comment.d.ts.map