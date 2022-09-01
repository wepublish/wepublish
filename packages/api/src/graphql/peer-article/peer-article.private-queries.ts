import {GraphQLResolveInfo, Kind} from 'graphql'
import {ExtractField, WrapQuery} from 'graphql-tools'
import {Context} from '../../context'
import {ArticleSort, PeerArticle} from '../../db/article'
import {ConnectionResult, SortOrder} from '../../db/common'
import {delegateToPeerSchema, base64Encode} from '../../utility'
import {authorise, CanGetPeerArticles} from '../permissions'

export const getAdminPeerArticles = async (
  sort: ArticleSort,
  order: SortOrder,
  peerNameFilter: string,
  stringifiedCursors: string,
  context: Context,
  info: GraphQLResolveInfo
): Promise<ConnectionResult<PeerArticle>> => {
  const {authenticate, loaders, prisma} = context
  const {roles} = authenticate()

  authorise(CanGetPeerArticles, roles)

  const cursors: Record<string, string> | null = stringifiedCursors
    ? JSON.parse(stringifiedCursors)
    : null

  const peers = (
    await prisma.peer.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
  )
    .filter(peer => (peerNameFilter ? peer.name === peerNameFilter : true))
    .filter(({isDisabled}) => !isDisabled)

  for (const peer of peers) {
    // Prime loader cache so we don't need to refetch inside `delegateToPeerSchema`.
    loaders.peer.prime(peer.id, peer)
  }

  const articles = await Promise.all(
    peers.map(peer => {
      try {
        if (cursors && !cursors[peer.id]) {
          return null
        }

        return delegateToPeerSchema(peer.id, true, context, {
          info,
          fieldName: 'articles',
          args: {
            cursor: cursors ? cursors[peer.id] : undefined,
            take: 50,
            // needed for versions before prisma
            after: cursors ? base64Encode(cursors[peer.id]) : undefined,
            first: 50
          },
          transforms: [
            new ExtractField({
              from: ['articles', 'nodes', 'article'],
              to: ['articles', 'nodes']
            }),
            new WrapQuery(
              ['articles', 'nodes', 'article'],
              subtree => ({
                kind: Kind.SELECTION_SET,
                selections: [
                  ...subtree.selections,
                  {
                    kind: Kind.FIELD,
                    name: {kind: Kind.NAME, value: 'id'}
                  },
                  {
                    kind: Kind.FIELD,
                    name: {kind: Kind.NAME, value: 'latest'},
                    selectionSet: {
                      kind: Kind.SELECTION_SET,
                      selections: [
                        {
                          kind: Kind.FIELD,
                          name: {kind: Kind.NAME, value: 'updatedAt'}
                        },
                        {
                          kind: Kind.FIELD,
                          name: {kind: Kind.NAME, value: 'publishAt'}
                        },
                        {
                          kind: Kind.FIELD,
                          name: {kind: Kind.NAME, value: 'publishedAt'}
                        }
                      ]
                    }
                  },
                  {
                    kind: Kind.FIELD,
                    name: {kind: Kind.NAME, value: 'modifiedAt'}
                  },
                  {
                    kind: Kind.FIELD,
                    name: {kind: Kind.NAME, value: 'createdAt'}
                  }
                ]
              }),
              result => result
            ),
            new WrapQuery(
              ['articles'],
              subtree => ({
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
              }),
              result => result
            )
          ]
        })
      } catch (err) {
        return null
      }
    })
  )

  const totalCount = articles.reduce((prev, result) => prev + (result?.totalCount ?? 0), 0)

  const startCursors = Object.fromEntries(
    articles.map((result, index) => [peers[index].id, result?.pageInfo?.startCursor ?? null])
  )
  const endCursors = Object.fromEntries(
    articles.map((result, index) => [peers[index].id, result?.pageInfo?.endCursor ?? null])
  )

  const hasPreviousPage = articles.reduce(
    (prev, result) => prev || (result?.pageInfo?.hasPreviousPage ?? false),
    false
  )
  const hasNextPage = articles.reduce(
    (prev, result) => prev || (result?.pageInfo?.hasNextPage ?? false),
    false
  )

  const peerArticles = articles.flatMap<PeerArticle & {article: any}>((result, index) => {
    const peer = peers[index]

    return result?.nodes.map((article: any) => ({peerID: peer.id, article})) ?? []
  })

  switch (sort) {
    case ArticleSort.CreatedAt:
      peerArticles.sort(
        (a, b) => new Date(b.article.createdAt).getTime() - new Date(a.article.createdAt).getTime()
      )
      break

    case ArticleSort.ModifiedAt:
      peerArticles.sort(
        (a, b) =>
          new Date(b.article.modifiedAt).getTime() - new Date(a.article.modifiedAt).getTime()
      )
      break

    case ArticleSort.PublishAt:
      peerArticles.sort(
        (a, b) =>
          new Date(b.article.latest.publishAt).getTime() -
          new Date(a.article.latest.publishAt).getTime()
      )
      break

    case ArticleSort.PublishedAt:
      peerArticles.sort(
        (a, b) =>
          new Date(b.article.latest.publishedAt).getTime() -
          new Date(a.article.latest.publishedAt).getTime()
      )
      break

    case ArticleSort.UpdatedAt:
      peerArticles.sort(
        (a, b) =>
          new Date(b.article.latest.updatedAt).getTime() -
          new Date(a.article.latest.updatedAt).getTime()
      )
      break
  }

  if (order === SortOrder.Descending) {
    peerArticles.reverse()
  }

  return {
    nodes: peerArticles,
    totalCount: totalCount,
    pageInfo: {
      endCursor: JSON.stringify(endCursors),
      startCursor: JSON.stringify(startCursors),
      hasNextPage,
      hasPreviousPage
    }
  }
}
