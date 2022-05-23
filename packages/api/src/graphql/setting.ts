import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLEnumType,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLScalarType,
  GraphQLInputObjectType,
  GraphQLID,
  GraphQLList
} from 'graphql'

import {Context} from '../context'
import {Setting} from '../db/setting'

export const GraphQLSettingValueType = new GraphQLScalarType({
  name: 'value',
  serialize(value) {
    return value
  }
})

export const GraphQLSettingType = new GraphQLEnumType({
  name: 'SettingType',
  values: {
    switch: {value: GraphQLBoolean},
    multiSelect: {value: GraphQLString},
    input: {value: GraphQLString},
    number: {value: GraphQLInt}
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
    name: {type: GraphQLNonNull(GraphQLString)},
    value: {type: GraphQLSettingValueType},
    settingRestriction: {type: GraphQLSettingRestrictionInput}
  }
})

export const GraphQLSetting = new GraphQLObjectType<Setting, Context>({
  name: 'Setting',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    name: {type: GraphQLNonNull(GraphQLString)},
    value: {type: GraphQLSettingValueType},
    settingRestriction: {type: GraphQLSettingRestriction}
  }
})
