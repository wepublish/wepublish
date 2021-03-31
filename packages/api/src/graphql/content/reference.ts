import {
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLType,
  valueFromASTUntyped,
  GraphQLUnionType
} from 'graphql'
import {Context} from '../../context'
import {ContentModelSchemaFieldRef} from '../../interfaces/contentModelSchema'
import {MediaReferenceType, Reference} from '../../interfaces/referenceType'
import {MapType} from '../../interfaces/utilTypes'
import {createProxyingIsTypeOf, createProxyingResolver} from '../../utility'
import {GraphQLImage} from '../image'
import {GraphQLPeer} from '../peer'
import {nameJoin} from './contentUtils'

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

export const GraphQLUnknown = new GraphQLScalarType({
  name: 'Unknown',
  serialize(value) {
    return null
  },

  parseValue(value) {
    return null
  },

  parseLiteral(literal) {
    return null
  }
})

export const GraphQLReferenceInput = new GraphQLInputObjectType({
  name: 'ref_input',
  fields: {
    recordId: {type: GraphQLNonNull(GraphQLID)},
    contentType: {type: GraphQLNonNull(GraphQLID)},
    peerId: {type: GraphQLID},
    record: {type: GraphQLUnknown},
    peer: {type: GraphQLUnknown}
  }
})

const refTypes: {[type: string]: any} = {}
export function getReference(
  name: string,
  type: ContentModelSchemaFieldRef,
  contentModels?: MapType<GraphQLObjectType>
) {
  const typeKey = Object.keys(type.types).join('_')
  if (typeKey in refTypes) {
    return refTypes[typeKey]
  }

  const typeArray = Object.entries(type.types)
  let graphQLRecordType: GraphQLType = GraphQLUnknown
  if (typeArray.length === 0) {
    throw Error('At least one type should be definied for Reference')
  } else if (typeArray.length === 1) {
    const contentType = typeArray[0][0]
    if (typeArray[0][0] === MediaReferenceType) {
      graphQLRecordType = GraphQLImage
    } else if (contentModels?.[contentType]) {
      graphQLRecordType = contentModels[contentType]
    }
  } else {
    graphQLRecordType = new GraphQLUnionType({
      name,
      types: typeArray.map(([contentType, {scope}]) => {
        let graphQLUnionCase: GraphQLType = GraphQLUnknown
        if (contentType === MediaReferenceType) {
          graphQLUnionCase = GraphQLImage
        } else if (contentModels?.[contentType]) {
          graphQLUnionCase = contentModels[contentType]
        }

        const unionCaseName = nameJoin(name, contentType)
        return new GraphQLObjectType({
          name: unionCaseName,
          fields: {
            [contentType]: {
              type: graphQLUnionCase,
              resolve: source => {
                return source
              }
            }
          },
          isTypeOf: createProxyingIsTypeOf((value: Reference) => {
            return value.contentType === contentType
          })
        })
      })
    })
  }

  refTypes[typeKey] = new GraphQLObjectType<any, Context>({
    name: `ref_${typeKey}`,
    fields: {
      recordId: {type: GraphQLNonNull(GraphQLID)},
      contentType: {type: GraphQLNonNull(GraphQLID)},
      peerId: {type: GraphQLID},
      record: {
        type: graphQLRecordType,
        resolve: createProxyingResolver(async ({contentType, recordId}, _args, {loaders}) => {
          if (recordId && contentType === MediaReferenceType) {
            return loaders.images.load(recordId)
          }
          return loaders.content.load(recordId)
        })
      },
      peer: {
        type: GraphQLPeer,
        resolve: createProxyingResolver(({peerId}, args, {loaders, dbAdapter}) => {
          if (peerId) {
            return loaders.peer.load(peerId)
          }
          return null
        })
      }
    }
  })
  return refTypes[typeKey]
}
