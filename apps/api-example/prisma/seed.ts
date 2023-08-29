import {faker} from '@faker-js/faker'
import {Prisma, PrismaClient} from '@prisma/client'
import {createReadStream} from 'fs'
import {Node} from 'slate'
import {seed as rootSeed} from '../../../libs/api/prisma/seed'
import {NavigationLinkType} from '../../../libs/api/src/lib/db/navigation'
import {hashPassword} from '../../../libs/api/src/lib/db/user'
import {KarmaMediaAdapter} from '../../../libs/api/src/lib/media/karmaMediaAdapter'
import {
  BlockType,
  LinkPageBreakBlock,
  TitleBlock,
  ImageBlock,
  TeaserGridFlexBlock,
  TeaserStyle,
  TeaserType
} from '../../../libs/api/src/lib/db/block'
import {replace, toUpper} from 'ramda'

const capitalize = replace(/^./, toUpper)

function getText(min = 1, max = 10) {
  const text: Node[] = Array.from({length: faker.number.int({min, max})}, () => ({
    type: 'paragraph',
    children: [
      {
        text: faker.lorem.paragraph()
      }
    ]
  }))

  return text as Prisma.InputJsonValue
}

async function seedImages(prisma: PrismaClient) {
  const internalUrl = process.env.MEDIA_SERVER_INTERNAL_URL

  const mediaAdapter = new KarmaMediaAdapter(
    new URL(process.env.MEDIA_SERVER_URL),
    process.env.MEDIA_SERVER_TOKEN,
    internalUrl ? new URL(internalUrl) : undefined
  )

  const photos = await Promise.all([
    mediaAdapter.uploadImage(
      new Promise(resolve => {
        resolve({
          filename: 'Woman Profile',
          mimetype: 'image/jpg',
          encoding: '',
          createReadStream() {
            return createReadStream(__dirname + '/seed/woman-profile.jpg') as any
          }
        })
      })
    ),
    mediaAdapter.uploadImage(
      new Promise(resolve => {
        resolve({
          filename: 'Man Profile',
          mimetype: 'image/jpg',
          encoding: '',
          createReadStream() {
            return createReadStream(__dirname + '/seed/man-profile.jpg') as any
          }
        })
      })
    ),
    mediaAdapter.uploadImage(
      new Promise(resolve => {
        resolve({
          filename: 'News Header',
          mimetype: 'image/jpg',
          encoding: '',
          createReadStream() {
            return createReadStream(__dirname + '/seed/news-header.jpg') as any
          }
        })
      })
    ),
    mediaAdapter.uploadImage(
      new Promise(resolve => {
        resolve({
          filename: 'Article Header',
          mimetype: 'image/jpg',
          encoding: '',
          createReadStream() {
            return createReadStream(__dirname + '/seed/article-header.jpg') as any
          }
        })
      })
    )
  ])

  return Promise.all(
    photos.map(photo =>
      prisma.image.create({
        data: {
          ...photo,
          title: faker.lorem.words({min: 2, max: 5}),
          description: faker.lorem.sentence()
        }
      })
    )
  )
}

async function seedPoll(prisma: PrismaClient) {
  const pastDate = faker.date.past()

  const [future, past] = await Promise.all([
    prisma.poll.create({
      data: {
        closedAt: faker.date.future(),
        infoText: getText(1, 3),
        question: capitalize(faker.lorem.words({min: 3, max: 10})),
        answers: {
          createMany: {
            data: Array.from({length: faker.number.int({min: 2, max: 5})}, (x, i) => ({
              answer: faker.lorem.words({min: 1, max: 3})
            }))
          }
        }
      },
      include: {
        answers: true
      }
    }),
    prisma.poll.create({
      data: {
        opensAt: faker.date.past({refDate: pastDate}),
        closedAt: pastDate,
        infoText: getText(1, 3) as Prisma.InputJsonValue,
        question: faker.lorem.words({min: 3, max: 10}),
        answers: {
          createMany: {
            data: Array.from({length: faker.number.int({min: 2, max: 5})}, (x, i) => ({
              answer: faker.lorem.words({min: 1, max: 3})
            }))
          }
        }
      },
      include: {
        answers: true
      }
    })
  ])

  await prisma.pollExternalVoteSource.create({
    data: {
      pollId: future.id,
      source: faker.lorem.word(),
      voteAmounts: {
        createMany: {
          data: future.answers.map(answer => ({
            answerId: answer.id,
            amount: faker.number.int({min: 50, max: 100})
          }))
        }
      }
    }
  })

  await Promise.all([
    ...future.answers.map(answer =>
      prisma.pollVote.createMany({
        data: Array.from({length: faker.number.int({min: 25, max: 100})}, (x, i) => ({
          answerId: answer.id,
          pollId: future.id
        }))
      })
    ),
    ...past.answers.map(answer =>
      prisma.pollVote.createMany({
        data: Array.from({length: faker.number.int({min: 25, max: 100})}, (x, i) => ({
          answerId: answer.id,
          pollId: past.id
        }))
      })
    )
  ])

  return [past, future]
}

