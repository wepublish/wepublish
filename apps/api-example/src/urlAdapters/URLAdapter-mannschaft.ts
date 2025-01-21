import {PublicArticle} from '@wepublish/api'
import {DefaultURLAdapter} from './URLAdapter-default'
import {PrismaClient} from '@prisma/client'

type MannschaftURLAdapterProps = ConstructorParameters<typeof DefaultURLAdapter>[0] & {
  prisma: PrismaClient
}

export class MannschaftURLAdapter extends DefaultURLAdapter {
  private prisma: PrismaClient

  constructor(props: MannschaftURLAdapterProps) {
    super(props)
    this.prisma = props.prisma
  }

  override async getPublicArticleURL(article: PublicArticle) {
    const tag = await this.prisma.tag.findFirst({
      where: {
        main: true,
        tag: {
          not: ''
        },
        articles: {
          some: {
            articleId: article.id
          }
        }
      }
    })

    if (tag) {
      return `${this.websiteURL}/a/${encodeURIComponent(tag.tag.toLowerCase())}/${article.slug}`
    }

    return `${this.websiteURL}/a/${article.slug}`
  }
}
