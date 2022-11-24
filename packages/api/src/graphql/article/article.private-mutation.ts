import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {ArticleWithRevisions} from '../../db/article'
import {DuplicateArticleSlugError, NotFound} from '../../error'
import {authorise, CanCreateArticle, CanDeleteArticle, CanPublishArticle} from '../permissions'

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
  const {shared, properties, authorIDs, socialMediaAuthorIDs, ...data} = input

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
      }
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
      draft: {
        create: input
      }
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
          },
          authors: true,
          socialMediaAuthors: true
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
          },
          authors: true,
          socialMediaAuthors: true
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
          },
          authors: true,
          socialMediaAuthors: true
        }
      }
    }
  })

  if (!article) {
    throw new NotFound('article', id)
  }

  const {id: revisionId, properties, authors, socialMediaAuthors, ...revision} = (article.draft ??
    article.pending ??
    article.published)!

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
          },
          authors: true,
          socialMediaAuthors: true
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
          },
          authors: true,
          socialMediaAuthors: true
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
          },
          authors: true,
          socialMediaAuthors: true
        }
      }
    }
  })

  if (!article) throw new NotFound('article', id)
  if (!article.draft) return null

  const {id: revisionId, properties, authors, socialMediaAuthors, ...revision} = article.draft

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
              publishAt,
              publishedAt: publishedAt ?? article?.published?.publishedAt ?? publishAt,
              updatedAt: updatedAt ?? publishAt,
              properties: {
                createMany: {
                  data: properties
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
              publishAt,
              publishedAt: publishedAt ?? article?.published?.publishedAt ?? publishAt,
              updatedAt: updatedAt ?? publishAt,
              properties: {
                deleteMany: {
                  articleRevisionId: revisionId
                },
                createMany: {
                  data: properties
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
        draft: {
          delete: true
        }
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
            publishedAt: publishedAt ?? article.published?.publishAt ?? publishAt,
            updatedAt: updatedAt ?? publishAt,
            publishAt: null,
            properties: {
              deleteMany: {
                articleRevisionId: revisionId
              },
              createMany: {
                data: properties
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
      draft: {
        delete: true
      }
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
}

type UpdateArticleInput = Pick<Prisma.ArticleCreateInput, 'shared'> &
  Omit<Prisma.ArticleRevisionCreateInput, 'revision' | 'properties'> & {
    properties: Prisma.MetadataPropertyUncheckedCreateWithoutArticleRevisionInput[]
    authorIDs: Prisma.ArticleRevisionAuthorCreateManyRevisionInput['authorId'][]
    socialMediaAuthorIDs: Prisma.ArticleRevisionSocialMediaAuthorCreateManyRevisionInput['authorId'][]
  }

export const updateArticle = async (
  id: string,
  {properties, authorIDs, socialMediaAuthorIDs, shared, ...input}: UpdateArticleInput,
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
      }
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
}
