import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInt,
  GraphQLScalarType,
  GraphQLInputObjectType,
  GraphQLID,
  GraphQLList,
  GraphQLEnumType,
  GraphQLBoolean
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
  values: Object.fromEntries(Object.keys(SettingName).map(key => [key, {value: SettingName[key]}]))
})

export const GraphQLAllowedSettingVals = new GraphQLObjectType({
  name: 'AllowedSettingVals',
  fields: {
    stringChoice: {type: new GraphQLList(GraphQLString)},
    boolChoice: {type: GraphQLBoolean}
  }
})

export const GraphQLInputAllowedSettingVals = new GraphQLInputObjectType({
  name: 'AllowedSettingValsInput',
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

export const GraphQLSettingRestrictionInput = new GraphQLInputObjectType({
  name: 'SettingRestrictionInput',
  fields: {
    maxValue: {type: GraphQLInt},
    minValue: {type: GraphQLInt},
    inputLength: {type: GraphQLInt},
    allowedValues: {type: new GraphQLList(GraphQLInputAllowedSettingVals)}
  }
})

export const GraphQLSettingInput = new GraphQLInputObjectType({
  name: 'SettingInput',
  fields: {
    value: {type: GraphQLSettingValueType}
  }
})

export const GraphQLUpdateSettingArgs = new GraphQLInputObjectType({
  name: 'UpdateSettingArgs',
  fields: {
    name: {type: new GraphQLNonNull(GraphQLSettingName)},
    value: {type: new GraphQLNonNull(GraphQLSettingValueType)}
  }
})

export const GraphQLSettingsInput = new GraphQLInputObjectType({
  name: 'SettingsInput',
  fields: {
    value: {type: new GraphQLList(GraphQLUpdateSettingArgs)}
  }
})

export const GraphQLSetting = new GraphQLObjectType<Setting, Context>({
  name: 'Setting',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    name: {type: new GraphQLNonNull(GraphQLSettingName)},
    value: {type: new GraphQLNonNull(GraphQLSettingValueType)},
    settingRestriction: {type: GraphQLSettingRestriction}
  }
})
