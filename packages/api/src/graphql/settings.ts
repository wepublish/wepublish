import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInputObjectType,
  GraphQLID
} from 'graphql'

import {GraphQLImage} from './image'

import {Settings} from '../db/settings'
import {Context} from '../context'
import {GraphQLColor} from './color'

export const GraphQLSettings = new GraphQLObjectType<Settings, Context>({
  name: 'Settings',
  fields: {
    logo: {
      type: GraphQLImage,
      resolve(setting, args, {loaders}) {
        return setting.logoID && loaders.images.load(setting.logoID)
      }
    },

    conanicalURL: {type: GraphQLNonNull(GraphQLString)},
    apiURL: {type: GraphQLNonNull(GraphQLString)},
    themeColor: {type: GraphQLNonNull(GraphQLColor)},

    defaultImage: {
      type: GraphQLImage,
      resolve(setting, args, {loaders}) {
        return setting.defaultImageID && loaders.images.load(setting.defaultImageID)
      }
    },

    defaultDescription: {type: GraphQLString}
  }
})

export const GraphQLSettingsInput = new GraphQLInputObjectType({
  name: 'SettingsInput',
  fields: {
    logoID: {type: GraphQLID},
    conanicalURL: {type: GraphQLNonNull(GraphQLString)},
    apiURL: {type: GraphQLNonNull(GraphQLString)},
    themeColor: {type: GraphQLNonNull(GraphQLColor)},

    defaultImageID: {type: GraphQLID},
    defaultDescription: {type: GraphQLString}
  }
})
