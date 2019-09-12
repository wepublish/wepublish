import {
  GraphQLScalarType,
  coerceValue,
  GraphQLInputObjectType,
  Kind,
  valueFromASTUntyped,
  valueFromAST,
  isValidLiteralValue
} from 'graphql'

import Maybe from 'graphql/tsutils/Maybe'

export interface GraphQLUnionInputTypeConfig {
  name: string
  typeMap: Record<string, GraphQLInputObjectType>
  discriminatingField: string
}

export function GraphQLUnionInputType({
  name,
  typeMap,
  discriminatingField
}: GraphQLUnionInputTypeConfig) {
  return new GraphQLScalarType({
    name,
    description: `A union of GraphQLInputObjectTypes: ${JSON.stringify(
      Object.values(typeMap).map(type => type.name)
    )}`,

    serialize(value: unknown) {
      return value
    },

    parseValue(value: unknown) {
      const typeKey: string =
        typeof value === 'object' && value ? (value as any)[discriminatingField] : null

      if (!typeKey) {
        throw new TypeError(
          `${name} couldn't resolve discriminating field "${discriminatingField}" from value: ${JSON.stringify(
            value
          )}.`
        )
      }

      const type = typeMap[typeKey]

      if (!type) {
        throw new TypeError(
          `${name} resolved type "${typeKey}" doesn't match types: ${JSON.stringify(
            Object.keys(typeMap)
          )}.`
        )
      }

      const {value: coercedValue, errors} = coerceValue(value, type)

      if (errors) throw errors[0]

      return coercedValue
    },

    parseLiteral(ast) {
      if (ast.kind !== Kind.OBJECT) {
        throw new TypeError(
          `${name} cannot parse non object type ${JSON.stringify(valueFromASTUntyped(ast))}.`
        )
      }

      const field = ast.fields.find(field => field.name.value === discriminatingField)

      if (!field) {
        throw new TypeError(
          `${name} cannot find discriminating field "${discriminatingField}" in ${JSON.stringify(
            valueFromASTUntyped(ast)
          )}.`
        )
      }

      const typeKey = field.value

      if (typeKey.kind !== Kind.STRING) {
        throw new TypeError(
          `${name} discriminating field "${discriminatingField}" must be of string type, found "${valueFromASTUntyped(
            typeKey
          )}".`
        )
      }

      const type = typeMap[typeKey.value]

      if (!type) {
        throw new TypeError(
          `${name} resolved type "${typeKey.value}" doesn't match types: ${JSON.stringify(
            Object.keys(typeMap)
          )}.`
        )
      }

      const foo = valueFromAST(ast, type)

      console.log(isValidLiteralValue(type, ast))

      return valueFromAST(ast, type)
    }
  })
}
