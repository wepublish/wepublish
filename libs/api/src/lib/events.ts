import {Prisma, PrismaClient} from '@prisma/client'

// @TODO: move into cron job
export const onFindArticle =
  (prisma: PrismaClient): Prisma.Middleware =>
  async (params, next) => {
    if (!(params.model === 'Article' && params.action.startsWith('find'))) {
      return next(params)
    }

    // skip the call inside this middleware to not create an infinite loop
    if (params.args?.where?.pending?.is?.AND?.publishAt?.lte) {
      return next(params)
    }

    const articles = await prisma.article.findMany({
      where: {
        pending: {
          is: {
            AND: {
              publishAt: {
                lte: new Date()
              }
            }
          }
        }
      },
      include: {
        pending: true,
        published: true
      }
    })

    await Promise.all(
      articles.map(async ({id, publishedId, pending}) => {
        await prisma.article.update({
          where: {
            id
          },
          data: {
            published: {
              connect: {
                id: pending!.id
              }
            },
            pending: {
              disconnect: true
            }
          }
        })
        await prisma.articleRevision.delete({
          where: {
            id: publishedId || undefined
          }
        })
      })
    )

    return next(params)
  }

// @TODO: move into cron job
export const onFindPage =
  (prisma: PrismaClient): Prisma.Middleware =>
  async (params, next) => {
    if (!(params.model === 'Page' && params.action.startsWith('find'))) {
      return next(params)
    }

    // skip the call inside this middleware to not create an infinite loop
    if (params.args?.where?.pending?.is?.AND?.publishAt?.lte) {
      return next(params)
    }

    const pages = await prisma.page.findMany({
      where: {
        pending: {
          is: {
            AND: {
              publishAt: {
                lte: new Date()
              }
            }
          }
        }
      },
      include: {
        pending: true,
        published: true
      }
    })

    await Promise.all(
      pages.map(async ({id, publishedId, pending}) => {
        await prisma.page.update({
          where: {
            id
          },
          data: {
            published: {
              connect: {
                id: pending!.id
              }
            },
            pending: {
              disconnect: true
            }
          }
        })
        await prisma.pageRevision.delete({
          where: {
            id: publishedId || undefined
          }
        })
      })
    )

    return next(params)
  }
