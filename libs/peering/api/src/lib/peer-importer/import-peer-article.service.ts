import {Injectable, NotFoundException} from '@nestjs/common'
import {Prisma, PrismaClient, TagType} from '@prisma/client'
import {GraphQLClient} from 'graphql-request'
import {Article, ArticleQuery, ArticleQueryVariables} from './graphql'

type ImportArticleOptions = Partial<{
  importAuthors: boolean
  importTags: boolean
}>

@Injectable()
export class ImportPeerArticleService {
  constructor(private prisma: PrismaClient) {}

  getArticles() {
    return []
  }

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
            // @TODO:
            blocks: []
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
        .map(author =>
          this.prisma.author.upsert({
            where: {
              slug: author.slug
            },
            create: {
              name: author.name,
              slug: author.slug,
              bio: author.bio as Prisma.JsonArray,
              hideOnTeam: true
            },
            update: {}
          })
        )
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
}
