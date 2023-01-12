import { GraphQLObjectType, GraphQLEnumType, GraphQLInputObjectType } from 'graphql';
import { Context } from '../context';
import { ImageWithTransformURL } from '../db/image';
export declare const GraphQLInputPoint: GraphQLInputObjectType;
export declare const GraphQLPoint: GraphQLObjectType<any, Context, {
    [key: string]: any;
}>;
export declare const GraphQLImageRotation: GraphQLEnumType;
export declare const GraphQLImageOutput: GraphQLEnumType;
export declare const GraphQLImageTransformation: GraphQLInputObjectType;
export declare const GraphQLUploadImageInput: GraphQLInputObjectType;
export declare const GraphQLUpdateImageInput: GraphQLInputObjectType;
export declare const GraphQLImageFilter: GraphQLInputObjectType;
export declare const GraphQLImageSort: GraphQLEnumType;
export declare const GraphQLImage: GraphQLObjectType<ImageWithTransformURL, Context, {
    [key: string]: any;
}>;
export declare const GraphQLImageConnection: GraphQLObjectType<any, Context, {
    [key: string]: any;
}>;
//# sourceMappingURL=image.d.ts.map