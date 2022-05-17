import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLEnumType,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLScalarType,
  GraphQLInputObjectType,
  GraphQLID
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

export const GraphQLSettingInput = new GraphQLInputObjectType({
  name: 'SettingInput',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    type: {type: GraphQLNonNull(GraphQLSettingType)},
    value: {type: GraphQLSettingValueType}
  }
})

export const GraphQLSetting = new GraphQLObjectType<Setting, Context>({
  name: 'Setting',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    name: {type: GraphQLNonNull(GraphQLString)},
    settingType: {type: GraphQLNonNull(GraphQLSettingType)},
    value: {type: GraphQLSettingValueType}
  }
})
