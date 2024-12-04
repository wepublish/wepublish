import {Injectable, NotFoundException} from '@nestjs/common'
import {Prisma, PrismaClient, TagType} from '@prisma/client'
import {GraphQLClient} from 'graphql-request'
import {Article, ArticleQuery, ArticleQueryVariables, BlockContent, ImageBlock} from './graphql'
import {ImageFetcherService, MediaAdapter} from '@wepublish/image/api'
import {PrimeDataLoader} from '@wepublish/utils/api'
import {ArticleDataloaderService} from '@wepublish/article/api'
import {cond, T} from 'ramda'

type ImportArticleOptions = Partial<{
  importAuthors: boolean
  importTags: boolean
}>

@Injectable()
export class ImportPeerArticleService {
  constructor(
    private prisma: PrismaClient,
    private imageFetcher: ImageFetcherService,
    private mediaAdapter: MediaAdapter
  ) {}

  getArticles() {
    return []
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
      ? await this.importAuthors(article.published!.authors)
      : []
    const tags = options?.importAuthors ? await this.importTags(article.tags) : []
    const blocks = await this.prepareBlocksForImport(article.published!.blocks)

    const created = await this.prisma.article.create({
      data: {
        peerId,
        peerArticleId: articleId,

        shared: false,
        hidden: false,
        disableComments: false,

        revisions: {
          create: {
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
              data: image
              // @TODO: add peerId
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
              imageID: imageId
              // @TODO: add peerId, author page if 2 authors with same slug exists, take peerId: null
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
          type: TagType.Article
          // @TODO: add peerId
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
    blocks: Exclude<ArticleQuery['article']['published'], undefined | null>['blocks']
  ): Promise<Prisma.InputJsonValue[]> {
    return Promise.all(
      blocks.map(
        cond([
          [
            (block: BlockContent) => block.__typename === 'ImageBlock',
            async (block: ImageBlock) => {
              let imageId: string | undefined

              if (block.image?.url) {
                const file = this.imageFetcher.fetch(block.image.url)
                const image = await this.mediaAdapter.uploadImageFromArrayBuffer(file)

                await this.prisma.image.create({
                  data: image
                  // @TODO: add peerId
                })

                imageId = image.id
              }

              return {
                type: block.type,
                caption: block.caption,
                imageId
              }
            }
          ],
          [(_block: BlockContent) => true, async (block: BlockContent) => block]
        ])
      )
    )
  }
}
