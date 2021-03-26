import {
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  valueFromASTUntyped
} from 'graphql'
import {ContentModelSchemaFieldRef} from '../interfaces/contentModelSchema'

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

export const GraphQLAny = new GraphQLScalarType({
  name: 'Any',
  serialize(value) {
    return null
  },

  parseValue(value) {
    return value
  },

  parseLiteral(literal) {
    const obj = valueFromASTUntyped(literal)
    return obj
  }
})

export const GraphQLReferenceInput = new GraphQLInputObjectType({
  name: 'ref_input',
  fields: {
    recordId: {type: GraphQLNonNull(GraphQLID)},
    contentType: {type: GraphQLNonNull(GraphQLID)},
    peerId: {type: GraphQLID},
    record: {type: GraphQLAny},
    peer: {type: GraphQLAny}
  }
})

const refTypes: {[type: string]: any} = {}
export function getReference(type: ContentModelSchemaFieldRef) {
  const typeKey = type.types.map(t => t.identifier + t.scope).join('_')
  if (typeKey in refTypes) {
    return refTypes[typeKey]
  }
  refTypes[typeKey] = new GraphQLObjectType({
    name: `ref_${typeKey}`,
    fields: {
      recordId: {type: GraphQLNonNull(GraphQLID)},
      contentType: {type: GraphQLNonNull(GraphQLID)},
      peerId: {type: GraphQLID},
      record: {type: GraphQLAny},
      peer: {type: GraphQLAny}
    },
    resolveObject: () => {
      return null
    }
  })
  return refTypes[typeKey]
}
