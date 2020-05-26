import {GraphQLScalarType, valueFromAST, GraphQLString, GraphQLNonNull} from 'graphql'

const ColorRegexp = /^#[A-Fa-f0-9]{6}$/g

export const GraphQLColor = new GraphQLScalarType({
  name: 'Color',
  description: 'A hexidecimal color value.',
  serialize(value) {
    return value
  },

  parseValue(value) {
    if (typeof value != 'string') throw new Error()
    if (!value.match(ColorRegexp)) throw new Error('Invalid hex color string.')

    return value
  },

  parseLiteral(literal) {
    const value: string = valueFromAST(literal, GraphQLNonNull(GraphQLString))
    if (!value.match(ColorRegexp)) throw new Error('Invalid hex color string.')
    return value
  }
})
