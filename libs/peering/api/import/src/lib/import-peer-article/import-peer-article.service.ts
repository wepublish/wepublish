import {Injectable, NotFoundException} from '@nestjs/common'
import {Prisma, PrismaClient, TagType} from '@prisma/client'
import {ArticleDataloaderService} from '@wepublish/article/api'
import {
  BlockContentInput,
  BlockType,
  CommentBlockInput,
  EventBlockInput,
  ImageGalleryBlockInput,
  ImageGalleryImageInput,
  ListicleBlockInput,
  ListicleItemInput,
  PollBlockInput,
  TeaserGridBlockInput,
  TeaserListBlockInput
} from '@wepublish/block-content/api'
import {ImageFetcherService, MediaAdapter} from '@wepublish/image/api'
import {createSafeHostUrl} from '@wepublish/peering/api'
import {DateFilter, PrimeDataLoader} from '@wepublish/utils/api'
import {GraphQLClient} from 'graphql-request'
import {pipe, replace, toLower} from 'ramda'
import {ValueOf} from 'type-fest'
import {
  Article,
  ArticleList,
  ArticleListQuery,
  ArticleListQueryVariables,
  ArticleQuery,
  ArticleQueryVariables,
  FullImageFragment,
  ArticleFilter as GqlArticleFilter,
  DateFilter as GqlDateFilter
} from './graphql'
import {ImportArticleOptions, PeerArticleFilter, PeerArticleListArgs} from './peer-article.model'

const dateFilterToGqlDateFilter = (comparison: DateFilter): GqlDateFilter => ({
  comparison: comparison.comparison,
  date: comparison.date?.toDateString()
})

const peerArticleFilterToGqlArticleFilter = ({
  peerId: _peerId,
  ...filter
}: Partial<PeerArticleFilter>): GqlArticleFilter => ({
  ...filter,
  publicationDateFrom:
    filter.publicationDateFrom && dateFilterToGqlDateFilter(filter.publicationDateFrom),
  publicationDateTo: filter.publicationDateTo && dateFilterToGqlDateFilter(filter.publicationDateTo)
})

@Injectable()
export class ImportPeerArticleService {
  constructor(
    private prisma: PrismaClient,
    private imageFetcher: ImageFetcherService,
    private mediaAdapter: MediaAdapter
  ) {}

