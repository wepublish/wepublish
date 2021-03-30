import {
  ArgumentNode,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLEnumValueConfigMap,
  GraphQLFieldConfigMap,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  Kind
} from 'graphql'
import {GraphQLDateTime} from 'graphql-iso-date'
import {Context, ContextOptions} from '../../context'
import {InputCursor, Limit, SortOrder} from '../../db/common'
import {SessionType} from '../../db/session'
import {NotAuthorisedError} from '../../error'
import {GraphQLContentSateEnum} from './contentUtils'
import {
  GraphQLArticleFilter,
  GraphQLArticleSort,
  GraphQLPublicArticleFilter,
  GraphQLPublicArticleSort
} from '../article'
import {GraphQLPageInfo, GraphQLSortOrder} from '../common'
import {
  authorise,
  CanDeleteArticle,
  CanGetArticle,
  CanGetArticles,
  CanGetPeerArticle,
  CanGetPeerArticles,
  CanGetSharedArticle,
  CanGetSharedArticles,
  isAuthorised
} from '../permissions'
import {getGraphQLContentConnection, getGraphQLPeerCustomContent} from './contentUtils'
import {CustomContentSort} from './contentInterfaces'
import {GraphQLContentModelSchema} from '../contentModelSchema'

import {
  base64Decode,
  base64Encode,
  createProxyingResolver,
  delegateToPeerSchema
} from '../../utility'
import {GraphQLSlug} from '../slug'
import {WrapQuery} from 'graphql-tools'
import {ArticleSort} from '../../db/article'
import {
  generateInputSchema,
  generateSchema,
  nameJoin,
  ContentModelPrefix,
  ContentModelPrefixPrivate,
  ContentModelPrefixPrivateInput
} from './contentUtils'
import {MapType} from '../../interfaces/utilTypes'

export interface PeerArticle {
  peerID: string
  content: any
}

