import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLString
} from 'graphql'

import {Context} from '../context'
import {Setting, SettingName} from '@wepublish/settings/api'

export const GraphQLSettingValueType = new GraphQLScalarType({
  name: 'GraphQLSettingValueType',
  serialize(Value) {
    return Value
  }
})

export const GraphQLSettingName = new GraphQLEnumType({
  name: 'SettingName',
  values: {
    [SettingName.ALLOW_GUEST_COMMENTING]: {value: SettingName.ALLOW_GUEST_COMMENTING},
    [SettingName.ALLOW_GUEST_COMMENT_RATING]: {value: SettingName.ALLOW_GUEST_COMMENT_RATING},
    [SettingName.ALLOW_GUEST_POLL_VOTING]: {value: SettingName.ALLOW_GUEST_POLL_VOTING},
    [SettingName.SEND_LOGIN_JWT_EXPIRES_MIN]: {value: SettingName.SEND_LOGIN_JWT_EXPIRES_MIN},
    [SettingName.RESET_PASSWORD_JWT_EXPIRES_MIN]: {
      value: SettingName.RESET_PASSWORD_JWT_EXPIRES_MIN
    },
    [SettingName.PEERING_TIMEOUT_MS]: {value: SettingName.PEERING_TIMEOUT_MS},
    [SettingName.MAKE_ACTIVE_SUBSCRIBERS_API_PUBLIC]: {
      value: SettingName.MAKE_ACTIVE_SUBSCRIBERS_API_PUBLIC
    },
    [SettingName.MAKE_NEW_SUBSCRIBERS_API_PUBLIC]: {
      value: SettingName.MAKE_NEW_SUBSCRIBERS_API_PUBLIC
    },
    [SettingName.MAKE_RENEWING_SUBSCRIBERS_API_PUBLIC]: {
      value: SettingName.MAKE_RENEWING_SUBSCRIBERS_API_PUBLIC
    },
    [SettingName.MAKE_NEW_DEACTIVATIONS_API_PUBLIC]: {
      value: SettingName.MAKE_NEW_DEACTIVATIONS_API_PUBLIC
    },
    [SettingName.MAKE_EXPECTED_REVENUE_API_PUBLIC]: {
      value: SettingName.MAKE_EXPECTED_REVENUE_API_PUBLIC
    },
    [SettingName.MAKE_REVENUE_API_PUBLIC]: {value: SettingName.MAKE_REVENUE_API_PUBLIC},
    [SettingName.COMMENT_CHAR_LIMIT]: {value: SettingName.COMMENT_CHAR_LIMIT},
    [SettingName.ALLOW_COMMENT_EDITING]: {value: SettingName.ALLOW_COMMENT_EDITING}
  }
})

export const GraphQLAllowedSettingVals = new GraphQLObjectType({
  name: 'AllowedSettingVals',
  fields: {
    stringChoice: {type: new GraphQLList(GraphQLString)},
    boolChoice: {type: GraphQLBoolean}
  }
})

export const GraphQLSettingRestriction = new GraphQLObjectType({
  name: 'SettingRestriction',
  fields: {
    maxValue: {type: GraphQLInt},
    minValue: {type: GraphQLInt},
    inputLength: {type: GraphQLInt},
    allowedValues: {type: GraphQLAllowedSettingVals}
  }
})

export const GraphQLUpdateSettingArgs = new GraphQLInputObjectType({
  name: 'UpdateSettingArgs',
  fields: {
    name: {type: new GraphQLNonNull(GraphQLSettingName)},
    value: {type: new GraphQLNonNull(GraphQLSettingValueType)}
  }
})

export const GraphQLSetting = new GraphQLObjectType<Setting, Context>({
  name: 'Setting',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLString)},
    name: {type: new GraphQLNonNull(GraphQLSettingName)},
    value: {type: new GraphQLNonNull(GraphQLSettingValueType)},
    settingRestriction: {type: GraphQLSettingRestriction}
  }
})
