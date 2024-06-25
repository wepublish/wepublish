import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {ArticleWithRevisions} from '../../db/article'
import {DuplicateArticleSlugError, NotFound} from '../../error'
import {authorise} from '../permissions'
import {CanCreateArticle, CanDeleteArticle, CanPublishArticle} from '@wepublish/permissions/api'

const fullArticleInclude = {
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
} as const

export const deleteArticleById = async (
  id: string,
  authenticate: Context['authenticate'],
  prisma: PrismaClient
): Promise<ArticleWithRevisions> => {
  const {roles} = authenticate()
  authorise(CanDeleteArticle, roles)

  const article = await prisma.article.findUnique({
    where: {
      id
    },
    include: fullArticleInclude
  })

  if (!article) {
    throw new NotFound('article', id)
  }

  await prisma.$transaction([
    prisma.article.delete({
      where: {
        id
      }
    }),
    prisma.articleRevision.deleteMany({
      where: {
        id: {
          in: [article.draftId, article.pendingId, article.publishedId].filter(Boolean) as string[]
        }
      }
    })
  ])

  return article
}

type CreateArticleInput = Pick<Prisma.ArticleCreateInput, 'shared' | 'hidden'> &
  Omit<Prisma.ArticleRevisionCreateInput, 'properties' | 'revision'> & {
    properties: Prisma.MetadataPropertyCreateManyArticleRevisionInput[]
    authorIDs: Prisma.ArticleRevisionAuthorCreateManyRevisionInput['authorId'][]
    socialMediaAuthorIDs: Prisma.ArticleRevisionSocialMediaAuthorCreateManyRevisionInput['authorId'][]
  }

export const createArticle = async (
  input: CreateArticleInput,
  authenticate: Context['authenticate'],
  article: PrismaClient['article']
) => {
  const {roles} = authenticate()
  authorise(CanCreateArticle, roles)
  const {shared, hidden, properties, authorIDs, socialMediaAuthorIDs, tags, ...data} = input

  return article.create({
    data: {
      shared,
      hidden,
      draft: {
        create: {
          ...data,
          properties: {
            createMany: {
              data: properties
            }
          },
          authors: {
            createMany: {
              data: authorIDs.map(authorId => ({authorId}))
            }
          },
          socialMediaAuthors: {
            createMany: {
              data: socialMediaAuthorIDs.map(authorId => ({authorId}))
            }
          },
          revision: 0
        }
      },
      tags: {
        createMany: {
          data: (tags as string[])?.map(tagId => ({
            tagId
          })),
          skipDuplicates: true
        }
      }
    },
    include: fullArticleInclude
  })
}

export const duplicateArticle = async (
  id: string,
  authenticate: Context['authenticate'],
  articles: Context['loaders']['articles'],
  articleClient: PrismaClient['article']
): Promise<ArticleWithRevisions> => {
  const {roles} = authenticate()
  authorise(CanCreateArticle, roles)

  const article = await articles.load(id)

  if (!article) {
    throw new NotFound('article', id)
  }

  const {
    id: _id,
    updatedAt: _updatedAt,
    createdAt: _createdAt,
    publishedAt: _publishedAt,
    slug: _slug,
    properties,
    authors,
    socialMediaAuthors,
    ...articleRevision
  } = (article.draft ?? article.pending ?? article.published)!

  const duplicatedProperties = properties.map(property => ({
    key: property.key,
    value: property.value,
    public: property.public
  }))

  const input: Prisma.ArticleRevisionCreateInput = {
    ...articleRevision,
    blocks: articleRevision.blocks || Prisma.JsonNull,
    properties: {
      createMany: {
        data: duplicatedProperties
      }
    },
    authors: {
      createMany: {
        data: authors.map(({authorId}) => ({authorId}))
      }
    },
    socialMediaAuthors: {
      createMany: {
        data: socialMediaAuthors.map(({authorId}) => ({authorId}))
      }
    }
  }

  return articleClient.create({
    data: {
      shared: article.shared,
      hidden: article.hidden,
      tags: {
        createMany: {
          data: article.tags.map(({tagId}) => ({
            tagId
          })),
          skipDuplicates: true
        }
      },
      draft: {
        create: input
      }
    },
    include: fullArticleInclude
  })
}