  async getArticles({filter, sort, order, take = 10, skip = 0}: PeerArticleListArgs) {
    const peers = (
      await this.prisma.peer.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      })
    )
      .filter(({id}) => (filter?.peerId ? id === filter?.peerId : true))
      .filter(({isDisabled}) => !isDisabled)

    const articleToTakeFromEachPeer = Math.ceil(take / peers.length)
    const articleToSkipFromEachPeer = Math.ceil(skip / peers.length)

    const articleResults = await Promise.allSettled(
      peers.map(async peer => {
        // @TODO: Error handling
        const link = createSafeHostUrl(peer.hostURL, 'v1')
        const client = new GraphQLClient(link, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${peer.token}`
          }
        })

        const data = await client.request<ArticleListQuery, ArticleListQueryVariables>(
          ArticleList,
          {
            filter: {
              ...peerArticleFilterToGqlArticleFilter(filter ?? {}),
              shared: true,
              published: true
            },
            order,
            sort,
            take: articleToTakeFromEachPeer,
            skip: articleToSkipFromEachPeer
          }
        )

        return data.articles
      })
    )

    // Silently fail for users and only return articles that worked.
    const articles = articleResults.flatMap(result => {
      if (result.status === 'fulfilled') {
        return result.value
      }

      console.error(result.reason)

      return []
    })

    const totalCount = articles.reduce((prev, result) => prev + (result?.totalCount ?? 0), 0)

    const hasPreviousPage = articles.reduce(
      (prev, result) => prev || (result?.pageInfo?.hasPreviousPage ?? false),
      false
    )
    const hasNextPage = articles.reduce(
      (prev, result) => prev || (result?.pageInfo?.hasNextPage ?? false),
      false
    )

    const peerArticles = articles.flatMap((result, index) => {
      const peer = peers[index]

      return result?.nodes.map(article => ({...article, peerId: peer.id})) ?? []
    })

    return {
      nodes: peerArticles,
      totalCount,
      pageInfo: {
        hasNextPage,
        hasPreviousPage
      }
    }
  }

  @PrimeDataLoader(ArticleDataloaderService)
  async importArticle(peerId: string, articleId: string, options: ImportArticleOptions) {
    const peer = await this.prisma.peer.findUnique({
      where: {
        id: peerId
      }
    })

    if (!peer) {
      throw new NotFoundException()
    }

    const link = createSafeHostUrl(peer.hostURL, 'v1')
    const client = new GraphQLClient(link, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${peer.token}`
      }
    })

    const {article} = await client.request<ArticleQuery, ArticleQueryVariables>(Article, {
      id: articleId
    })

    const authors = options.importAuthors
      ? await this.importAuthors(peerId, article.published!.authors)
      : []
    const tags = options.importAuthors ? await this.importTags(peerId, article.tags) : []
    const blocks = await this.prepareBlocksForImport(peerId, article.published!.blocks, options)
    const imageId = options.importContentImages
      ? await this.importImage(peerId, article.published?.image)
      : null

    const created = await this.prisma.article.create({
      data: {
        peerId,
        peerArticleId: articleId,
        slug: article.slug,

        shared: false,
        hidden: false,
        disableComments: false,

        revisions: {
          create: {
            title: article.published?.title,
            lead: article.published?.lead,
            canonicalUrl: article.url,
            breaking: false,
            hideAuthor: false,
            imageID: imageId,
            authors: {
              createMany: {
                data: authors
              }
            },
            blocks: blocks as Prisma.JsonArray
          }
        },

        tags: {
          createMany: {
            data: tags
          }
        }
      }
    })

    return created
  }

  private async importAuthors(
    peerId: string,
    authors: Exclude<ArticleQuery['article']['published'], undefined | null>['authors']
  ): Promise<Prisma.ArticleRevisionAuthorCreateManyRevisionInput[]> {
    const res = await Promise.all(
      authors
        .filter(author => !author.hideOnArticle)
        .map(async author => {
          const imageId = await this.importImage(peerId, author.image)

          return this.prisma.author.upsert({
            where: {
              slug_peerId: {
                slug: author.slug,
                peerId
              }
            },
            create: {
              name: author.name,
              slug: author.slug,
              bio: author.bio as any[],
              hideOnTeam: true,
              imageID: imageId,
              peerId
            },
            update: {
              name: author.name,
              bio: author.bio as any[],
              imageID: imageId
            }
          })
        })
    )

    return res.map(r => ({
      authorId: r.id
    }))
  }

  private async importTags(
    peerId: string,
    tags: ArticleQuery['article']['tags']
  ): Promise<Prisma.TaggedArticlesUncheckedCreateWithoutArticleInput[]> {
    const existingTags = await this.prisma.tag.findMany({
      where: {
        tag: {
          in: tags.map(({tag}) => tag ?? '')
        }
      }
    })

    await this.prisma.tag.createMany({
      data: tags
        .filter(({tag}) => !existingTags.some(t => t.tag === tag))
        .map(({tag}) => ({
          tag,
          type: TagType.Article,
          peerId
        }))
    })

    const res = await this.prisma.tag.findMany({
      where: {
        tag: {
          in: tags.map(({tag}) => tag ?? '')
        }
      }
    })

    return res.map(r => ({
      tagId: r.id
    }))
  }

  private async prepareBlocksForImport(
    peerId: string,
    blocks: Exclude<ArticleQuery['article']['published'], undefined | null>['blocks'],
    options: ImportArticleOptions
  ) {
    //@TODO: Maybe copy block style? (search for identical blockStyleName + blockType)

    return Promise.all(
      blocks.map(async block => {
        switch (block.__typename) {
          case 'BreakBlock':
          case 'QuoteBlock':
          case 'ImageBlock': {
            const imageId = options.importContentImages
              ? await this.importImage(peerId, block.image)
              : null

            return {
              ...stripUnwantedProperties(block),
              type: lower(block.type),
              imageID: imageId
            }
          }

          case 'ListicleBlock': {
            const items = await Promise.all(
              block.items.map(async item => {
                const imageId = options.importContentImages
                  ? await this.importImage(peerId, item.image)
                  : null

                return {
                  ...stripUnwantedProperties(item),
                  imageID: imageId
                } as ListicleItemInput
              })
            )

            return {
              ...stripUnwantedProperties(block),
              type: BlockType.Listicle,
              items
            } as ListicleBlockInput
          }

          case 'ImageGalleryBlock': {
            const images = await Promise.all(
              block.images.map(async item => {
                const imageId = options.importContentImages
                  ? await this.importImage(peerId, item.image)
                  : null

                return {
                  ...stripUnwantedProperties(item),
                  imageID: imageId
                } as ImageGalleryImageInput
              })
            )

            return {
              ...stripUnwantedProperties(block),
              type: BlockType.ImageGallery,
              images
            } as ImageGalleryBlockInput
          }

          case 'CommentBlock': {
            return {
              ...stripUnwantedProperties(block),
              type: BlockType.Comment,
              filter: {
                comments: [],
                tags: []
              }
            } as CommentBlockInput
          }

          case 'EventBlock': {
            return {
              ...stripUnwantedProperties(block),
              type: BlockType.Event,
              filter: {
                events: [],
                tags: []
              }
            } as EventBlockInput
          }

          case 'PollBlock': {
            return {
              ...stripUnwantedProperties(block),
              type: BlockType.Poll,
              pollId: undefined
            } as PollBlockInput
          }

          case 'TeaserGridBlock': {
            return {
              ...stripUnwantedProperties(block),
              type: BlockType.TeaserGrid,
              teasers: []
            } as TeaserGridBlockInput
          }

          case 'TeaserListBlock': {
            return {
              ...stripUnwantedProperties(block),
              type: BlockType.TeaserList,
              filter: {
                tags: []
              },
              teaserType: lower(block.teaserType),
              sort: block.sort ? lower(block.sort) : null
            } as TeaserListBlockInput
          }

          case 'UnknownBlock':
          case 'TitleBlock':
          case 'TeaserGridFlexBlock':
          case 'BildwurfAdBlock':
          case 'IFrameBlock':
          case 'PolisConversationBlock':
          case 'YouTubeVideoBlock':
          case 'VimeoVideoBlock':
          case 'FacebookPostBlock':
          case 'FacebookVideoBlock':
          case 'InstagramPostBlock':
          case 'SoundCloudTrackBlock':
          case 'TikTokVideoBlock':
          case 'TwitterTweetBlock':
          case 'HTMLBlock':
          case 'RichTextBlock':
          case 'SubscribeBlock': {
            return {
              ...stripUnwantedProperties(block),
              type: lower(block.type)
            } as ValueOf<BlockContentInput>
            // BlockContentInput technically not the correct type,
            // maybe implement BlockContentDB type? It would contain the same thing as BlockContent minus the resolvers
          }

          default: {
            const _exhaustiveCheck: never = block
            throw new Error(`Unhandled case: ${block}`)
          }
        }
      })
    )
  }

  private async importImage(
    peerId: string,
    originImage: FullImageFragment | null | undefined
  ): Promise<string | null | undefined> {
    let imageId: string | undefined

    if (originImage?.url) {
      const file = this.imageFetcher.fetch(originImage?.url)
      const image = await this.mediaAdapter.uploadImageFromArrayBuffer(file)

      await this.prisma.image.create({
        data: {
          ...image,
          source: originImage?.source,
          license: originImage?.license,
          peerId
        }
      })

      imageId = image.id
    }

    return imageId
  }
}

const stripTypename = <T extends {[key: string]: unknown}>({
  __typename,
  ...rest
}: T): Omit<T, '__typename'> => rest
const stripBlockStyle = <T extends {[key: string]: unknown}>({
  blockStyle,
  ...rest
}: T): Omit<T, 'blockStyle'> => rest
const stripType = <T extends {[key: string]: unknown}>({type, ...rest}: T): Omit<T, 'type'> => rest
const stripImage = <T extends {[key: string]: unknown}>({image, ...rest}: T): Omit<T, 'image'> =>
  rest

const stripUnwantedProperties = pipe(stripType, stripTypename, stripBlockStyle, stripImage)

const lower = replace(/^./, toLower)
