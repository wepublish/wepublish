import {GraphQLScalarType, Kind, valueFromASTUntyped} from 'graphql'

export function GraphQLStringLiteral(stringLiteral: string) {
  if (!stringLiteral.match(/^[_a-zA-Z][_a-zA-Z0-9]*$/)) {
    throw new TypeError(
      `String literal must match /^[_a-zA-Z][_a-zA-Z0-9]*$/ but "${stringLiteral}" does not.`
    )
  }

  const name = `StringLiteral_${stringLiteral}`

  return new GraphQLScalarType({
    name,
    description: `A literal string with the value "${stringLiteral}".`,

    serialize(value: unknown) {
      if (typeof value !== 'string') {
        throw new TypeError(`${name} cannot be serialized from a non string.`)
      }

      if (value !== stringLiteral) {
        throw new TypeError(`${name} value must be equal to "${stringLiteral}", found: "${value}".`)
      }

      return value
    },

    parseValue(value: unknown) {
      if (typeof value !== 'string') {
        throw new TypeError(`${name} cannot represent non string type ${JSON.stringify(value)}.`)
      }

      if (value !== stringLiteral) {
        throw new TypeError(`${name} value must be equal to "${stringLiteral}", found: "${value}".`)
      }

      return value
    },

    parseLiteral(ast) {
      if (ast.kind !== Kind.STRING) {
        throw new TypeError(
          `${name} cannot represent non string type ${JSON.stringify(valueFromASTUntyped(ast))}.`
        )
      }

      const {value} = ast

      if (value !== stringLiteral) {
        throw new TypeError(`${name} value must be equal to "${stringLiteral}", found: "${value}".`)
      }

      return value
    }
  })
}