async function seedNavigation(prisma: PrismaClient) {
  const [navbar, categories, aboutUs, footer] = await Promise.all([
    prisma.navigation.create({
      data: {
        key: 'main',
        name: 'Navbar',
        links: {
          createMany: {
            data: [
              {
                type: NavigationLinkType.External,
                label: 'Home',
                url: '/'
              },
              {
                type: NavigationLinkType.External,
                label: 'Agenda',
                url: '/event'
              }
            ]
          }
        }
      }
    }),
    prisma.navigation.create({
      data: {
        key: 'categories',
        name: 'Rubriken',
        links: {
          createMany: {
            data: [
              {
                type: NavigationLinkType.External,
                label: faker.word.noun(),
                url: `/a/tag/${faker.word.noun().toLowerCase()}`
              },
              {
                type: NavigationLinkType.External,
                label: faker.word.noun(),
                url: `/a/tag/${faker.word.noun().toLowerCase()}`
              },
              {
                type: NavigationLinkType.External,
                label: faker.word.noun(),
                url: `/a/tag/${faker.word.noun().toLowerCase()}`
              }
            ]
          }
        }
      }
    }),
    prisma.navigation.create({
      data: {
        key: 'about-us',
        name: 'Über uns',
        links: {
          createMany: {
            data: [
              {
                type: NavigationLinkType.External,
                label: 'Team',
                url: `/author`
              },
              {
                type: NavigationLinkType.External,
                label: 'Kontakt & Impressum',
                url: faker.internet.url()
              },
              {
                type: NavigationLinkType.External,
                label: 'Jobs',
                url: faker.internet.url()
              }
            ]
          }
        }
      }
    }),
    prisma.navigation.create({
      data: {
        key: 'footer',
        name: 'Footer',
        links: {
          createMany: {
            data: [
              {
                type: NavigationLinkType.External,
                label: 'AGBs',
                url: faker.internet.url()
              },
              {
                type: NavigationLinkType.External,
                label: 'Datenschutzerklärung',
                url: faker.internet.url()
              },
              {
                type: NavigationLinkType.External,
                label: 'Kontakt',
                url: faker.internet.url()
              }
            ]
          }
        }
      }
    })
  ])

  return [navbar, categories, aboutUs, footer]
}

async function seedAuthor(prisma: PrismaClient, imageIds: string[] = []) {
  const nameAndSlug = () => {
    const name = faker.person.fullName()

    return {
      name,
      slug: faker.helpers.slugify(name.toLowerCase())
    }
  }

  return Promise.all(
    Array.from({length: 5}, () =>
      prisma.author.create({
        data: {
          ...nameAndSlug(),
          bio: getText(4, 9),
          jobTitle: faker.person.jobTitle(),
          imageID: imageIds[Math.floor(Math.random() * imageIds.length)]
        }
      })
    )
  )
}

async function seedEvent(prisma: PrismaClient, imageIds: string[] = []) {
  const future = faker.date.future()

  return Promise.all(
    Array.from({length: faker.number.int({min: 10, max: 20})}, () =>
      prisma.event.create({
        data: {
          name: capitalize(faker.lorem.words({min: 3, max: 8})),
          description: getText(4, 12) as any,
          startsAt: future,
          endsAt: faker.date.past({refDate: future}),
          imageId: imageIds[Math.floor(Math.random() * imageIds.length)]
        }
      })
    )
  )
}

