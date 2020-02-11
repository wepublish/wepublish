import {GraphQLScalarType} from 'graphql'

// TODO: Validation / Normalization
export const GraphQLSlug = new GraphQLScalarType({
  name: 'Slug',
  serialize(value) {
    return value
  },

  parseValue(value) {
    return value
  },

  parseLiteral(value) {
    return value
  }
})
