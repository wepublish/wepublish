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
    OAUTH_GOOGLE_DISCOVERY_URL: {value: SettingName.OAUTH_GOOGLE_DISCOVERY_URL},
    OAUTH_GOOGLE_CLIENT_ID: {value: SettingName.OAUTH_GOOGLE_CLIENT_ID},
    OAUTH_GOOGLE_CLIENT_KEY: {value: SettingName.OAUTH_GOOGLE_CLIENT_KEY},
    OAUTH_GOOGLE_REDIRECT_URL: {value: SettingName.OAUTH_GOOGLE_REDIRECT_URL},
    SEND_LOGIN_JWT_EXPIRES_MIN: {value: SettingName.SEND_LOGIN_JWT_EXPIRES_MIN},
    INVOICE_REMINDER_FREQ: {value: SettingName.INVOICE_REMINDER_FREQ},
    INVOICE_REMINDER_MAX_TRIES: {value: SettingName.INVOICE_REMINDER_MAX_TRIES},
    MONGO_LOCALE: {value: SettingName.MONGO_LOCALE},
    RESET_PASSWORD_JWT_EXPIRES_MIN: {value: SettingName.RESET_PASSWORD_JWT_EXPIRES_MIN},
    JWT_SECRET_KEY: {value: SettingName.JWT_SECRET_KEY}
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
