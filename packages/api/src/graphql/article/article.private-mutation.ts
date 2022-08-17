import {Article, Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {ArticleWithRevisions} from '../../db/article'
import {DuplicateArticleSlugError, NotFound} from '../../error'
import {authorise, CanCreateArticle, CanDeleteArticle, CanPublishArticle} from '../permissions'

export const deleteArticleById = async (
  id: string,
  authenticate: Context['authenticate'],
  prisma: PrismaClient
): Promise<Article> => {
  const {roles} = authenticate()
  authorise(CanDeleteArticle, roles)

  const article = await prisma.article.findUnique({
    where: {
      id
    },
    include: {
      draft: {
        include: {
          properties: true
        }
      },
      pending: {
        include: {
          properties: true
        }
      },
      published: {
        include: {
          properties: true
        }
      }
    }
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

type CreateArticleInput = Pick<Prisma.ArticleCreateInput, 'shared'> &
  Omit<Prisma.ArticleRevisionCreateInput, 'properties' | 'revision'> & {
    properties: Prisma.MetadataPropertyCreateManyArticleRevisionInput[]
  }

export const createArticle = async (
  input: CreateArticleInput,
  authenticate: Context['authenticate'],
  article: PrismaClient['article']
) => {
  const {roles} = authenticate()
  authorise(CanCreateArticle, roles)
  const {shared, properties, ...data} = input

  return article.create({
    data: {
      shared,
      draft: {
        create: {
          ...data,
          properties: {
            createMany: {
              data: properties
            }
          },
          revision: 0
        }
      }
    },
    include: {
      draft: {
        include: {
          properties: true
        }
      },
      pending: {
        include: {
          properties: true
        }
      },
      published: {
        include: {
          properties: true
        }
      }
    }
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
    ...articleRevision
  } = (article.draft ?? article.pending ?? article.published)!

  const duplicatedProperties = properties.map(property => ({
    key: property.key,
    value: property.value,
    public: property.public
  }))

  const input: Prisma.ArticleRevisionCreateInput = {
    ...articleRevision,
    properties: {
      createMany: {
        data: duplicatedProperties
      }
    }
  }

  return articleClient.create({
    data: {
      shared: article.shared,
      draft: {
        create: input
      }
    },
    include: {
      draft: {
        include: {
          properties: true
        }
      },
      pending: {
        include: {
          properties: true
        }
      },
      published: {
        include: {
          properties: true
        }
      }
    }
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
    include: {
      draft: {
        include: {
          properties: {
            select: {
              key: true,
              value: true,
              public: true
            }
          }
        }
      },
      pending: {
        include: {
          properties: {
            select: {
              key: true,
              value: true,
              public: true
            }
          }
        }
      },
      published: {
        include: {
          properties: {
            select: {
              key: true,
              value: true,
              public: true
            }
          }
        }
      }
    }
  })

  if (!article) {
    throw new NotFound('article', id)
  }

  const {id: revisionId, properties, ...revision} = (article.pending ?? article.published)!

  return articleClient.update({
    where: {id},
    data: {
      draft: {
        upsert: {
          create: {
            ...revision,
            publishAt: null,
            publishedAt: null,
            updatedAt: null,
            properties: {
              createMany: {
                data: properties
              }
            }
          },
          update: {
            ...revision,
            publishAt: null,
            publishedAt: null,
            updatedAt: null,
            properties: {
              deleteMany: {
                articleRevisionId: revisionId
              },
              createMany: {
                data: properties
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
    include: {
      draft: {
        include: {
          properties: true
        }
      },
      pending: {
        include: {
          properties: true
        }
      },
      published: {
        include: {
          properties: true
        }
      }
    }
  })
}

export const publishArticle = async (
  id: string,
  input: Pick<Prisma.ArticleRevisionCreateInput, 'publishAt' | 'publishedAt' | 'updatedAt'>,
  authenticate: Context['authenticate'],
  articleClient: PrismaClient['article']
): Promise<ArticleWithRevisions | null> => {
  const {roles} = authenticate()
  authorise(CanPublishArticle, roles)

  const publishAt = input.publishAt ?? new Date()
  const publishedAt = input.publishedAt
  const updatedAt = input.updatedAt

  const article = await articleClient.findUnique({
    where: {id},
    include: {
      draft: {
        include: {
          properties: {
            select: {
              key: true,
              value: true,
              public: true
            }
          }
        }
      },
      pending: {
        include: {
          properties: {
            select: {
              key: true,
              value: true,
              public: true
            }
          }
        }
      },
      published: {
        include: {
          properties: {
            select: {
              key: true,
              value: true,
              public: true
            }
          }
        }
      }
    }
  })

  if (!article) throw new NotFound('article', id)
  if (!article.draft) return null

  const {id: revisionId, properties, ...revision} = article.draft

  const publishedArticle = await articleClient.findFirst({
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
      draft: true,
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
    return articleClient.update({
      where: {id},
      data: {
        pending: {
          upsert: {
            create: {
              ...revision,
              publishAt: publishAt,
              publishedAt: publishedAt ?? article?.published?.publishedAt ?? publishAt,
              updatedAt: updatedAt ?? publishAt,
              properties: {
                createMany: {
                  data: properties
                }
              }
            },
            update: {
              ...revision,
              publishAt: publishAt,
              publishedAt: publishedAt ?? article?.published?.publishedAt ?? publishAt,
              updatedAt: updatedAt ?? publishAt,
              properties: {
                deleteMany: {
                  articleRevisionId: revisionId
                },
                createMany: {
                  data: properties
                }
              }
            }
          }
        },
        draft: {
          delete: true
        }
      },
      include: {
        draft: {
          include: {
            properties: true
          }
        },
        pending: {
          include: {
            properties: true
          }
        },
        published: {
          include: {
            properties: true
          }
        }
      }
    })
  }

  return articleClient.update({
    where: {id},
    data: {
      published: {
        upsert: {
          create: {
            ...revision,
            publishedAt: publishedAt ?? article.published?.publishAt ?? publishAt,
            updatedAt: updatedAt ?? publishAt,
            publishAt: null,
            properties: {
              createMany: {
                data: properties
              }
            }
          },
          update: {
            ...revision,
            publishedAt: publishedAt ?? article.published?.publishAt ?? publishAt,
            updatedAt: updatedAt ?? publishAt,
            publishAt: null,
            properties: {
              createMany: {
                data: properties
              }
            }
          }
        }
      },
      pending: {
        delete: Boolean(article.pendingId)
      },
      draft: {
        delete: true
      }
    },
    include: {
      draft: {
        include: {
          properties: true
        }
      },
      pending: {
        include: {
          properties: true
        }
      },
      published: {
        include: {
          properties: true
        }
      }
    }
  })
}

type UpdateArticleInput = Pick<Prisma.ArticleCreateInput, 'shared'> &
  Omit<Prisma.ArticleRevisionCreateInput, 'revision' | 'properties'> & {
    properties: Prisma.MetadataPropertyUncheckedCreateWithoutArticleRevisionInput[]
  }

export const updateArticle = async (
  id: string,
  {properties, shared, ...input}: UpdateArticleInput,
  authenticate: Context['authenticate'],
  articleClient: PrismaClient['article']
) => {
  const {roles} = authenticate()
  authorise(CanCreateArticle, roles)

  const article = await articleClient.findUnique({
    where: {id},
    include: {
      draft: {
        include: {
          properties: true
        }
      },
      pending: {
        include: {
          properties: true
        }
      },
      published: {
        include: {
          properties: true
        }
      }
    }
  })

  if (!article) {
    throw new NotFound('article', id)
  }

  return articleClient.update({
    where: {id},
    data: {
      shared,
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
            }
          }
        }
      }
    },
    include: {
      draft: {
        include: {
          properties: true
        }
      },
      pending: {
        include: {
          properties: true
        }
      },
      published: {
        include: {
          properties: true
        }
      }
    }
  })
}
