import {GraphQLResolveInfo, Kind} from 'graphql'
import {ExtractField, WrapQuery} from 'graphql-tools'
import {Context} from '../../context'
import {ArticleFilter, ArticleSort, PeerArticle} from '../../db/article'
import {ConnectionResult, SortOrder} from '../../db/common'
import {delegateToPeerSchema, base64Encode} from '../../utility'
import {authorise} from '../permissions'
import {CanGetPeerArticles} from '@wepublish/permissions/api'

export const getAdminPeerArticles = async (
  filter: Partial<ArticleFilter>,
  sort: ArticleSort,
  order: SortOrder,
  peerNameFilter: string,
  stringifiedCursors: string,
  context: Context,
  info: GraphQLResolveInfo,
  take: number,
  skip: number,
  first: number
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
    // Prime loader cache we don't need to refetch inside `delegateToPeerSchema`.
    loaders.peer.prime(peer.id, peer)
  }

  // If the peers count is not a multiple of the object requested return more than requested (backwards compatible)
  const articleToTakeFromEachPeer = Math.ceil(first || take / peers.length)
  const articleToSkipFromEachPeer = Math.ceil(skip / peers.length)

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
            take: articleToTakeFromEachPeer,
            // Skip isn't backwards compatible since the in pre primsa it means skip pages and in prisma skip object.
            skip: articleToSkipFromEachPeer,
            filter: {
              published: true
            },
            // needed for versions before prisma
            after: cursors ? base64Encode(cursors[peer.id]) : undefined,
            // Backwards compatability for older instances (non prisma)
            first: articleToTakeFromEachPeer
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

  let filtered = peerArticles
  // filters
  if (filter.title) {
    filtered = filtered.filter(({article}) =>
      article.latest.title.toLowerCase().includes(filter.title?.toLowerCase())
    )
  }
  if (filter.preTitle) {
    filtered = filtered.filter(({article}) =>
      article.latest.preTitle.toLowerCase().includes(filter.preTitle?.toLowerCase())
    )
  }
  if (filter.lead) {
    filtered = filtered.filter(({article}) =>
      article.latest.lead.toLowerCase().includes(filter.lead?.toLowerCase())
    )
  }
  if (filter.publicationDateFrom && filter.publicationDateTo) {
    const from = filter.publicationDateFrom.date as Date
    const to = filter.publicationDateTo.date as Date
    filtered = filtered.filter(
      ({article}) =>
        new Date(article.published.publishedAt).getTime() >= new Date(from).getTime() &&
        new Date(article.published.publishedAt).getTime() < new Date(to).getTime()
    )
  }

  switch (sort) {
    case ArticleSort.CreatedAt:
      filtered.sort(
        (a, b) => new Date(a.article.createdAt).getTime() - new Date(b.article.createdAt).getTime()
      )
      break

    case ArticleSort.ModifiedAt:
      filtered.sort(
        (a, b) =>
          new Date(a.article.modifiedAt).getTime() - new Date(b.article.modifiedAt).getTime()
      )
      break

    case ArticleSort.PublishAt:
      filtered.sort(
        (a, b) =>
          new Date(a.article.latest.publishAt).getTime() -
          new Date(b.article.latest.publishAt).getTime()
      )
      break

    case ArticleSort.PublishedAt:
      filtered.sort(
        (a, b) =>
          new Date(a.article.latest.publishedAt).getTime() -
          new Date(b.article.latest.publishedAt).getTime()
      )
      break

    case ArticleSort.UpdatedAt:
      filtered.sort(
        (a, b) =>
          new Date(a.article.latest.updatedAt).getTime() -
          new Date(b.article.latest.updatedAt).getTime()
      )
      break
  }

  if (order === SortOrder.Descending) {
    filtered.reverse()
  }

  return {
    nodes: filtered,
    totalCount,
    pageInfo: {
      endCursor: JSON.stringify(endCursors),
      startCursor: JSON.stringify(startCursors),
      hasNextPage,
      hasPreviousPage
    }
  }
}
