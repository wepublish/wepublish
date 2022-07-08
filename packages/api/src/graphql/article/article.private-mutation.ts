import {Context} from '../../context'
import {authorise, CanDeleteArticle} from '../permissions'
import {PrismaClient} from '@prisma/client'

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
