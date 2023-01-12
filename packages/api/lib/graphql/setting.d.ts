import { GraphQLObjectType, GraphQLScalarType, GraphQLInputObjectType, GraphQLEnumType } from 'graphql';
import { Context } from '../context';
import { Setting } from '../db/setting';
export declare const GraphQLSettingValueType: GraphQLScalarType;
export declare const GraphQLSettingName: GraphQLEnumType;
export declare const GraphQLAllowedSettingVals: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
export declare const GraphQLSettingRestriction: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
export declare const GraphQLSettingRestrictionInput: GraphQLInputObjectType;
export declare const GraphQLSettingInput: GraphQLInputObjectType;
export declare const GraphQLUpdateSettingArgs: GraphQLInputObjectType;
export declare const GraphQLSettingsInput: GraphQLInputObjectType;
export declare const GraphQLSetting: GraphQLObjectType<Setting<unknown>, Context, {
    [key: string]: any;
}>;
//# sourceMappingURL=setting.d.ts.map