export const unpublishArticle = async (
  id: string,
  authenticate: Context['authenticate'],
  articleClient: PrismaClient['article']
): Promise<ArticleWithRevisions> => {
  const {roles} = authenticate()
  authorise(CanPublishArticle, roles)

  const article = await articleClient.findUnique({
    where: {id},
    include: fullArticleInclude
  })

  if (!article) {
    throw new NotFound('article', id)
  }

  const {
    id: revisionId,
    properties,
    authors,
    socialMediaAuthors,
    ...revision
  } = (article.draft ?? article.pending ?? article.published)!

  const duplicatedProperties = properties.map(property => ({
    key: property.key,
    value: property.value,
    public: property.public
  }))

  return articleClient.update({
    where: {id},
    data: {
      draft: {
        upsert: {
          create: {
            ...revision,
            blocks: revision.blocks || Prisma.JsonNull,
            publishAt: null,
            publishedAt: null,
            updatedAt: null,
            properties: {
              createMany: {
                data: duplicatedProperties
              }
            },
            authors: {
              createMany: {
                data: authors.map(({authorId}) => ({authorId}))
              }
            },
            socialMediaAuthors: {
              createMany: {
                data: socialMediaAuthors.map(({authorId}) => ({authorId}))
              }
            }
          },
          update: {
            ...revision,
            blocks: revision.blocks || Prisma.JsonNull,
            publishAt: null,
            publishedAt: null,
            updatedAt: null,
            properties: {
              deleteMany: {
                articleRevisionId: revisionId
              },
              createMany: {
                data: duplicatedProperties
              }
            },
            authors: {
              deleteMany: {
                revisionId
              },
              createMany: {
                data: authors.map(({authorId}) => ({authorId}))
              }
            },
            socialMediaAuthors: {
              deleteMany: {
                revisionId
              },
              createMany: {
                data: socialMediaAuthors.map(({authorId}) => ({authorId}))
              }
            }
          }
        }
      },
      pending: {
        delete: Boolean(article.pendingId)
      },
      published: {
        delete: Boolean(article.publishedId)
      }
    },
    include: fullArticleInclude
  })
}

