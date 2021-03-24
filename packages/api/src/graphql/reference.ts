import {GraphQLScalarType} from 'graphql'

export const GraphQLReference = new GraphQLScalarType({
  name: 'Reference',
  serialize(value) {
    return value
  },

  parseValue(value) {
    return value
  },

  parseLiteral(literal) {
    return null
  }
})
