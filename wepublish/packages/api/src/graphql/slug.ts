import {GraphQLScalarType, valueFromAST, GraphQLString} from 'graphql'
import {slugify} from '../utility'

export const GraphQLSlug = new GraphQLScalarType({
  name: 'Slug',
  serialize(value) {
    return value
  },

  parseValue(value) {
    if (typeof value != 'string') throw new Error()
    return slugify(value)
  },

  parseLiteral(literal) {
    const value: string | undefined = valueFromAST(literal, GraphQLString)
    if (value == undefined) throw new Error()
    return slugify(value)
  }
})
