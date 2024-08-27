import {PrismaClient} from '@prisma/client'

export const updateLikes = async (
  input: {
    articleId: string
  },
  delta: number,
  articleClient: PrismaClient['article'],
  articleRevisionClient: PrismaClient['articleRevision']
) => {
  const article = await articleClient.findFirst({
    where: {
      id: input.articleId
    }
  })

  const updatedRevision = await articleRevisionClient.update({
    where: {
      id: article.publishedId
    },
    data: {
      likes: {
        increment: delta
      }
    }
  })

  return updatedRevision.likes
}
