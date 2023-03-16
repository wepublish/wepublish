import {PrismaClient} from '@prisma/client'
import {
  CanGetArticle,
  CanGetArticlePreviewLink,
  CanGetArticles,
  CanGetSharedArticle,
  CanGetSharedArticles,
  hasPermission
} from '@wepublish/permissions/api'
import {Context} from '../../context'
import {ArticleFilter, ArticleSort, ArticleWithRevisions} from '../../db/article'
import {NotAuthorisedError, NotFound, UserInputError} from '../../error'
import {authorise} from '../permissions'
import {getArticles} from './article.queries'

export const getArticleById = async (
  id: string,
  authenticate: Context['authenticate'],
  articleLoader: Context['loaders']['articles']
): Promise<ArticleWithRevisions | null> => {
  const {roles} = authenticate()

  const canGetArticle = hasPermission(CanGetArticle, roles)
  const canGetSharedArticle = hasPermission(CanGetSharedArticle, roles)

  if (canGetArticle || canGetSharedArticle) {
    const article = await articleLoader.load(id)

    if (canGetArticle) {
      return article
    } else {
      return article?.shared ? article : null
    }
  } else {
    throw new NotAuthorisedError()
  }
}

export const getArticlePreviewLink = async (
  id: string,
  hours: number,
  authenticate: Context['authenticate'],
  generateJWT: Context['generateJWT'],
  urlAdapter: Context['urlAdapter'],
  articles: Context['loaders']['articles']
): Promise<string> => {
  const {roles} = authenticate()
  authorise(CanGetArticlePreviewLink, roles)

  const article = await articles.load(id)

  if (!article) throw new NotFound('article', id)

  if (!article.draft) throw new UserInputError('Article needs to have a draft')

  const token = generateJWT({
    id: article.id,
    expiresInMinutes: hours * 60
  })

  return urlAdapter.getArticlePreviewURL(token)
}

export const getAdminArticles = async (
  filter: Partial<ArticleFilter>,
  sortedField: ArticleSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  authenticate: Context['authenticate'],
  article: PrismaClient['article']
) => {
  const {roles} = authenticate()

  const canGetArticles = hasPermission(CanGetArticles, roles)
  const canGetSharedArticles = hasPermission(CanGetSharedArticles, roles)

  if (canGetArticles || canGetSharedArticles) {
    return getArticles(
      {...filter, shared: !canGetArticles ? true : undefined},
      sortedField,
      order,
      cursorId,
      skip,
      take,
      article
    )
  } else {
    throw new NotAuthorisedError()
  }
}
