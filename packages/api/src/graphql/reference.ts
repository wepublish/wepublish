import {GraphQLScalarType, valueFromASTUntyped} from 'graphql'

export const GraphQLReference = new GraphQLScalarType({
  name: 'Reference',
  serialize(value) {
    return value
  },

  parseValue(value) {
    return value
  },

  parseLiteral(literal) {
    const obj = valueFromASTUntyped(literal)
    return obj
  }
})
