import {Page, Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {PageWithRevisions} from '../../db/page'
import {DuplicatePageSlugError, NotFound} from '../../error'
import {authorise} from '../permissions'
import {CanCreatePage, CanDeletePage, CanPublishPage} from '@wepublish/permissions/api'

export const deletePageById = async (
  id: string,
  authenticate: Context['authenticate'],
  prisma: PrismaClient
): Promise<Page> => {
  const {roles} = authenticate()
  authorise(CanDeletePage, roles)

  const page = await prisma.page.findUnique({
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

  if (!page) {
    throw new NotFound('page', id)
  }

  await prisma.$transaction([
    prisma.page.delete({
      where: {
        id
      }
    }),
    prisma.pageRevision.deleteMany({
      where: {
        id: {
          in: [page.draftId, page.pendingId, page.publishedId].filter(Boolean) as string[]
        }
      }
    })
  ])

  return page
}

type CreatePageInput = Omit<Prisma.PageRevisionCreateInput, 'properties' | 'revision'> & {
  properties: Prisma.MetadataPropertyCreateManyPageRevisionInput[]
}

export const createPage = async (
  input: CreatePageInput,
  authenticate: Context['authenticate'],
  page: PrismaClient['page']
) => {
  const {roles} = authenticate()
  authorise(CanCreatePage, roles)
  const {properties, ...data} = input

  return page.create({
    data: {
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

export const duplicatePage = async (
  id: string,
  authenticate: Context['authenticate'],
  pages: Context['loaders']['pages'],
  pageClient: PrismaClient['page']
): Promise<PageWithRevisions> => {
  const {roles} = authenticate()
  authorise(CanCreatePage, roles)

  const page = await pages.load(id)
  if (!page) {
    throw new NotFound('page', id)
  }

  const {
    id: _id,
    updatedAt: _updatedAt,
    createdAt: _createdAt,
    publishedAt: _publishedAt,
    slug: _slug,
    properties,
    ...pageRevision
  } = (page.draft ?? page.pending ?? page.published)!

  const duplicatedProperties = properties.map(property => ({
    key: property.key,
    value: property.value,
    public: property.public
  }))

  const input: Prisma.PageRevisionCreateInput = {
    ...pageRevision,
    properties: {
      createMany: {
        data: duplicatedProperties
      }
    }
  }

  return pageClient.create({
    data: {
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

export const unpublishPage = async (
  id: string,
  authenticate: Context['authenticate'],
  pageClient: PrismaClient['page']
): Promise<PageWithRevisions> => {
  const {roles} = authenticate()
  authorise(CanPublishPage, roles)

  const page = await pageClient.findUnique({
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

  if (!page || !(page.pending || page.published)) {
    throw new NotFound('page', id)
  }

  const {id: revisionId, properties, ...revision} = (page.draft ?? page.pending ?? page.published)!

  return pageClient.update({
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
                pageRevisionId: revisionId
              },
              createMany: {
                data: properties
              }
            }
          }
        }
      },
      pending: {
        delete: Boolean(page.pendingId)
      },
      published: {
        delete: Boolean(page.publishedId)
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

export const publishPage = async (
  id: string,
  input: Pick<Prisma.PageRevisionCreateInput, 'publishAt' | 'publishedAt' | 'updatedAt'>,
  authenticate: Context['authenticate'],
  pageClient: PrismaClient['page']
): Promise<PageWithRevisions | null> => {
  const {roles} = authenticate()
  authorise(CanPublishPage, roles)

  const publishAt = input.publishAt ?? new Date()
  const publishedAt = input.publishedAt
  const updatedAt = input.updatedAt

  const page = await pageClient.findUnique({
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

  if (!page) throw new NotFound('page', id)
  if (!page.draft) return null

  const {id: revisionId, properties, ...revision} = page.draft

  const publishedPage = await pageClient.findFirst({
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

  if (publishedPage && publishedPage.id !== id) {
    throw new DuplicatePageSlugError(
      publishedPage.id,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (publishedPage.published || publishedPage.pending)!.slug!
    )
  }

  if (publishAt > new Date()) {
    return pageClient.update({
      where: {id},
      data: {
        pending: {
          upsert: {
            create: {
              ...revision,
              publishAt,
              publishedAt: publishedAt ?? page?.published?.publishedAt ?? publishAt,
              updatedAt: updatedAt ?? publishAt,
              properties: {
                createMany: {
                  data: properties
                }
              }
            },
            update: {
              ...revision,
              publishAt,
              publishedAt: publishedAt ?? page?.published?.publishedAt ?? publishAt,
              updatedAt: updatedAt ?? publishAt,
              properties: {
                deleteMany: {
                  pageRevisionId: revisionId
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

  return pageClient.update({
    where: {id},
    data: {
      published: {
        upsert: {
          create: {
            ...revision,
            publishedAt: publishedAt ?? page.published?.publishAt ?? publishAt,
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
            publishedAt: publishedAt ?? page.published?.publishAt ?? publishAt,
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
        delete: Boolean(page.pendingId)
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

type UpdatePageInput = Omit<Prisma.PageRevisionCreateInput, 'revision' | 'properties'> & {
  properties: Prisma.MetadataPropertyUncheckedCreateWithoutPageRevisionInput[]
}

export const updatePage = async (
  id: string,
  {properties, ...input}: UpdatePageInput,
  authenticate: Context['authenticate'],
  pageClient: PrismaClient['page']
) => {
  const {roles} = authenticate()
  authorise(CanCreatePage, roles)

  const page = await pageClient.findUnique({
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

  if (!page) {
    throw new NotFound('page', id)
  }

  return pageClient.update({
    where: {id},
    data: {
      draft: {
        upsert: {
          update: {
            ...input,
            revision: page.pending
              ? page.pending.revision + 1
              : page.published
              ? page.published.revision + 1
              : 0,
            updatedAt: null,
            createdAt: page.draft?.createdAt ?? new Date(),
            properties: {
              deleteMany: {
                pageRevisionId: page.draft?.id ?? ''
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
            revision: page.pending
              ? page.pending.revision + 1
              : page.published
              ? page.published.revision + 1
              : 0,
            updatedAt: null,
            createdAt: page.draft?.createdAt ?? new Date(),
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
