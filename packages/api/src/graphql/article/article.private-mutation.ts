import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {DuplicateArticleSlugError, NotFound} from '../../error'
import {authorise, CanCreateArticle, CanDeleteArticle, CanPublishArticle} from '../permissions'

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

export const unpublishArticle = async (
  id: string,
  authenticate: Context['authenticate'],
  articleClient: PrismaClient['article']
) => {
  const {roles} = authenticate()
  authorise(CanPublishArticle, roles)

  const article = await articleClient.findUnique({where: {id}})

  if (!article) {
    throw new NotFound('article', id)
  }

  return articleClient.update({
    where: {id},
    data: {
      draft: {
        ...(article.pending ?? article.published)!,
        publishAt: null,
        publishedAt: null,
        updatedAt: null
      },
      pending: null,
      published: null
    }
  })
}

export const publishArticle = async (
  id: string,
  input: Pick<Prisma.ArticleRevisionCreateInput, 'publishAt' | 'publishedAt' | 'updatedAt'>,
  authenticate: Context['authenticate'],
  articleClient: PrismaClient['article']
) => {
  const {roles} = authenticate()
  authorise(CanPublishArticle, roles)

  const publishAt = input.publishAt ?? new Date()
  const publishedAt = input.publishedAt
  const updatedAt = input.updatedAt

  const article = await articleClient.findUnique({where: {id}})

  if (!article) throw new NotFound('article', id)
  if (!article.draft) return null

  const publishedArticle = await articleClient.findFirst({
    where: {
      OR: [
        {
          published: {
            is: {
              slug: article.draft.slug
            }
          }
        },
        {
          pending: {
            is: {
              slug: article.draft.slug
            }
          }
        }
      ]
    }
  })

  if (publishedArticle && publishedArticle.id !== id) {
    throw new DuplicateArticleSlugError(
      publishedArticle.id,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (publishedArticle.published || publishedArticle.pending)!.slug!
    )
  }

  if (publishAt > new Date()) {
    return articleClient.update({
      where: {id},
      data: {
        pending: {
          ...article.draft,
          publishAt: publishAt,
          publishedAt: publishedAt ?? article?.published?.publishedAt ?? publishAt,
          updatedAt: updatedAt ?? publishAt
        },
        draft: null
      }
    })
  }

  return articleClient.update({
    where: {id},
    data: {
      published: {
        ...article.draft,
        publishedAt: publishedAt ?? article.published?.publishAt ?? publishAt,
        updatedAt: updatedAt ?? publishAt,
        publishAt: null
      },
      pending: null,
      draft: null
    }
  })
}

export const updateArticle = async (
  id: string,
  input: Omit<
    Prisma.ArticleRevisionCreateInput,
    'revision' | 'createdAt' | 'updatedAt' | 'publishAt' | 'publishedAt'
  >,
  authenticate: Context['authenticate'],
  articleClient: PrismaClient['article']
) => {
  const {roles} = authenticate()
  authorise(CanCreateArticle, roles)

  const article = await articleClient.findUnique({where: {id}})

  if (!article) {
    throw new NotFound('article', id)
  }

  return articleClient.update({
    where: {id},
    data: {
      draft: {
        ...input,
        revision: article.pending
          ? article.pending.revision + 1
          : article.published
          ? article.published.revision + 1
          : 0,
        updatedAt: new Date(),
        createdAt: article.draft?.createdAt ?? new Date()
      }
    }
  })
}