async function seedPages(prisma: PrismaClient, imageIds: string[] = [], articleIds: string[] = []) {
  const [home] = await Promise.all([
    prisma.page.create({
      data: {
        published: {
          create: {
            title: 'Home',
            description: faker.lorem.paragraph(),
            socialMediaTitle: 'Home',
            socialMediaDescription: faker.lorem.paragraph(),
            slug: '',
            revision: 0,
            blocks: [
              {
                type: BlockType.TeaserGridFlex,
                flexTeasers: [
                  {
                    alignment: {
                      i: '0',
                      x: 0,
                      y: 0,
                      w: 7,
                      h: 6,
                      static: false
                    },
                    teaser: {
                      type: TeaserType.Article,
                      style: TeaserStyle.Default,
                      imageID: null,
                      title: null,
                      lead: null,
                      articleID: articleIds[Math.floor(Math.random() * articleIds.length)]
                    }
                  },
                  {
                    alignment: {
                      i: '1',
                      x: 7,
                      y: 0,
                      w: 5,
                      h: 3,
                      static: false
                    },
                    teaser: {
                      type: TeaserType.Article,
                      style: TeaserStyle.Light,
                      imageID: null,
                      title: null,
                      lead: null,
                      articleID: articleIds[Math.floor(Math.random() * articleIds.length)]
                    }
                  },
                  {
                    alignment: {
                      i: '2',
                      x: 7,
                      y: 3,
                      w: 5,
                      h: 3,
                      static: false
                    },
                    teaser: {
                      type: TeaserType.Article,
                      style: TeaserStyle.Light,
                      imageID: null,
                      title: null,
                      lead: null,
                      articleID: articleIds[Math.floor(Math.random() * articleIds.length)]
                    }
                  }
                ]
              } as TeaserGridFlexBlock,
              {
                type: BlockType.LinkPageBreak,
                imageID: imageIds[Math.floor(Math.random() * imageIds.length)],
                hideButton: false,
                linkTarget: '',
                linkText: '',
                linkURL: '',
                richText: getText() as any,
                text: capitalize(faker.lorem.words({min: 3, max: 8})),
                layoutOption: 'image-left'
              } as LinkPageBreakBlock,
              {
                type: BlockType.LinkPageBreak,
                imageID: imageIds[Math.floor(Math.random() * imageIds.length)],
                hideButton: false,
                linkTarget: '',
                linkText: '',
                linkURL: '',
                richText: getText() as any,
                text: capitalize(faker.lorem.words({min: 3, max: 8})),
                layoutOption: 'image-right'
              } as LinkPageBreakBlock
            ] as any,
            publishedAt: new Date(),
            updatedAt: new Date(),
            createdAt: new Date()
          }
        }
      }
    })
  ])

  return [home]
}

async function seedArticles(
  prisma: PrismaClient,
  imageIds: string[] = [],
  authorIds: string[] = []
) {
  const articles = await Promise.all(
    Array.from({length: faker.number.int({min: 10, max: 20})}, () =>
      prisma.article.create({
        data: {
          shared: false,
          published: {
            create: {
              title: capitalize(faker.lorem.words({min: 3, max: 8})),
              lead: faker.lorem.paragraph(),
              socialMediaTitle: capitalize(faker.lorem.words({min: 3, max: 8})),
              socialMediaDescription: faker.lorem.paragraph(),
              slug: faker.lorem.slug(),
              revision: 0,
              blocks: [
                {
                  type: BlockType.Title,
                  title: capitalize(faker.lorem.words({min: 3, max: 8})),
                  lead: faker.lorem.sentences({min: 3, max: 8})
                } as TitleBlock,
                {
                  type: BlockType.Image,
                  imageID: imageIds[Math.floor(Math.random() * imageIds.length)],
                  caption: capitalize(faker.lorem.words({min: 3, max: 8}))
                } as ImageBlock
              ] as any,
              breaking: false,
              hideAuthor: false,
              publishedAt: new Date(),
              updatedAt: new Date(),
              createdAt: new Date()
            }
          }
        }
      })
    )
  )

  await Promise.all(
    articles.map(({publishedId}) =>
      prisma.articleRevisionAuthor.create({
        data: {
          authorId: authorIds[Math.floor(Math.random() * authorIds.length)],
          revisionId: publishedId
        }
      })
    )
  )

  return articles
}

async function seed() {
  const prisma = new PrismaClient()
  await prisma.$connect()

  try {
    const [adminUserRole, editorUserRole] = await rootSeed(prisma)

    if (!adminUserRole || !editorUserRole) {
      throw new Error('@wepublish/api seeding has not been done')
    }

    const hasUsers = await prisma.user.count({})

    if (hasUsers) {
      throw 'Website Example seeding has already been done. Skipping'
    }

    const [womanProfilePhoto, manProfilePhoto, news, article] = await seedImages(prisma)

    const [pastPoll, futurePoll] = await seedPoll(prisma)
    const [navbarNavigation, categoriesNavigation, aboutUsNavigation, footerNavigation] =
      await seedNavigation(prisma)

    const authors = await seedAuthor(prisma, [womanProfilePhoto.id, manProfilePhoto.id])
    const articles = await seedArticles(
      prisma,
      [news.id, article.id],
      authors.map(({id}) => id)
    )

    const events = await seedEvent(prisma, [news.id, article.id])

    await seedPages(
      prisma,
      [news.id, article.id],
      articles.map(({id}) => id)
    )

    await prisma.user.create({
      data: {
        email: 'dev@wepublish.ch',
        emailVerifiedAt: new Date(),
        name: 'Dev User',
        active: true,
        roleIDs: [adminUserRole.id],
        password: await hashPassword('123')
      }
    })

    await prisma.user.create({
      data: {
        email: 'editor@wepublish.ch',
        emailVerifiedAt: new Date(),
        name: 'Editor User',
        active: true,
        roleIDs: [editorUserRole.id],
        password: await hashPassword('123')
      }
    })
  } catch (e) {
    if (typeof e === 'string') {
      console.warn(e)
    } else {
      throw e
    }
  } finally {
    await prisma.$disconnect()
  }
}

seed()
