import {PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {ArticleFilter, ArticleSort, PublicArticle} from '../../db/article'
import {AuthSessionType} from '@wepublish/authentication/api'
import {logger} from '../../server'
import {getArticles} from './article.queries'

export const getPublishedArticles = async (
  filter: Partial<ArticleFilter>,
  sortedField: ArticleSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  article: PrismaClient['article']
) => {
  const data = await getArticles(
    {...filter, published: true},
    sortedField,
    order,
    cursorId,
    skip,
    take,
    article
  )

  return {
    ...data,
    nodes: data.nodes.map(({id, shared, published}) => ({shared, ...published, id}))
  }
}

export const getPublishedArticleByIdOrSlug = async (
  id: string | null,
  slug: string | null,
  token: string | null,
  session: Context['session'],
  verifyJWT: Context['verifyJWT'],
  publicArticles: Context['loaders']['publicArticles'],
  articles: Context['loaders']['articles'],
  articleClient: PrismaClient['article']
) => {
  let article = id ? await publicArticles.load(id) : null

  if (!article && slug) {
    const fullArticle = await articleClient.findFirst({
      where: {
        OR: [
          {
            published: {
              is: {
                slug
              }
            }
          },
          {
            pending: {
              is: {
                slug
              }
            }
          }
        ]
      },
      include: {
        draft: {
          include: {
            properties: true,
            authors: true,
            socialMediaAuthors: true
          }
        },
        pending: {
          include: {
            properties: true,
            authors: true,
            socialMediaAuthors: true
          }
        },
        published: {
          include: {
            properties: true,
            authors: true,
            socialMediaAuthors: true
          }
        }
      }
    })

    article = fullArticle
      ? ({
          ...(fullArticle?.published ?? fullArticle.pending),
          id: fullArticle.id,
          shared: fullArticle?.shared
        } as PublicArticle)
      : null
  }

  if (!article && token) {
    try {
      const articleId = verifyJWT(token)
      const privateArticle = await articles.load(articleId)

      article = privateArticle?.draft
        ? ({
            ...privateArticle.draft,
            id: privateArticle.id,
            shared: privateArticle.shared,
            updatedAt: new Date(),
            publishedAt: new Date()
          } as PublicArticle)
        : null
    } catch (error) {
      logger('graphql-query').warn(error as Error, 'Error while verifying token with article id.')
    }
  }

  if (session?.type === AuthSessionType.Token) {
    return article?.shared ? article : null
  }

  return article
}
