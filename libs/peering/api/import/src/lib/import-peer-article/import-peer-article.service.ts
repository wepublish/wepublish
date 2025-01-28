import {Injectable, NotFoundException} from '@nestjs/common'
import {Prisma, PrismaClient, TagType} from '@prisma/client'
import {GraphQLClient} from 'graphql-request'
import {
  Article,
  ArticleList,
  ArticleListQuery,
  ArticleListQueryVariables,
  ArticleQuery,
  ArticleQueryVariables,
  ArticleFilter as GqlArticleFilter,
  DateFilter as GqlDateFilter
} from './graphql'
import {ImageFetcherService, MediaAdapter} from '@wepublish/image/api'
import {DateFilter, PrimeDataLoader, SortOrder} from '@wepublish/utils/api'
import {ArticleDataloaderService, ArticleFilter, ArticleSort} from '@wepublish/article/api'
import {
  BlockType,
  ImageBlockInput,
  ImageGalleryBlockInput,
  ImageGalleryImageInput
} from '@wepublish/block-content/api'
import {PeerArticle, PeerArticleListArgs} from './peer-article.model'

type ImportArticleOptions = Partial<{
  importAuthors: boolean
  importTags: boolean
}>

const dateFilterToGqlDateFilter = (comparison: DateFilter): GqlDateFilter => ({
  comparison: comparison.comparison,
  date: comparison.date?.toDateString()
})

const articleFilterToGqlArticleFilter = (filter: Partial<ArticleFilter>): GqlArticleFilter => ({
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
      .filter(({name}) => (filter?.peerName ? name === filter.peerName : true))
      .filter(({isDisabled}) => !isDisabled)

    const articleToTakeFromEachPeer = Math.ceil(take / peers.length)
    const articleToSkipFromEachPeer = Math.ceil(skip / peers.length)

    const articles = await Promise.all(
      peers.map(async peer => {
        const client = new GraphQLClient(peer.hostURL, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${peer.token}`
          }
        })

        const data = await client.request<ArticleListQuery, ArticleListQueryVariables>(
          ArticleList,
          {
            filter: {
              ...articleFilterToGqlArticleFilter(filter ?? {}),
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
  async importArticle(peerId: string, articleId: string, options?: ImportArticleOptions) {
    const peer = await this.prisma.peer.findUnique({
      where: {
        id: peerId
      }
    })

    if (!peer) {
      throw new NotFoundException()
    }

    const client = new GraphQLClient(peer.hostURL, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${peer.token}`
      }
    })

    const {article} = await client.request<ArticleQuery, ArticleQueryVariables>(Article, {
      id: articleId
    })

    const authors = options?.importAuthors
      ? await this.importAuthors(peerId, article.published!.authors)
      : []
    const tags = options?.importAuthors ? await this.importTags(peerId, article.tags) : []
    const blocks = await this.prepareBlocksForImport(peerId, article.published!.blocks)

    const created = await this.prisma.article.create({
      data: {
        peerId,
        peerArticleId: articleId,

        shared: false,
        hidden: false,
        disableComments: false,

        revisions: {
          create: {
            // canonicalUrl: article.url,
            breaking: false,
            hideAuthor: false,
            authors: {
              createMany: {
                data: authors
              }
            },
            blocks
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
          let imageId: string | undefined

          if (author.image?.url) {
            const file = this.imageFetcher.fetch(author.image?.url)
            const image = await this.mediaAdapter.uploadImageFromArrayBuffer(file)

            await this.prisma.image.create({
              data: {
                ...image,
                peerId
              }
            })

            imageId = image.id
          }

          return this.prisma.author.upsert({
            where: {
              slug: author.slug
            },
            create: {
              name: author.name,
              slug: author.slug,
              bio: author.bio as Prisma.JsonArray,
              hideOnTeam: true,
              imageID: imageId,
              peerId
              // @TODO: author page if 2 authors with same slug exists, take peerId: null
            },
            update: {
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
    blocks: Exclude<ArticleQuery['article']['published'], undefined | null>['blocks']
  ): Promise<Prisma.InputJsonValue[]> {
    return Promise.all(
      blocks.map(async block => {
        if (block.__typename === 'ImageBlock') {
          let imageId: string | undefined

          if (block.image?.url) {
            const file = this.imageFetcher.fetch(block.image.url)
            const image = await this.mediaAdapter.uploadImageFromArrayBuffer(file)

            await this.prisma.image.create({
              data: {
                ...image,
                peerId
              }
            })

            imageId = image.id
          }

          return {
            type: BlockType.Image,
            caption: block.caption,
            imageID: imageId
          } as ImageBlockInput
        }

        if (block.__typename === 'ImageGalleryBlock') {
          const images = await Promise.all(
            block.images.map(async item => {
              let imageId: string | undefined

              if (item.image?.url) {
                const file = this.imageFetcher.fetch(item.image.url)
                const image = await this.mediaAdapter.uploadImageFromArrayBuffer(file)

                await this.prisma.image.create({
                  data: {
                    ...image,
                    peerId
                  }
                })

                imageId = image.id
              }

              return {
                caption: item.caption,
                imageID: imageId
              } as ImageGalleryImageInput
            })
          )

          return {
            type: BlockType.ImageGallery,
            images
          } as ImageGalleryBlockInput
        }

        return stripTypename(block)
      })
    )
  }
}

export const stripTypename = <T extends {__typename?: string}>({__typename, ...rest}: T) => rest