export const publishArticle = async (
  id: string,
  input: Pick<Prisma.ArticleRevisionCreateInput, 'publishAt' | 'publishedAt' | 'updatedAt'>,
  authenticate: Context['authenticate'],
  prisma: PrismaClient
): Promise<ArticleWithRevisions | null> => {
  const {roles} = authenticate()
  authorise(CanPublishArticle, roles)

  const publishAt = input.publishAt ?? new Date()
  const publishedAt = input.publishedAt
  const updatedAt = input.updatedAt

  const article = await prisma.article.findUnique({
    where: {id},
    include: fullArticleInclude
  })

  if (!article) throw new NotFound('article', id)
  if (!article.draft) return null

  const {id: revisionId, properties, authors, socialMediaAuthors, ...revision} = article.draft

  const duplicatedProperties = properties.map(property => ({
    key: property.key,
    value: property.value,
    public: property.public
  }))

  const publishedArticle = await prisma.article.findFirst({
    where: {
      OR: [
        {
          published: {
            is: {
              slug: revision.slug
            }
          }
        },
        {
          pending: {
            is: {
              slug: revision.slug
            }
          }
        }
      ]
    },
    include: {
      pending: true,
      published: true
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
    const deletedOldRevisions = prisma.articleRevision.deleteMany({
      where: {
        id: {
          in: [article.pending?.id].filter((id): id is string => Boolean(id))
        }
      }
    })

    const [, updatedArticle] = await prisma.$transaction([
      deletedOldRevisions,
      prisma.article.update({
        where: {id},
        data: {
          pending: {
            create: {
              ...revision,
              blocks: revision.blocks || Prisma.JsonNull,
              publishAt,
              publishedAt: publishedAt ?? article?.published?.publishedAt ?? publishAt,
              updatedAt: updatedAt ?? publishAt,
              properties: {
                createMany: {
                  data: duplicatedProperties
                }
              },
              authors: {
                createMany: {
                  data: authors.map(({authorId}) => ({authorId}))
                }
              },
              socialMediaAuthors: {
                createMany: {
                  data: socialMediaAuthors.map(({authorId}) => ({authorId}))
                }
              }
            }
          },
          draft: {
            delete: true
          }
        },
        include: fullArticleInclude
      })
    ])

    return updatedArticle
  }

  const deletedOldRevisions = prisma.articleRevision.deleteMany({
    where: {
      id: {
        in: [article.pending?.id, article.published?.id].filter((id): id is string => Boolean(id))
      }
    }
  })

  const [, updatedArticle] = await prisma.$transaction([
    deletedOldRevisions,
    prisma.article.update({
      where: {id},
      data: {
        published: {
          create: {
            ...revision,
            blocks: revision.blocks || Prisma.JsonNull,
            publishedAt: publishedAt ?? article.published?.publishAt ?? publishAt,
            updatedAt: updatedAt ?? publishAt,
            publishAt: null,
            properties: {
              createMany: {
                data: duplicatedProperties
              }
            },
            authors: {
              createMany: {
                data: authors.map(({authorId}) => ({authorId}))
              }
            },
            socialMediaAuthors: {
              createMany: {
                data: socialMediaAuthors.map(({authorId}) => ({authorId}))
              }
            }
          }
        },
        draft: {
          delete: true
        }
      },
      include: fullArticleInclude
    })
  ])

  return updatedArticle
}

type UpdateArticleInput = Pick<Prisma.ArticleCreateInput, 'shared' | 'hidden'> &
  Omit<Prisma.ArticleRevisionCreateInput, 'revision' | 'properties' | 'tags'> & {
    tags: string[]
    properties: Prisma.MetadataPropertyUncheckedCreateWithoutArticleRevisionInput[]
    authorIDs: Prisma.ArticleRevisionAuthorCreateManyRevisionInput['authorId'][]
    socialMediaAuthorIDs: Prisma.ArticleRevisionSocialMediaAuthorCreateManyRevisionInput['authorId'][]
  }

export const updateArticle = async (
  id: string,
  {properties, authorIDs, socialMediaAuthorIDs, shared, hidden, tags, ...input}: UpdateArticleInput,
  authenticate: Context['authenticate'],
  articleClient: PrismaClient['article'],
  articleLoader: Context['loaders']['articles']
) => {
  const {roles} = authenticate()
  authorise(CanCreateArticle, roles)

  const article = await articleLoader.load(id)

  if (!article) {
    throw new NotFound('article', id)
  }

  return articleClient.update({
    where: {id},
    data: {
      shared,
      hidden,
      draft: {
        upsert: {
          update: {
            ...input,
            revision: article.pending
              ? article.pending.revision + 1
              : article.published
              ? article.published.revision + 1
              : 0,
            updatedAt: null,
            createdAt: article.draft?.createdAt ?? new Date(),
            properties: {
              deleteMany: {
                articleRevisionId: article.draft?.id ?? ''
              },
              createMany: {
                data: properties.map(property => ({
                  key: property.key,
                  value: property.value,
                  public: property.public
                }))
              }
            },
            authors: {
              deleteMany: {
                revisionId: article.draft?.id ?? ''
              },
              createMany: {
                data: authorIDs.map(authorId => ({authorId}))
              }
            },
            socialMediaAuthors: {
              deleteMany: {
                revisionId: article.draft?.id ?? ''
              },
              createMany: {
                data: socialMediaAuthorIDs.map(authorId => ({authorId}))
              }
            }
          },
          create: {
            ...input,
            revision: article.pending
              ? article.pending.revision + 1
              : article.published
              ? article.published.revision + 1
              : 0,
            updatedAt: null,
            createdAt: article.draft?.createdAt ?? new Date(),
            properties: {
              createMany: {
                data: properties.map(property => ({
                  key: property.key,
                  value: property.value,
                  public: property.public
                }))
              }
            },
            authors: {
              createMany: {
                data: authorIDs.map(authorId => ({authorId}))
              }
            },
            socialMediaAuthors: {
              createMany: {
                data: socialMediaAuthorIDs.map(authorId => ({authorId}))
              }
            }
          }
        }
      },
      tags: {
        deleteMany: {
          tagId: {
            notIn: tags
          }
        },
        createMany: {
          data: tags
            .filter(tagId => !article.tags.some(tag => tag.tagId === tagId))
            .map(tagId => ({
              tagId
            }))
        }
      }
    },
    include: fullArticleInclude
  })
}
