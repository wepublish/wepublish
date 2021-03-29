import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLEnumValueConfigMap,
  GraphQLFieldConfigMap,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLString,
  GraphQLUnionType
} from 'graphql'
import {GraphQLRichText} from '../richText'
import {GraphQLDateTime} from 'graphql-iso-date'
import {LanguageConfig} from '../../interfaces/languageConfig'
import {getReference, GraphQLReferenceInput} from '../reference'
import {DBContentState} from '../../db/content'
import {createProxyingIsTypeOf} from '../../utility'
import {
  ContentModelSchema,
  ContentModelSchemaFieldLeaf,
  ContentModelSchemas,
  ContentModelSchemaTypes
} from '../../interfaces/contentModelSchema'
import {Context} from '../../context'
import {GraphQLPageInfo} from '../common'
import {GraphQLPeer} from '../peer'
import {getI18nOutputType, getI18nInputType} from '../i18nPrimitives'

export interface PeerArticle {
  peerID: string
  content: any
}

export const GraphQLContentSateEnum = new GraphQLEnumType({
  name: 'ContentStateEnum',
  values: Object.keys(DBContentState).reduce((accu, item) => {
    accu[item] = {
      value: item
    }
    return accu
  }, {} as GraphQLEnumValueConfigMap)
})

export function generateSchema(
  languageConfig: LanguageConfig,
  identifier: string,
  contentModelSchema: ContentModelSchema
) {
  const baseFields: GraphQLFieldConfigMap<unknown, unknown, unknown> = {
    id: {type: GraphQLNonNull(GraphQLID)},
    contentType: {type: GraphQLNonNull(GraphQLString)},
    revision: {type: GraphQLNonNull(GraphQLInt)},
    state: {type: GraphQLNonNull(GraphQLContentSateEnum)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    publicationDate: {type: GraphQLDateTime},
    dePublicationDate: {type: GraphQLDateTime},

    title: {type: GraphQLNonNull(GraphQLString)},
    shared: {type: GraphQLNonNull(GraphQLBoolean)}
  }
  return new GraphQLObjectType({
    name: identifier,
    fields: Object.entries(contentModelSchema).reduce((accu, [key, val]) => {
      const schema = generateType(
        {
          language: languageConfig,
          isInput: false
        },
        {
          type: ContentModelSchemaTypes.object,
          fields: val
        },
        nameJoin(identifier, key)
      )
      accu[`${key}`] = {
        type: schema
      }
      return accu
    }, baseFields)
  })
}

export function generateInputSchema(
  languageConfig: LanguageConfig,
  identifier: string,
  contentModelSchema: ContentModelSchema
) {
  const content = Object.entries(contentModelSchema).reduce((accu, [key, val]) => {
    const schema = generateType(
      {
        language: languageConfig,
        isInput: true
      },
      {
        type: ContentModelSchemaTypes.object,
        fields: val
      },
      nameJoin(identifier, key)
    )
    accu[key] = {
      type: schema
    }
    return accu
  }, {} as GraphQLInputFieldConfigMap)
  return {
    create: new GraphQLInputObjectType({
      name: nameJoin(identifier, 'create'),
      fields: {
        title: {type: GraphQLNonNull(GraphQLString)},
        shared: {type: GraphQLNonNull(GraphQLBoolean)},
        ...content
      }
    }),
    update: new GraphQLInputObjectType({
      name: nameJoin(identifier, 'update'),
      fields: {
        id: {type: GraphQLNonNull(GraphQLID)},
        title: {type: GraphQLNonNull(GraphQLString)},
        shared: {type: GraphQLNonNull(GraphQLBoolean)},
        ...content
      }
    })
  }
}

export const ContentModelPrefix = '_cm'
export const ContentModelPrefixPrivate = '_cmp'
export const ContentModelPrefixPrivateInput = '_cmpi'
const SEPARATOR = '_'

export function nameJoin(...slug: string[]) {
  return slug.join(SEPARATOR)
}

interface GenerateTypeConfig {
  language: LanguageConfig
  isInput: boolean
}

function getLeaf(
  config: GenerateTypeConfig,
  contentModelSchemas: ContentModelSchemas,
  graphQLType: GraphQLInputType | GraphQLOutputType
) {
  if ((contentModelSchemas as ContentModelSchemaFieldLeaf).i18n) {
    if (config.isInput) {
      return getI18nInputType(graphQLType as GraphQLInputType, config.language)
    } else {
      return getI18nOutputType(graphQLType as GraphQLOutputType, config.language)
    }
  }
  return graphQLType
}

function generateType(
  config: GenerateTypeConfig,
  contentModelSchemas: ContentModelSchemas,
  name: string = ''
) {
  let type: any

  switch (contentModelSchemas.type) {
    case ContentModelSchemaTypes.id:
      type = getLeaf(config, contentModelSchemas, GraphQLID)
      break
    case ContentModelSchemaTypes.string:
      type = getLeaf(config, contentModelSchemas, GraphQLString)
      break
    case ContentModelSchemaTypes.boolean:
      type = getLeaf(config, contentModelSchemas, GraphQLBoolean)
      break
    case ContentModelSchemaTypes.int:
      type = getLeaf(config, contentModelSchemas, GraphQLInt)
      break
    case ContentModelSchemaTypes.float:
      type = getLeaf(config, contentModelSchemas, GraphQLFloat)
      break
    case ContentModelSchemaTypes.dateTime:
      type = getLeaf(config, contentModelSchemas, GraphQLDateTime)
      break
    case ContentModelSchemaTypes.list:
      type = GraphQLList(generateType(config, contentModelSchemas.contentType, name))
      break
    case ContentModelSchemaTypes.union:
      // Let's evaluate and maybe switch to the new tagged type https://github.com/graphql/graphql-spec/pull/733
      if (config.isInput) {
        type = new GraphQLInputObjectType({
          name,
          fields: Object.entries(contentModelSchemas.cases).reduce((accu, [key, val]) => {
            val.required = false
            accu[`${key}`] = {
              type: generateType(config, val, nameJoin(name, key))
            }
            return accu
          }, {} as GraphQLInputFieldConfigMap)
        })
      } else {
        type = new GraphQLUnionType({
          name,
          types: Object.entries(contentModelSchemas.cases).map(([unionCase, val]) => {
            const unionCaseName = nameJoin(name, unionCase)
            return new GraphQLObjectType({
              name: unionCaseName,
              fields: {
                [unionCase]: {
                  type: new GraphQLObjectType({
                    name: nameJoin(unionCaseName, 'content'),
                    fields: Object.entries(val.fields).reduce((accu, [key, val]) => {
                      accu[`${key}`] = {
                        type: generateType(config, val, nameJoin(unionCaseName, key)),
                        deprecationReason: val.deprecationReason
                      }
                      return accu
                    }, {} as GraphQLFieldConfigMap<unknown, unknown, unknown>)
                  })
                }
              },
              isTypeOf: createProxyingIsTypeOf((value: any) => {
                return Object.keys(value)[0] === unionCase
              })
            })
          })
        })
      }

      break
    case ContentModelSchemaTypes.enum:
      type = new GraphQLEnumType({
        name,
        values: contentModelSchemas.values.reduce((accu, item) => {
          accu[`${item.value}`] = {value: item.value, description: item.description}
          return accu
        }, {} as GraphQLEnumValueConfigMap)
      })
      break
    case ContentModelSchemaTypes.object:
      if (config.isInput) {
        type = new GraphQLInputObjectType({
          name,
          fields: Object.entries(contentModelSchemas.fields).reduce((accu, [key, val]) => {
            accu[`${key}`] = {
              type: generateType(config, val, nameJoin(name, key))
            }
            return accu
          }, {} as GraphQLInputFieldConfigMap)
        })
      } else {
        type = new GraphQLObjectType({
          name,
          fields: Object.entries(contentModelSchemas.fields).reduce((accu, [key, val]) => {
            accu[`${key}`] = {
              type: generateType(config, val, nameJoin(name, key)),
              deprecationReason: val.deprecationReason
            }
            return accu
          }, {} as GraphQLFieldConfigMap<unknown, unknown, unknown>)
        })
      }
      break

    case ContentModelSchemaTypes.richText:
      type = getLeaf(config, contentModelSchemas, GraphQLRichText)
      break

    case ContentModelSchemaTypes.reference:
      if (config.isInput) {
        type = getLeaf(config, contentModelSchemas, GraphQLReferenceInput)
      } else {
        type = getLeaf(config, contentModelSchemas, getReference(contentModelSchemas))
      }
      break
  }
  if (contentModelSchemas.required) {
    type = GraphQLNonNull(type)
  }
  return type
}

export function getGraphQLContentConnection(parentName: string, content: GraphQLObjectType) {
  return new GraphQLObjectType({
    name: `${parentName}Connection`,
    fields: {
      nodes: {
        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(content)))
      },
      pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
      totalCount: {type: GraphQLNonNull(GraphQLInt)}
    }
  })
}

export function getGraphQLPeerCustomContent(parentName: string, content?: any) {
  return new GraphQLObjectType<any, Context>({
    name: `${parentName}PeerCustomContent`,
    fields: {
      peer: {
        type: GraphQLPeer,
        resolve: ({peerID}, {}, {loaders}) => {
          if (peerID) {
            return loaders.peer.load(peerID)
          }
          return null
        }
      },
      content: {type: GraphQLNonNull(content)}
    }
  })
}
