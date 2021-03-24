import {GraphQLScalarType, valueFromASTUntyped} from 'graphql'

export const GraphQLContentModelSchema = new GraphQLScalarType({
  name: 'ContentModelSchema',
  serialize(value) {
    return value
  },

  parseValue(value) {
    return value
  },

  parseLiteral(literal) {
    return valueFromASTUntyped(literal)
  }
})
