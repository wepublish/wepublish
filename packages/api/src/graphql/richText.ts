import {GraphQLScalarType} from 'graphql'

// TODO: Validation / Normalization
export const GraphQLRichText = new GraphQLScalarType({
  name: 'RichText',
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