export function getGraphQLCustomContent<TSource, TContext, TArgs>(contextOptions: ContextOptions) {
  let query: GraphQLFieldConfigMap<any, Context, any> = {}
  let queryPublic: GraphQLFieldConfigMap<any, Context, any> = {}
  let mutation: GraphQLFieldConfigMap<any, Context, any> = {}

  const contentModelsPrivate: MapType<GraphQLObjectType> = {}
  const contentModelsPublic: MapType<GraphQLObjectType> = {}

  contextOptions.contentModels.forEach(item => {
    const idPublic = nameJoin(ContentModelPrefix, item.identifier)
    const idPrivate = nameJoin(ContentModelPrefixPrivate, item.identifier)
    const idPrivateInput = nameJoin(ContentModelPrefixPrivateInput, item.identifier)
    const typePublic = generateSchema(
      contextOptions.languageConfig,
      item.identifier,
      nameJoin(idPublic, 'record'),
      item.schema,
      contentModelsPublic
    )
    const typePrivate = generateSchema(
      contextOptions.languageConfig,
      item.identifier,
      nameJoin(idPrivate, 'record'),
      item.schema,
      contentModelsPrivate
    )
    const {create: inputTypeCreate, update: inputTypeUpdate} = generateInputSchema(
      contextOptions.languageConfig,
      nameJoin(idPrivateInput, 'record'),
      item.schema
    )

    // ************************************************************************************************************************
    // Public Query
    queryPublic[item.identifier] = {
      type: GraphQLNonNull(
        new GraphQLObjectType<undefined, Context>({
          name: idPublic,
          fields: {
            read: {
              type: typePublic,
              args: {id: {type: GraphQLID}},
              async resolve(root, {id}, {session, loaders}) {
                const article = await loaders.publicContent.load(id)

                if (session?.type === SessionType.Token) {
                  return article?.shared ? article : null
                }

                return article
              }
            },

            list: {
              type: GraphQLNonNull(
                new GraphQLObjectType({
                  name: nameJoin(idPublic, 'list'),
                  fields: {
                    nodes: {
                      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(typePrivate)))
                    },
                    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
                    totalCount: {type: GraphQLNonNull(GraphQLInt)}
                  }
                })
              ),
              args: {
                after: {type: GraphQLID},
                before: {type: GraphQLID},
                first: {type: GraphQLInt},
                last: {type: GraphQLInt},
                filter: {type: GraphQLPublicArticleFilter},
                sort: {
                  type: GraphQLPublicArticleSort,
                  defaultValue: CustomContentSort.PublishedAt
                },
                order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
              },
              resolve(root, {filter, sort, order, after, before, first, last}, {dbAdapter}) {
                return dbAdapter.content.getContents({
                  type: item.identifier,
                  filter,
                  sort,
                  order,
                  cursor: InputCursor(after, before),
                  limit: Limit(first, last)
                })
              }
            }
          }
        })
      ),
      resolve: () => {
        return {}
      }
    }

    // ************************************************************************************************************************
    // Private Mutation
    mutation[item.identifier] = {
      type: GraphQLNonNull(
        new GraphQLObjectType<undefined, Context>({
          name: idPrivateInput,
          fields: {
            create: {
              type: GraphQLNonNull(typePrivate),
              args: {
                input: {
                  type: GraphQLNonNull(inputTypeCreate)
                }
              },
              async resolve(root, {input}, {business}) {
                return business.createContent(item.identifier, input)
              }
            },

            update: {
              type: GraphQLNonNull(typePrivate),
              args: {
                input: {
                  type: GraphQLNonNull(inputTypeUpdate)
                }
              },
              async resolve(root, {input}, {business}) {
                return business.updateContent(item.identifier, input)
              }
            },

            delete: {
              type: GraphQLNonNull(GraphQLBoolean),
              args: {
                id: {type: GraphQLNonNull(GraphQLID)},
                revision: {type: GraphQLInt}
              },
              async resolve(root, {id, revision}, {business}) {
                return business.deleteContent(id)
              }
            },

            publish: {
              type: typePrivate,
              args: {
                id: {type: GraphQLNonNull(GraphQLID)},
                revision: {type: GraphQLNonNull(GraphQLInt)},
                publishAt: {type: GraphQLDateTime},
                updatedAt: {type: GraphQLDateTime},
                publishedAt: {type: GraphQLDateTime}
              },
              async resolve(root, {id, revision, publishAt, updatedAt, publishedAt}, {business}) {
                return business.publishContent(id, revision, publishAt, updatedAt, publishedAt)
              }
            },

            unpublish: {
              type: typePrivate,
              args: {id: {type: GraphQLNonNull(GraphQLID)}},
              async resolve(root, {id, revision}, {business}) {
                return business.unpublishContent(id, revision)
              }
            }
          }
        })
      ),
      resolve: () => {
        return {}
      }
    }

    // ************************************************************************************************************************
    // Private Query
    query[item.identifier] = {
      type: GraphQLNonNull(
        new GraphQLObjectType<undefined, Context>({
          name: idPrivate,
          fields: {
            read: {
              type: GraphQLNonNull(typePrivate),
              args: {
                peerID: {type: GraphQLID},
                id: {type: GraphQLNonNull(GraphQLID)}
              },
              async resolve(root, {peerID, id}, context, info) {
                if (peerID) {
                  const {authenticate} = context
                  const {roles} = authenticate()

                  authorise(CanGetPeerArticle, roles)

                  return delegateToPeerSchema(peerID, true, context, {
                    fieldName: `content`,
                    args: {id},
                    info,
                    transforms: [
                      new WrapQuery(
                        ['content'],
                        subtree => ({
                          kind: Kind.SELECTION_SET,
                          selections: [
                            {
                              kind: Kind.FIELD,
                              name: {
                                kind: Kind.NAME,
                                value: item.identifier
                              },
                              selectionSet: {
                                kind: Kind.SELECTION_SET,
                                selections: [
                                  {
                                    kind: Kind.FIELD,
                                    name: {kind: Kind.NAME, value: 'read'},
                                    arguments: [
                                      {
                                        kind: Kind.ARGUMENT,
                                        name: {kind: Kind.NAME, value: 'id'},
                                        value: {kind: Kind.STRING, value: id}
                                      }
                                    ],
                                    selectionSet: subtree
                                  }
                                ]
                              }
                            }
                          ]
                        }),
                        result => {
                          return result[item.identifier].read
                        }
                      )
                    ]
                  })
                }

                const {authenticate, loaders} = context
                const {roles} = authenticate()

                const canGetArticle = isAuthorised(CanGetArticle, roles)
                const canGetSharedArticle = isAuthorised(CanGetSharedArticle, roles)

                if (canGetArticle || canGetSharedArticle) {
                  const article = await loaders.content.load(id)

                  if (canGetArticle) {
                    return article
                  } else {
                    return article?.shared ? article : null
                  }
                } else {
                  throw new NotAuthorisedError()
                }
              }
            },
            list: {
              type: GraphQLNonNull(getGraphQLContentConnection(idPrivate, typePrivate)),
              args: {
                after: {type: GraphQLID},
                before: {type: GraphQLID},
                first: {type: GraphQLInt},
                last: {type: GraphQLInt},
                filter: {type: GraphQLArticleFilter},
                sort: {type: GraphQLArticleSort, defaultValue: CustomContentSort.ModifiedAt},
                order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
              },
              resolve(
                root,
                {filter, sort, order, after, before, first, last},
                {authenticate, dbAdapter}
              ) {
                const {roles} = authenticate()
                const canGetArticles = isAuthorised(CanGetArticles, roles)
                const canGetSharedArticles = isAuthorised(CanGetSharedArticles, roles)
                if (!(canGetArticles || canGetSharedArticles)) {
                  throw new NotAuthorisedError()
                }

                return dbAdapter.content.getContents({
                  type: item.identifier,
                  filter: {...filter, shared: !canGetArticles ? true : undefined},
                  sort,
                  order,
                  cursor: InputCursor(after, before),
                  limit: Limit(first, last)
                })
              }
            }
          }
        })
      ),
      resolve: () => {
        return {}
      }
    }
  })

  const GraphQLContentTypeEnum = new GraphQLEnumType({
    name: 'contentTypeEnum',
    values: contextOptions.contentModels.reduce((accu, item) => {
      accu[`${item.identifier}`] = {
        value: item.identifier
      }
      return accu
    }, {} as GraphQLEnumValueConfigMap)
  })

  const GraphQLContentContextEnum = new GraphQLEnumType({
    name: 'contentContextEnum',
    values: {
      local: {value: 'local'},
      peers: {value: 'peers'}
    }
  })

  const GraphQLContentModelSummary = new GraphQLObjectType<any, Context>({
    name: `ContentModelSummary`,
    fields: {
      id: {type: GraphQLNonNull(GraphQLID)},
      title: {type: GraphQLNonNull(GraphQLString)},
      shared: {type: GraphQLNonNull(GraphQLBoolean)},
      contentType: {type: GraphQLNonNull(GraphQLContentTypeEnum)},
      revision: {type: GraphQLNonNull(GraphQLInt)},
      state: {type: GraphQLNonNull(GraphQLContentSateEnum)},

      createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
      modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

      publicationDate: {type: GraphQLDateTime},
      dePublicationDate: {type: GraphQLDateTime}
    }
  })
  query['_all'] = {
    type: GraphQLNonNull(
      new GraphQLObjectType<undefined, Context>({
        name: `All`,
        fields: {
          list: {
            type: GraphQLNonNull(
              getGraphQLContentConnection(
                'listByType',
                getGraphQLPeerCustomContent('listByType', GraphQLContentModelSummary)
              )
            ),
            args: {
              type: {type: GraphQLNonNull(GraphQLContentTypeEnum)},
              context: {type: GraphQLContentContextEnum},
              after: {type: GraphQLID},
              before: {type: GraphQLID},
              first: {type: GraphQLInt},
              last: {type: GraphQLInt},
              filter: {type: GraphQLArticleFilter},
              sort: {type: GraphQLArticleSort, defaultValue: CustomContentSort.ModifiedAt},
              order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
            },
            async resolve(
              root,
              {type, filter, sort, order, context: argContext, after, before, first, last},
              context,
              info
            ) {
              const {authenticate, loaders, dbAdapter} = context

              if (argContext && argContext === 'peers') {
                const {roles} = authenticate()

                authorise(CanGetPeerArticles, roles)

                after = after ? JSON.parse(base64Decode(after)) : null

                const peers = await dbAdapter.peer.getPeers()

                for (const peer of peers) {
                  // Prime loader cache so we don't need to refetch inside `delegateToPeerSchema`.
                  loaders.peer.prime(peer.id, peer)
                }

                const args: Array<ArgumentNode> = [
                  {
                    kind: Kind.ARGUMENT,
                    name: {kind: Kind.NAME, value: 'type'},
                    value: {kind: Kind.ENUM, value: type}
                  },
                  {
                    kind: Kind.ARGUMENT,
                    name: {kind: Kind.NAME, value: 'context'},
                    value: {kind: Kind.ENUM, value: 'local'}
                  }
                ]
                if (before) {
                  args.push({
                    kind: Kind.ARGUMENT,
                    name: {kind: Kind.NAME, value: 'before'},
                    value: {kind: Kind.STRING, value: before}
                  })
                }
                if (after) {
                  args.push({
                    kind: Kind.ARGUMENT,
                    name: {kind: Kind.NAME, value: 'after'},
                    value: {kind: Kind.STRING, value: after}
                  })
                }
                if (first) {
                  args.push({
                    kind: Kind.ARGUMENT,
                    name: {kind: Kind.NAME, value: 'first'},
                    value: {kind: Kind.INT, value: first}
                  })
                }
                if (last) {
                  args.push({
                    kind: Kind.ARGUMENT,
                    name: {kind: Kind.NAME, value: 'last'},
                    value: {kind: Kind.INT, value: last}
                  })
                }

                const articles = await Promise.all(
                  peers.map((peer: any) => {
                    try {
                      if (after && after[peer.id] == null) return null
                      return delegateToPeerSchema(peer.id, true, context, {
                        info,
                        fieldName: 'content',
                        args: {after: after ? after[peer.id] : undefined},
                        transforms: [
                          new WrapQuery(
                            ['content'],
                            subtree => {
                              return {
                                kind: Kind.SELECTION_SET,
                                selections: [
                                  {
                                    kind: Kind.FIELD,
                                    name: {
                                      kind: Kind.NAME,
                                      value: '_all'
                                    },
                                    selectionSet: {
                                      kind: Kind.SELECTION_SET,
                                      selections: [
                                        {
                                          kind: Kind.FIELD,
                                          name: {kind: Kind.NAME, value: 'list'},
                                          arguments: args,
                                          selectionSet: {
                                            kind: Kind.SELECTION_SET,
                                            selections: [
                                              ...subtree.selections,
                                              {
                                                kind: Kind.FIELD,
                                                name: {kind: Kind.NAME, value: 'pageInfo'},
                                                selectionSet: {
                                                  kind: Kind.SELECTION_SET,
                                                  selections: [
                                                    {
                                                      kind: Kind.FIELD,
                                                      name: {kind: Kind.NAME, value: 'endCursor'}
                                                    },
                                                    {
                                                      kind: Kind.FIELD,
                                                      name: {kind: Kind.NAME, value: 'hasNextPage'}
                                                    }
                                                  ]
                                                }
                                              },
                                              {
                                                kind: Kind.FIELD,
                                                name: {kind: Kind.NAME, value: 'totalCount'}
                                              }
                                            ]
                                          }
                                        }
                                      ]
                                    }
                                  }
                                ]
                              }
                            },
                            result => {
                              return result._all.list
                            }
                          )
                        ]
                      })
                    } catch (err) {
                      return null
                    }
                  })
                )

                const totalCount = articles.reduce(
                  (prev, result: any) => prev + (result?.totalCount ?? 0),
                  0
                )

                const cursors = Object.fromEntries(
                  articles.map((result: any, index) => [
                    peers[index].id,
                    result?.pageInfo.endCursor ?? null
                  ])
                )

                const hasNextPage = articles.reduce(
                  (prev, result: any) => prev || (result?.pageInfo.hasNextPage ?? false),
                  false
                )

                const peerArticles = articles.flatMap<PeerArticle>((result: any, index) => {
                  const peer = peers[index]
                  return (
                    result?.nodes.map((article: any) =>
                      Object.assign(article, {peerID: peer.id})
                    ) ?? []
                  )
                })

                switch (sort) {
                  case ArticleSort.CreatedAt:
                    peerArticles.sort(
                      (a, b) =>
                        new Date(b.content.createdAt).getTime() -
                        new Date(a.content.createdAt).getTime()
                    )
                    break

                  case ArticleSort.ModifiedAt:
                    peerArticles.sort(
                      (a, b) =>
                        new Date(b.content.modifiedAt).getTime() -
                        new Date(a.content.modifiedAt).getTime()
                    )
                    break

                  case ArticleSort.PublishAt:
                    peerArticles.sort(
                      (a, b) =>
                        new Date(b.content.latest.publishAt).getTime() -
                        new Date(a.content.latest.publishAt).getTime()
                    )
                    break

                  case ArticleSort.PublishedAt:
                    peerArticles.sort(
                      (a, b) =>
                        new Date(b.content.latest.publishedAt).getTime() -
                        new Date(a.content.latest.publishedAt).getTime()
                    )
                    break

                  case ArticleSort.UpdatedAt:
                    peerArticles.sort(
                      (a, b) =>
                        new Date(b.content.latest.updatedAt).getTime() -
                        new Date(a.content.latest.updatedAt).getTime()
                    )
                    break
                }

                if (order === SortOrder.Ascending) {
                  peerArticles.reverse()
                }

                return {
                  nodes: peerArticles,
                  totalCount: totalCount,
                  pageInfo: {
                    endCursor: base64Encode(JSON.stringify(cursors)),
                    hasNextPage: hasNextPage
                  }
                }
              }

              const {roles} = authenticate()
              const canGetArticles = isAuthorised(CanGetArticles, roles)
              const canGetSharedArticles = isAuthorised(CanGetSharedArticles, roles)

              if (canGetArticles || canGetSharedArticles) {
                const r = await dbAdapter.content.getContents({
                  type,
                  filter: {...filter, shared: !canGetArticles ? true : undefined},
                  sort,
                  order,
                  cursor: InputCursor(after, before),
                  limit: Limit(first, last)
                })
                r.nodes = r.nodes.map(content => {
                  return {content} as any
                })
                return r
              } else {
                throw new NotAuthorisedError()
              }
            }
          }
        }
      })
    ),
    resolve: () => {
      return {}
    }
  }

  query['_schema'] = {
    type: GraphQLNonNull(
      GraphQLList(
        GraphQLNonNull(
          new GraphQLObjectType<undefined, Context>({
            name: `ContentModelConfig`,
            fields: {
              id: {
                type: GraphQLNonNull(GraphQLID),
                resolve: (source: any, args, context) => {
                  return source.identifier
                }
              },
              identifier: {type: GraphQLNonNull(GraphQLString)},
              namePlural: {type: GraphQLNonNull(GraphQLString)},
              nameSingular: {type: GraphQLNonNull(GraphQLString)},
              schema: {
                type: GraphQLNonNull(GraphQLContentModelSchema)
              }
            }
          })
        )
      )
    ),
    resolve: () => {
      return contextOptions.contentModels
    }
  }

  let GraphQlAllCustomContentsRevision = new GraphQLObjectType<any, Context>({
    name: `AllCustomContentsRevision`,
    fields: {
      revision: {type: GraphQLNonNull(GraphQLInt)},
      createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
      publishAt: {type: GraphQLDateTime},
      updatedAt: {type: GraphQLDateTime},
      publishedAt: {type: GraphQLDateTime},
      title: {type: GraphQLNonNull(GraphQLString)},
      slug: {type: GraphQLNonNull(GraphQLSlug)}
    }
  })

  const GraphQlAllCustomContents = new GraphQLObjectType<any, Context>({
    name: `AllCustomContents`,
    fields: {
      id: {type: GraphQLNonNull(GraphQLID)},
      shared: {type: GraphQLNonNull(GraphQLBoolean)},
      createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
      modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

      draft: {type: GraphQlAllCustomContentsRevision},
      published: {type: GraphQlAllCustomContentsRevision},
      pending: {type: GraphQlAllCustomContentsRevision},

      latest: {
        type: GraphQLNonNull(GraphQlAllCustomContentsRevision),
        resolve: createProxyingResolver(({draft, pending, published}, {}, {}, info) => {
          return draft ?? pending ?? published
        })
      }
    }
  })

  mutation['_all'] = {
    type: GraphQLNonNull(
      new GraphQLObjectType<undefined, Context>({
        name: `AllMutations`,
        fields: {
          delete: {
            type: GraphQLBoolean,
            args: {id: {type: GraphQLNonNull(GraphQLID)}},
            async resolve(root, {id}, {authenticate, dbAdapter}) {
              const {roles} = authenticate()
              authorise(CanDeleteArticle, roles)
              return dbAdapter.content.deleteContent({id})
            }
          },
          publish: {
            type: GraphQlAllCustomContents,
            args: {
              id: {type: GraphQLNonNull(GraphQLID)},
              publishAt: {type: GraphQLDateTime},
              updatedAt: {type: GraphQLDateTime},
              publishedAt: {type: GraphQLDateTime}
            },
            async resolve(root, {id, publishAt, updatedAt, publishedAt}, {business}) {
              return business.publishContent(id, 1, publishAt, updatedAt, publishedAt)
            }
          },
          unpublish: {
            type: GraphQlAllCustomContents,
            args: {id: {type: GraphQLNonNull(GraphQLID)}},
            async resolve(root, {id}, {business}) {
              return business.unpublishContent(id, 1)
            }
          }
        }
      })
    ),
    resolve: () => {
      return {}
    }
  }

  return {
    queryPublic: new GraphQLObjectType<undefined, Context>({
      name: 'CustomContentPublic',
      fields: queryPublic
    }),
    query: new GraphQLObjectType<undefined, Context>({
      name: 'CustomContent',
      fields: query
    }),
    mutation: new GraphQLObjectType<undefined, Context>({
      name: 'CustomContentMutations',
      fields: mutation
    })
  }
}
