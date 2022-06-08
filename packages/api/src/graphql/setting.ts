import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInt,
  GraphQLScalarType,
  GraphQLInputObjectType,
  GraphQLID,
  GraphQLList,
  GraphQLEnumType
} from 'graphql'

import {Context} from '../context'
import {Setting, SettingName} from '../db/setting'

export const GraphQLSettingValueType = new GraphQLScalarType({
  name: 'Value',
  serialize(Value) {
    return Value
  }
})

export const GraphQLSettingName = new GraphQLEnumType({
  name: 'SettingName',
  values: {
    DEFAULT: {value: SettingName.DEFAULT},
    ALLOW_GUEST_COMMENTING: {value: SettingName.ALLOW_GUEST_COMMENTING},
    SEND_LOGIN_JWT_EXPIRES_MIN: {value: SettingName.SEND_LOGIN_JWT_EXPIRES_MIN},
    RESET_PASSWORD_JWT_EXPIRES_MIN: {value: SettingName.RESET_PASSWORD_JWT_EXPIRES_MIN},
    PEERING_TIMEOUT_MS: {value: SettingName.PEERING_TIMEOUT_MS}
  }
})

export const GraphQLSettingRestriction = new GraphQLObjectType({
  name: 'SettingRestriction',
  fields: {
    maxValue: {type: GraphQLInt},
    minValue: {type: GraphQLInt},
    inputLength: {type: GraphQLInt},
    allowedValues: {type: GraphQLList(GraphQLString)}
  }
})

export const GraphQLSettingRestrictionInput = new GraphQLInputObjectType({
  name: 'SettingRestrictionInput',
  fields: {
    maxValue: {type: GraphQLInt},
    minValue: {type: GraphQLInt},
    inputLength: {type: GraphQLInt},
    allowedValues: {type: GraphQLList(GraphQLString)}
  }
})

export const GraphQLSettingInput = new GraphQLInputObjectType({
  name: 'SettingInput',
  fields: {
    value: {type: GraphQLSettingValueType}
  }
})

export const GraphQLSetting = new GraphQLObjectType<Setting, Context>({
  name: 'Setting',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    name: {type: GraphQLNonNull(GraphQLSettingName)},
    value: {type: GraphQLSettingValueType},
    settingRestriction: {type: GraphQLSettingRestriction}
  }
})
