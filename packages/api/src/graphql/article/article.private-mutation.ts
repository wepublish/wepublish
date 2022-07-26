import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {NotFound} from '../../error'
import {authorise, CanCreateArticle, CanDeleteArticle} from '../permissions'

export const deleteArticleById = (
  id: string,
  authenticate: Context['authenticate'],
  article: PrismaClient['article']
) => {
  const {roles} = authenticate()
  authorise(CanDeleteArticle, roles)

  return article.delete({
    where: {
      id
    }
  })
}

export const createArticle = (
  input: Pick<Prisma.ArticleUncheckedCreateInput, 'shared'> &
    Omit<Prisma.ArticleRevisionCreateInput, 'updatedAt' | 'revision'>,
  authenticate: Context['authenticate'],
  article: PrismaClient['article']
) => {
  const {roles} = authenticate()
  authorise(CanCreateArticle, roles)
  const {shared, ...data} = input

  return article.create({
    data: {
      shared,
      draft: {
        ...data,
        revision: 0,
        updatedAt: new Date()
      },
      modifiedAt: new Date()
    }
  })
}

export const duplicateArticle = async (
  id: string,
  authenticate: Context['authenticate'],
  articles: Context['loaders']['articles'],
  articleClient: PrismaClient['article']
) => {
  const {roles} = authenticate()
  authorise(CanCreateArticle, roles)

  const article = await articles.load(id)
  if (!article) {
    throw new NotFound('article', id)
  }

  const articleRevision = (article.draft ?? article.pending ?? article.published)!

  const input: Prisma.ArticleRevisionCreateInput = {
    ...articleRevision,
    blocks: articleRevision.blocks as Prisma.JsonValue[],
    slug: '',
    revision: 0,
    publishedAt: null,
    updatedAt: new Date(),
    createdAt: new Date()
  }

  return articleClient.create({
    data: {
      shared: article.shared,
      draft: input,
      modifiedAt: new Date()
    }
  })
}
