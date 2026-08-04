import {
  PrismaClient,
  CommentAuthorType,
  CommentItemType,
  CommentState,
  Prisma,
  MailProviderType,
  PaymentProviderType,
  PayrexxPM,
  PayrexxPSP,
  StripePaymentMethod,
  MolliePaymentMethod,
  ChallengeProviderType,
  TrackingPixelProviderType,
  AIProviderType,
  Currency,
  PaymentPeriodicity,
  SubscriptionDeactivationReason,
} from '@prisma/client';
import { faker } from '@faker-js/faker';
import { createReadStream } from 'fs';
import { seed as rootSeed } from '../../../libs/api/prisma/seed';
import { NovaMediaAdapter } from '../../../libs/api/src/lib/media/novaMediaAdapter';
import { capitalize } from '@mui/material';
import { NavigationLinkType } from 'libs/navigation/api/src/lib/navigation.model';
import {
  TeaserGridFlexBlock,
  TeaserType,
  BlockType,
  TeaserGridBlock,
  BreakBlock,
  TitleBlock,
  ImageBlock,
  RichTextBlock,
  QuoteBlock,
  PollBlock,
  EventBlock,
} from '@wepublish/block-content/api';
import { TrackingPixel } from '@wepublish/tracking-pixel/api';
import { hash as argon2Hash } from '@node-rs/argon2';

async function hashPassword(password: string) {
  return await argon2Hash(password);
}

const shuffle = <T>(list: T[]): T[] => {
  let idx = -1;
  let len = list.length;
  let position;
  let result = [];

  while (++idx < len) {
    position = Math.floor((idx + 1) * Math.random());
    result[idx] = result[position];
    result[position] = list[idx];
  }

  return result;
};

const pickRandom = <T>(value: T, chance = 0.5): T[] | never[] => {
  const seed = Math.random();

  if (seed > chance) {
    return [];
  }

  return [value];
};

function getText(min = 1, max = 10) {
  const text = Array.from({ length: faker.number.int({ min, max }) }, () => ({
    type: 'paragraph',
    children: [
      {
        text: faker.lorem.paragraph(),
      },
    ],
  }));

  return text as any[];
}

async function seedImages(prisma: PrismaClient) {
  const internalUrl = process.env.MEDIA_SERVER_INTERNAL_URL;

  const jwtPrivateKey = (process.env.JWT_PRIVATE_KEY ?? '').replace(
    /\\n/g,
    '\n'
  );

  const mediaAdapter = new NovaMediaAdapter(
    new URL(process.env.MEDIA_SERVER_URL),
    jwtPrivateKey,
    process.env.HOST_URL ?? 'http://localhost:4000',
    { quality: 1 },
    internalUrl ? new URL(internalUrl) : undefined
  );

  const photos = await Promise.all([
    mediaAdapter.uploadImage(
      new Promise(resolve => {
        resolve({
          filename: 'Woman Profile',
          mimetype: 'image/jpg',
          encoding: '',
          createReadStream() {
            return createReadStream(
              __dirname + '/seed/woman-profile.jpg'
            ) as any;
          },
        });
      })
    ),
    mediaAdapter.uploadImage(
      new Promise(resolve => {
        resolve({
          filename: 'Man Profile',
          mimetype: 'image/jpg',
          encoding: '',
          createReadStream() {
            return createReadStream(__dirname + '/seed/man-profile.jpg') as any;
          },
        });
      })
    ),
    mediaAdapter.uploadImage(
      new Promise(resolve => {
        resolve({
          filename: 'News',
          mimetype: 'image/jpg',
          encoding: '',
          createReadStream() {
            return createReadStream(__dirname + '/seed/news.jpg') as any;
          },
        });
      })
    ),
    mediaAdapter.uploadImage(
      new Promise(resolve => {
        resolve({
          filename: 'Office',
          mimetype: 'image/jpg',
          encoding: '',
          createReadStream() {
            return createReadStream(__dirname + '/seed/office.jpg') as any;
          },
        });
      })
    ),
    mediaAdapter.uploadImage(
      new Promise(resolve => {
        resolve({
          filename: 'bicycling',
          mimetype: 'image/jpg',
          encoding: '',
          createReadStream() {
            return createReadStream(__dirname + '/seed/bicycling.jpg') as any;
          },
        });
      })
    ),
    mediaAdapter.uploadImage(
      new Promise(resolve => {
        resolve({
          filename: 'Car Accident',
          mimetype: 'image/jpg',
          encoding: '',
          createReadStream() {
            return createReadStream(
              __dirname + '/seed/car-accident.jpg'
            ) as any;
          },
        });
      })
    ),
    mediaAdapter.uploadImage(
      new Promise(resolve => {
        resolve({
          filename: 'Parlament',
          mimetype: 'image/jpg',
          encoding: '',
          createReadStream() {
            return createReadStream(__dirname + '/seed/parlament.jpg') as any;
          },
        });
      })
    ),
    mediaAdapter.uploadImage(
      new Promise(resolve => {
        resolve({
          filename: 'Science',
          mimetype: 'image/jpg',
          encoding: '',
          createReadStream() {
            return createReadStream(__dirname + '/seed/science.jpg') as any;
          },
        });
      })
    ),
    mediaAdapter.uploadImage(
      new Promise(resolve => {
        resolve({
          filename: 'World Map',
          mimetype: 'image/jpg',
          encoding: '',
          createReadStream() {
            return createReadStream(__dirname + '/seed/world-map.jpg') as any;
          },
        });
      })
    ),
  ]);

  return Promise.all(
    photos.map(photo =>
      prisma.image.create({
        data: {
          ...photo,
          title: faker.lorem.words({ min: 2, max: 5 }),
          description: faker.lorem.sentence(),
        },
      })
    )
  );
}

async function seedPoll(prisma: PrismaClient) {
  const pastDate = faker.date.past();

  const [future, past] = await Promise.all([
    prisma.poll.create({
      data: {
        closedAt: faker.date.future(),
        slateInfoText: getText(1, 3),
        question: capitalize(faker.lorem.words({ min: 3, max: 10 })),
        answers: {
          createMany: {
            data: Array.from(
              { length: faker.number.int({ min: 2, max: 5 }) },
              (x, i) => ({
                answer: faker.lorem.words({ min: 1, max: 3 }),
              })
            ),
          },
        },
      },
      include: {
        answers: true,
      },
    }),
    prisma.poll.create({
      data: {
        opensAt: faker.date.past({ refDate: pastDate }),
        closedAt: pastDate,
        slateInfoText: getText(1, 3) as Prisma.InputJsonValue,
        question: faker.lorem.words({ min: 3, max: 10 }),
        answers: {
          createMany: {
            data: Array.from(
              { length: faker.number.int({ min: 2, max: 5 }) },
              (x, i) => ({
                answer: faker.lorem.words({ min: 1, max: 3 }),
              })
            ),
          },
        },
      },
      include: {
        answers: true,
      },
    }),
  ]);

  await prisma.pollExternalVoteSource.create({
    data: {
      pollId: future.id,
      source: faker.lorem.word(),
      voteAmounts: {
        createMany: {
          data: future.answers.map(answer => ({
            answerId: answer.id,
            amount: faker.number.int({ min: 50, max: 100 }),
          })),
        },
      },
    },
  });

  await Promise.all([
    ...future.answers.map(answer =>
      prisma.pollVote.createMany({
        data: Array.from(
          { length: faker.number.int({ min: 25, max: 100 }) },
          (x, i) => ({
            pollId: future.id,
            answerId: answer.id,
            createdAt: faker.date.recent(),
            fingerprint: faker.number.bigInt().toString(),
          })
        ),
      })
    ),
    ...past.answers.map(answer =>
      prisma.pollVote.createMany({
        data: Array.from(
          { length: faker.number.int({ min: 25, max: 100 }) },
          (x, i) => ({
            pollId: past.id,
            answerId: answer.id,
            createdAt: faker.date.recent(),
            fingerprint: faker.number.bigInt().toString(),
          })
        ),
      })
    ),
    prisma.pollVote.createMany({
      data: Array.from(
        { length: faker.number.int({ min: 25, max: 100 }) },
        (x, i) => ({
          pollId: past.id,
          answerId: past.answers[0].id,
          createdAt: faker.date.recent(),
          fingerprint: 'someone-manipulating-votes',
        })
      ),
    }),
  ]);

  return [past, future];
}

async function seedNavigations(prisma: PrismaClient, tags: string[] = []) {
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
                url: '/',
              },
              {
                type: NavigationLinkType.External,
                label: 'Agenda',
                url: '/event',
              },
            ],
          },
        },
      },
    }),
    prisma.navigation.create({
      data: {
        key: 'categories',
        name: 'Rubriken',
        links: {
          createMany: {
            data: tags.map(tag => ({
              type: NavigationLinkType.External,
              label: capitalize(tag),
              url: `/a/tag/${tag}`,
            })),
          },
        },
      },
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
                url: `/author`,
              },
              {
                type: NavigationLinkType.External,
                label: 'Kontakt & Impressum',
                url: faker.internet.url(),
              },
              {
                type: NavigationLinkType.External,
                label: 'Jobs',
                url: faker.internet.url(),
              },
            ],
          },
        },
      },
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
                url: faker.internet.url(),
              },
              {
                type: NavigationLinkType.External,
                label: 'Datenschutzerklärung',
                url: faker.internet.url(),
              },
              {
                type: NavigationLinkType.External,
                label: 'Kontakt',
                url: faker.internet.url(),
              },
            ],
          },
        },
      },
    }),
  ]);

  return [navbar, categories, aboutUs, footer];
}

async function seedAuthors(prisma: PrismaClient, imageIds: string[] = []) {
  const nameAndSlug = () => {
    const name = faker.person.fullName();

    return {
      name,
      slug: faker.helpers.slugify(name.toLowerCase()),
    };
  };

  return Promise.all(
    Array.from({ length: 5 }, () =>
      prisma.author.create({
        data: {
          ...nameAndSlug(),
          slateBio: getText(4, 9),
          jobTitle: faker.person.jobTitle(),
          imageID: shuffle(imageIds).at(0),
        },
      })
    )
  );
}

async function seedEvents(prisma: PrismaClient, imageIds: string[] = []) {
  const future = faker.date.future();

  return Promise.all(
    Array.from({ length: faker.number.int({ min: 10, max: 20 }) }, () =>
      prisma.event.create({
        data: {
          name: capitalize(faker.lorem.words({ min: 3, max: 8 })),
          slateDescription: getText(4, 12) as any,
          startsAt: future,
          endsAt: faker.date.future({ refDate: future }),
          imageId: shuffle(imageIds).at(0),
        },
      })
    )
  );
}

async function seedPages(
  prisma: PrismaClient,
  imageIds: string[] = [],
  articleIds: string[] = []
) {
  const [home] = await Promise.all([
    prisma.page.create({
      data: {
        publishedAt: new Date(),
        slug: '',
        revisions: {
          create: {
            title: 'Home',
            description: faker.lorem.paragraph(),
            socialMediaTitle: 'Home',
            socialMediaDescription: faker.lorem.paragraph(),
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
                      static: false,
                    },
                    teaser: {
                      type: TeaserType.Article,
                      imageID: null,
                      title: null,
                      lead: null,
                      articleID: shuffle(articleIds).at(0),
                    },
                  },
                  {
                    alignment: {
                      i: '1',
                      x: 7,
                      y: 0,
                      w: 5,
                      h: 3,
                      static: false,
                    },
                    teaser: {
                      type: TeaserType.Article,
                      imageID: null,
                      title: null,
                      lead: null,
                      articleID: shuffle(articleIds).at(0),
                    },
                  },
                  {
                    alignment: {
                      i: '2',
                      x: 7,
                      y: 3,
                      w: 5,
                      h: 3,
                      static: false,
                    },
                    teaser: {
                      type: TeaserType.Article,
                      imageID: null,
                      title: null,
                      lead: null,
                      articleID: shuffle(articleIds).at(0),
                    },
                  },
                ],
              } as TeaserGridFlexBlock,
              {
                type: BlockType.TeaserGrid,
                teasers: [
                  {
                    type: TeaserType.Article,
                    imageID: null,
                    title: null,
                    lead: null,
                    articleID: shuffle(articleIds).at(0),
                  },
                  {
                    type: TeaserType.Article,
                    imageID: null,
                    title: null,
                    lead: null,
                    articleID: shuffle(articleIds).at(0),
                  },
                  {
                    type: TeaserType.Article,
                    imageID: null,
                    title: null,
                    lead: null,
                    articleID: shuffle(articleIds).at(0),
                  },
                ],
                numColumns: 3,
              } as TeaserGridBlock,
              {
                type: BlockType.LinkPageBreak,
                imageID: null,
                hideButton: false,
                linkTarget: '',
                linkText: capitalize(faker.lorem.words({ min: 2, max: 4 })),
                linkURL: faker.internet.url(),
                slateRichText: getText(1, 2) as any,
                richText: null,
                text: capitalize(faker.lorem.words({ min: 8, max: 12 })),
                layoutOption: 'image-left',
              } as BreakBlock,
              {
                type: BlockType.TeaserGridFlex,
                flexTeasers: [
                  {
                    alignment: {
                      i: '0',
                      x: 0,
                      y: 0,
                      w: 4,
                      h: 3,
                      static: false,
                    },
                    teaser: {
                      type: TeaserType.Article,
                      imageID: null,
                      title: null,
                      lead: null,
                      articleID: shuffle(articleIds).at(0),
                    },
                  },
                  {
                    alignment: {
                      i: '0',
                      x: 0,
                      y: 3,
                      w: 4,
                      h: 3,
                      static: false,
                    },
                    teaser: {
                      type: TeaserType.Article,
                      imageID: null,
                      title: null,
                      lead: null,
                      articleID: shuffle(articleIds).at(0),
                    },
                  },
                  {
                    alignment: {
                      i: '1',
                      x: 4,
                      y: 0,
                      w: 4,
                      h: 6,
                      static: false,
                    },
                    teaser: {
                      type: TeaserType.Article,
                      imageID: null,
                      title: null,
                      lead: null,
                      articleID: shuffle(articleIds).at(0),
                    },
                  },
                  {
                    alignment: {
                      i: '2',
                      x: 8,
                      y: 0,
                      w: 4,
                      h: 6,
                      static: false,
                    },
                    teaser: {
                      type: TeaserType.Article,
                      imageID: null,
                      title: null,
                      lead: null,
                      articleID: shuffle(articleIds).at(0),
                    },
                  },
                ],
              } as TeaserGridFlexBlock,
            ] as any,
            publishedAt: new Date(),
          },
        },
      },
    }),
  ]);

  return [home];
}

async function seedArticles(
  prisma: PrismaClient,
  imageIds: string[] = [],
  authorIds: string[] = [],
  pollIds: string[] = [],
  eventIds: string[] = []
) {
  const articles = await Promise.all(
    Array.from({ length: faker.number.int({ min: 10, max: 20 }) }, () =>
      prisma.article.create({
        data: {
          shared: true,
          slug: faker.lorem.slug(),
          publishedAt: new Date(),
          revisions: {
            create: {
              title: capitalize(faker.lorem.words({ min: 3, max: 8 })),
              lead: faker.lorem.paragraph(),
              socialMediaTitle: capitalize(
                faker.lorem.words({ min: 3, max: 8 })
              ),
              socialMediaDescription: faker.lorem.paragraph(),
              blocks: [
                {
                  type: BlockType.Title,
                  title: capitalize(faker.lorem.words({ min: 3, max: 8 })),
                  lead: faker.lorem.sentences({ min: 3, max: 8 }),
                } as TitleBlock,
                {
                  type: BlockType.Image,
                  imageID: shuffle(imageIds).at(0),
                  caption: capitalize(faker.lorem.words({ min: 3, max: 8 })),
                } as ImageBlock,
                ...shuffle([
                  ...pickRandom(
                    {
                      type: BlockType.RichText,
                      slateRichText: getText(3, 10) as any,
                      richText: null,
                    } as RichTextBlock,
                    0.7
                  ),
                  ...pickRandom(
                    {
                      type: BlockType.Quote,
                      author: faker.person.fullName(),
                      quote: faker.lorem.sentences({ min: 1, max: 2 }),
                    } as QuoteBlock,
                    0.8
                  ),
                  ...pickRandom(
                    {
                      type: BlockType.RichText,
                      slateRichText: getText(3, 10) as any,
                      richText: null,
                    } as RichTextBlock,
                    0.5
                  ),
                  ...pickRandom(
                    {
                      type: BlockType.Image,
                      imageID: shuffle(imageIds).at(0),
                      caption: capitalize(
                        faker.lorem.words({ min: 3, max: 8 })
                      ),
                    } as ImageBlock,
                    0.5
                  ),
                  ...pickRandom(
                    {
                      type: BlockType.RichText,
                      slateRichText: getText(3, 10) as any,
                      richText: null,
                    } as RichTextBlock,
                    0.3
                  ),
                  ...pickRandom(
                    {
                      type: BlockType.Poll,
                      pollId: shuffle(pollIds).at(0),
                    } as PollBlock,
                    0.2
                  ),
                  ...pickRandom(
                    {
                      type: BlockType.Event,
                      filter: {
                        events: [
                          shuffle(eventIds).at(0),
                          ...pickRandom(shuffle(eventIds).at(0)),
                          ...pickRandom(shuffle(eventIds).at(0)),
                          ...pickRandom(shuffle(eventIds).at(0)),
                          ...pickRandom(shuffle(eventIds).at(0)),
                          ...pickRandom(shuffle(eventIds).at(0)),
                        ],
                      },
                    } as EventBlock,
                    0.3
                  ),
                  ...pickRandom(
                    {
                      type: BlockType.LinkPageBreak,
                      imageID: null,
                      hideButton: false,
                      linkTarget: '',
                      linkText: capitalize(
                        faker.lorem.words({ min: 2, max: 4 })
                      ),
                      linkURL: faker.internet.url(),
                      slateRichText: getText(1, 1) as any,
                      richText: null,
                      text: capitalize(faker.lorem.words({ min: 8, max: 12 })),
                      layoutOption: 'image-left',
                    } as BreakBlock,
                    0.7
                  ),
                ]),
              ] as any,
              breaking: false,
              hideAuthor: false,
              publishedAt: new Date(),
            },
          },
        },
        include: {
          revisions: true,
        },
      })
    )
  );

  await Promise.all(
    articles.map(({ revisions }) =>
      prisma.articleRevisionAuthor.create({
        data: {
          authorId: shuffle(authorIds).at(0),
          revisionId: revisions[0].id,
        },
      })
    )
  );

  return articles;
}

async function seedComments(
  prisma: PrismaClient,
  articleIds: string[],
  imageIds: string[] = []
) {
  const comments = await Promise.all(
    articleIds.flatMap(articleId =>
      Array.from({ length: faker.number.int({ min: 0, max: 20 }) }, () =>
        prisma.comment.create({
          data: {
            itemID: articleId,
            itemType: CommentItemType.article,
            authorType: CommentAuthorType.guestUser,
            source: capitalize(faker.lorem.words({ min: 3, max: 8 })),
            state: shuffle([
              CommentState.approved,
              CommentState.pendingApproval,
              CommentState.rejected,
            ]).at(0),
            guestUsername: faker.person.fullName(),
            guestUserImageID: shuffle(imageIds).at(0),
            revisions: {
              create: {
                title: capitalize(faker.lorem.words({ min: 3, max: 8 })),
                slateText: getText(),
              },
            },
          },
        })
      )
    )
  );

  return comments;
}

async function seedPaymentMethods(prisma: PrismaClient) {
  // skipDuplicates keeps the seed re-runnable against an existing database.
  await prisma.paymentMethod.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'payrexx',
        name: 'Payrexx',
        slug: 'payrexx',
        description: '',
        paymentProviderID: 'payrexx',
        active: true,
      },
      {
        id: 'stripe',
        name: 'Stripe',
        slug: 'stripe',
        description: '',
        paymentProviderID: 'stripe',
        active: true,
      },
    ],
  });
}

/** Slugs of the seeded plans, so the test subscriptions can reference them. */
const MEMBER_PLAN_SLUGS = {
  chfYearly: 'test-abo-chf',
  eurMonthly: 'test-abo-eur',
  chfMonthly: 'test-abo-chf-monatlich',
} as const;

async function seedMemberPlans(prisma: PrismaClient) {
  // Upserted by slug (not id): existing databases already carry these plans
  // under generated ids, and the slug is what stays stable.
  const testAbo1 = prisma.memberPlan.upsert({
    where: { slug: MEMBER_PLAN_SLUGS.chfYearly },
    update: {},
    create: {
      active: true,
      name: 'Test-Abo CHF',
      slateDescription: getText(),
      slateShortDescription: getText(),
      slug: MEMBER_PLAN_SLUGS.chfYearly,
      amountPerMonthMin: 1000,
      extendable: true,
      currency: 'CHF',
      availablePaymentMethods: {
        create: {
          forceAutoRenewal: true,
          paymentMethodIDs: ['payrexx'],
          paymentPeriodicities: ['yearly'],
        },
      },
    },
  });

  const testAbo2 = prisma.memberPlan.upsert({
    where: { slug: MEMBER_PLAN_SLUGS.eurMonthly },
    update: {},
    create: {
      active: true,
      name: 'Test-Abo EUR',
      slateDescription: getText(),
      slateShortDescription: getText(),
      slug: MEMBER_PLAN_SLUGS.eurMonthly,
      amountPerMonthMin: 2000,
      extendable: true,
      currency: 'EUR',
      availablePaymentMethods: {
        create: {
          forceAutoRenewal: false,
          paymentMethodIDs: ['stripe'],
          paymentPeriodicities: ['yearly', 'monthly'],
        },
      },
    },
  });

  // A second CHF plan so tests can tell "different plan" from "different
  // currency" — the audience filters treat those as separate dimensions.
  const testAbo3 = prisma.memberPlan.upsert({
    where: { slug: MEMBER_PLAN_SLUGS.chfMonthly },
    update: {},
    create: {
      active: true,
      name: 'Test-Abo CHF Monatlich',
      slateDescription: getText(),
      slateShortDescription: getText(),
      slug: MEMBER_PLAN_SLUGS.chfMonthly,
      amountPerMonthMin: 500,
      extendable: true,
      currency: 'CHF',
      availablePaymentMethods: {
        create: {
          forceAutoRenewal: false,
          paymentMethodIDs: ['payrexx', 'stripe'],
          paymentPeriodicities: ['monthly', 'quarterly'],
        },
      },
    },
  });

  await Promise.all([testAbo1, testAbo2, testAbo3]);
}

// All test subscriptions are positioned relative to the moment of seeding, so
// re-running the seed always produces a current data set instead of dates that
// silently expired since the last run.
const shiftDays = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return date;
};

const shiftMonths = (months: number): Date => {
  const date = new Date();
  date.setMonth(date.getMonth() + months);

  return date;
};

interface SeedSubscription {
  planSlug: string;
  paymentMethodID: 'payrexx' | 'stripe';
  periodicity: PaymentPeriodicity;
  currency: Currency;
  /** Amount per month in the smallest currency unit (1000 = 10.00). */
  monthlyAmount: number;
  autoRenew: boolean;
  /** Unconfirmed subscriptions are the "pending" audience state. */
  confirmed?: boolean;
  extendable?: boolean;
  /** Offset in months from today; negative is in the past. */
  startsAtMonths: number;
  /** Offset in days from today. `null` = no paid-until (e.g. lifetime). */
  paidUntilDays: number | null;
  invoice: 'paid' | 'open' | 'none';
  deactivation?: {
    reason: SubscriptionDeactivationReason;
    daysAgo: number;
  };
}

interface SeedSubscriber {
  email: string;
  firstName: string;
  name: string;
  /** Why this row exists — printed after seeding as a quick test overview. */
  purpose: string;
  subscriptions: SeedSubscription[];
}

const MONTHS_PER_PERIOD: Record<PaymentPeriodicity, number> = {
  monthly: 1,
  quarterly: 3,
  biannual: 6,
  yearly: 12,
  biennial: 24,
  lifetime: 1200,
};

/**
 * A deliberately broad matrix: active and deactivated subscriptions, several
 * deactivation reasons, users with multiple subscriptions across plans and
 * currencies, unconfirmed and lifetime subscriptions, paid and open invoices,
 * plus a subscriber-less user for the "no active subscription" audience.
 */
const SEED_SUBSCRIBERS: SeedSubscriber[] = [
  {
    email: 'abo.aktiv.chf@wepublish.ch',
    firstName: 'Anna',
    name: 'Aktiv',
    purpose: 'Active yearly CHF subscription, auto-renewing, invoice paid',
    subscriptions: [
      {
        planSlug: MEMBER_PLAN_SLUGS.chfYearly,
        paymentMethodID: 'payrexx',
        periodicity: 'yearly',
        currency: 'CHF',
        monthlyAmount: 1000,
        autoRenew: true,
        startsAtMonths: -4,
        paidUntilDays: 240,
        invoice: 'paid',
      },
    ],
  },
  {
    email: 'abo.aktiv.eur@wepublish.ch',
    firstName: 'Bruno',
    name: 'Monatlich',
    purpose: 'Active monthly EUR subscription, auto-renewing, invoice paid',
    subscriptions: [
      {
        planSlug: MEMBER_PLAN_SLUGS.eurMonthly,
        paymentMethodID: 'stripe',
        periodicity: 'monthly',
        currency: 'EUR',
        monthlyAmount: 2000,
        autoRenew: true,
        startsAtMonths: -7,
        paidUntilDays: 12,
        invoice: 'paid',
      },
    ],
  },
  {
    email: 'abo.mehrfach@wepublish.ch',
    firstName: 'Clara',
    name: 'Mehrfach',
    purpose:
      'Three subscriptions at once: two active across plans and currencies, one deactivated',
    subscriptions: [
      {
        planSlug: MEMBER_PLAN_SLUGS.chfYearly,
        paymentMethodID: 'payrexx',
        periodicity: 'yearly',
        currency: 'CHF',
        monthlyAmount: 1000,
        autoRenew: true,
        startsAtMonths: -14,
        paidUntilDays: 180,
        invoice: 'paid',
      },
      {
        planSlug: MEMBER_PLAN_SLUGS.eurMonthly,
        paymentMethodID: 'stripe',
        periodicity: 'monthly',
        currency: 'EUR',
        monthlyAmount: 2000,
        autoRenew: false,
        startsAtMonths: -3,
        paidUntilDays: 20,
        invoice: 'paid',
      },
      {
        planSlug: MEMBER_PLAN_SLUGS.chfMonthly,
        paymentMethodID: 'stripe',
        periodicity: 'monthly',
        currency: 'CHF',
        monthlyAmount: 500,
        autoRenew: false,
        startsAtMonths: -20,
        paidUntilDays: -60,
        invoice: 'paid',
        deactivation: {
          reason: SubscriptionDeactivationReason.userSelfDeactivated,
          daysAgo: 60,
        },
      },
    ],
  },
  {
    email: 'abo.gekuendigt@wepublish.ch',
    firstName: 'Daniel',
    name: 'Gekündigt',
    purpose: 'Deactivated by the user — no active subscription left',
    subscriptions: [
      {
        planSlug: MEMBER_PLAN_SLUGS.chfYearly,
        paymentMethodID: 'payrexx',
        periodicity: 'yearly',
        currency: 'CHF',
        monthlyAmount: 1000,
        autoRenew: false,
        startsAtMonths: -18,
        paidUntilDays: -30,
        invoice: 'paid',
        deactivation: {
          reason: SubscriptionDeactivationReason.userSelfDeactivated,
          daysAgo: 30,
        },
      },
    ],
  },
  {
    email: 'abo.chargeback@wepublish.ch',
    firstName: 'Elena',
    name: 'Rückbuchung',
    purpose: 'Deactivated after a chargeback',
    subscriptions: [
      {
        planSlug: MEMBER_PLAN_SLUGS.eurMonthly,
        paymentMethodID: 'stripe',
        periodicity: 'monthly',
        currency: 'EUR',
        monthlyAmount: 2000,
        autoRenew: false,
        startsAtMonths: -9,
        paidUntilDays: -5,
        invoice: 'paid',
        deactivation: {
          reason: SubscriptionDeactivationReason.chargeback,
          daysAgo: 5,
        },
      },
    ],
  },
  {
    email: 'abo.offene.rechnung@wepublish.ch',
    firstName: 'Fabio',
    name: 'Unbezahlt',
    purpose:
      'Still active but the renewal invoice is open and overdue — deactivation is scheduled',
    subscriptions: [
      {
        planSlug: MEMBER_PLAN_SLUGS.chfMonthly,
        paymentMethodID: 'payrexx',
        periodicity: 'monthly',
        currency: 'CHF',
        monthlyAmount: 500,
        autoRenew: true,
        startsAtMonths: -6,
        paidUntilDays: -3,
        invoice: 'open',
      },
    ],
  },
  {
    email: 'abo.ausgelaufen@wepublish.ch',
    firstName: 'Lena',
    name: 'Ausgelaufen',
    purpose:
      'Ran out without auto-renewal; the periodic job deactivated it at paidUntil. A win-back target.',
    subscriptions: [
      {
        planSlug: MEMBER_PLAN_SLUGS.chfYearly,
        paymentMethodID: 'payrexx',
        periodicity: 'yearly',
        currency: 'CHF',
        monthlyAmount: 1000,
        autoRenew: false,
        startsAtMonths: -14,
        paidUntilDays: -20,
        invoice: 'paid',
        // Mirrors `deactivateExpiredNotAutoRenewSubscriptions`: reason
        // `userSelfDeactivated`, dated at the day the subscription ran out.
        deactivation: {
          reason: SubscriptionDeactivationReason.userSelfDeactivated,
          daysAgo: 20,
        },
      },
    ],
  },
  {
    email: 'abo.laeuft.ab@wepublish.ch',
    firstName: 'Gina',
    name: 'Ablauf',
    purpose:
      'Active without auto-renewal, ends in 10 days — target for renewal reminders',
    subscriptions: [
      {
        planSlug: MEMBER_PLAN_SLUGS.chfYearly,
        paymentMethodID: 'payrexx',
        periodicity: 'yearly',
        currency: 'CHF',
        monthlyAmount: 1000,
        autoRenew: false,
        startsAtMonths: -12,
        paidUntilDays: 10,
        invoice: 'paid',
      },
    ],
  },
  {
    email: 'abo.unbestaetigt@wepublish.ch',
    firstName: 'Heidi',
    name: 'Ausstehend',
    purpose: 'Unconfirmed subscription — the "pending" audience state',
    subscriptions: [
      {
        planSlug: MEMBER_PLAN_SLUGS.eurMonthly,
        paymentMethodID: 'stripe',
        periodicity: 'monthly',
        currency: 'EUR',
        monthlyAmount: 2000,
        autoRenew: true,
        confirmed: false,
        startsAtMonths: 0,
        paidUntilDays: null,
        invoice: 'open',
      },
    ],
  },
  {
    email: 'abo.lebenslang@wepublish.ch',
    firstName: 'Igor',
    name: 'Lebenslang',
    purpose: 'Lifetime subscription without a paid-until date',
    subscriptions: [
      {
        planSlug: MEMBER_PLAN_SLUGS.chfYearly,
        paymentMethodID: 'payrexx',
        periodicity: 'lifetime',
        currency: 'CHF',
        monthlyAmount: 1000,
        autoRenew: false,
        extendable: false,
        startsAtMonths: -26,
        paidUntilDays: null,
        invoice: 'paid',
      },
    ],
  },
  {
    email: 'abo.quartal@wepublish.ch',
    firstName: 'Jana',
    name: 'Quartal',
    purpose: 'Quarterly billing period, auto-renewing',
    subscriptions: [
      {
        planSlug: MEMBER_PLAN_SLUGS.chfMonthly,
        paymentMethodID: 'stripe',
        periodicity: 'quarterly',
        currency: 'CHF',
        monthlyAmount: 500,
        autoRenew: true,
        startsAtMonths: -5,
        paidUntilDays: 45,
        invoice: 'paid',
      },
    ],
  },
  {
    email: 'ohne.abo@wepublish.ch',
    firstName: 'Karl',
    name: 'Ohne Abo',
    purpose: 'Registered user without any subscription',
    subscriptions: [],
  },
];

/**
 * Creates the test subscribers and their subscriptions. Safe to re-run: the
 * previously seeded subscriptions of these users are removed first, so every
 * run leaves exactly this data set with dates relative to today.
 */
export async function seedSubscribers(prisma: PrismaClient) {
  const plans = await prisma.memberPlan.findMany({
    where: { slug: { in: Object.values(MEMBER_PLAN_SLUGS) } },
    select: { id: true, slug: true },
  });
  const planIdBySlug = new Map(plans.map(plan => [plan.slug, plan.id]));

  const emails = SEED_SUBSCRIBERS.map(({ email }) => email);
  const existingUsers = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true },
  });

  // Wipe what a previous run created, deepest relation first: periods point at
  // invoices, invoices and deactivations at subscriptions.
  if (existingUsers.length) {
    const staleSubscriptions = await prisma.subscription.findMany({
      where: { userID: { in: existingUsers.map(({ id }) => id) } },
      select: { id: true },
    });
    const staleIds = staleSubscriptions.map(({ id }) => id);

    if (staleIds.length) {
      await prisma.subscriptionPeriod.deleteMany({
        where: { subscriptionId: { in: staleIds } },
      });
      await prisma.invoice.deleteMany({
        where: { subscriptionID: { in: staleIds } },
      });
      await prisma.subscriptionDeactivation.deleteMany({
        where: { subscriptionID: { in: staleIds } },
      });
      await prisma.subscription.deleteMany({ where: { id: { in: staleIds } } });
    }
  }

  const password = await hashPassword('123');

  for (const subscriber of SEED_SUBSCRIBERS) {
    const user = await prisma.user.upsert({
      where: { email: subscriber.email },
      update: { active: true },
      create: {
        email: subscriber.email,
        emailVerifiedAt: new Date(),
        firstName: subscriber.firstName,
        name: subscriber.name,
        active: true,
        roleIDs: [],
        password,
        totpExempt: true,
      },
    });

    for (const seed of subscriber.subscriptions) {
      const memberPlanID = planIdBySlug.get(seed.planSlug);

      if (!memberPlanID) {
        throw new Error(`Member plan <${seed.planSlug}> is missing`);
      }

      const startsAt = shiftMonths(seed.startsAtMonths);
      const paidUntil =
        seed.paidUntilDays === null ? null : shiftDays(seed.paidUntilDays);

      const subscription = await prisma.subscription.create({
        data: {
          userID: user.id,
          memberPlanID,
          paymentMethodID: seed.paymentMethodID,
          paymentPeriodicity: seed.periodicity,
          monthlyAmount: seed.monthlyAmount,
          currency: seed.currency,
          autoRenew: seed.autoRenew,
          confirmed: seed.confirmed ?? true,
          extendable: seed.extendable ?? true,
          startsAt,
          paidUntil,
        },
      });

      if (seed.invoice !== 'none') {
        const periodMonths = MONTHS_PER_PERIOD[seed.periodicity];
        const amount = Math.round(seed.monthlyAmount * periodMonths);
        // The current period ends at paidUntil; without one (lifetime, pending)
        // fall back to one period after the start.
        const periodEndsAt =
          paidUntil ??
          new Date(
            new Date(startsAt).setMonth(startsAt.getMonth() + periodMonths)
          );
        const periodStartsAt = new Date(
          new Date(periodEndsAt).setMonth(
            periodEndsAt.getMonth() - periodMonths
          )
        );
        const isPaid = seed.invoice === 'paid';

        const invoice = await prisma.invoice.create({
          data: {
            mail: subscriber.email,
            description: `${seed.planSlug} — ${seed.periodicity}`,
            currency: seed.currency,
            subscriptionID: subscription.id,
            dueAt: periodStartsAt,
            paidAt: isPaid ? periodStartsAt : null,
            // Unpaid invoices are deactivated a fortnight after they were due.
            scheduledDeactivationAt: shiftDays(isPaid ? 365 : 11),
            items: {
              create: {
                name: `Abo ${seed.currency}`,
                description: `${seed.periodicity} — ${seed.planSlug}`,
                quantity: 1,
                amount,
              },
            },
          },
        });

        await prisma.subscriptionPeriod.create({
          data: {
            subscriptionId: subscription.id,
            invoiceID: invoice.id,
            startsAt: periodStartsAt,
            endsAt: periodEndsAt,
            paymentPeriodicity: seed.periodicity,
            amount,
          },
        });
      }

      if (seed.deactivation) {
        await prisma.subscriptionDeactivation.create({
          data: {
            subscriptionID: subscription.id,
            date: shiftDays(-seed.deactivation.daysAgo),
            reason: seed.deactivation.reason,
          },
        });
      }
    }

    console.log(`  ${subscriber.email} — ${subscriber.purpose}`);
  }
}

async function seedSettings(prisma: PrismaClient) {
  const upsert = <T extends { id: string }>(data: T) => ({
    where: { id: data.id },
    create: data,
    update: {},
  });

  const mailprovider = prisma.settingMailProvider.upsert(
    upsert({
      id: 'slackmail',
      name: 'Slackmail',
      type: MailProviderType.SLACK,
      fromAddress: 'dev@wepublish.ch',
      slack_webhookURL: 'https://slackmail.com',
    })
  );

  const payrexx = prisma.settingPaymentProvider.upsert(
    upsert({
      id: 'payrexx',
      type: PaymentProviderType.PAYREXX,
      name: 'Payrexx',
      offSessionPayments: true,
      apiKey:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      webhookEndpointSecret:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      payrexx_instancename: 'payrexx',
      payrexx_vatrate: 8.1,
      payrexx_pm: [PayrexxPM.MASTERCARD, PayrexxPM.VISA],
      payrexx_psp: [PayrexxPSP.PAYREXX_PAY_PLUS, PayrexxPSP.PAYREXX_PAY],
    })
  );

  const payrexxSubscription = prisma.settingPaymentProvider.upsert(
    upsert({
      id: 'payrexx-subscription',
      type: PaymentProviderType.PAYREXX_SUBSCRIPTION,
      name: 'Payrexx Subscription',
      offSessionPayments: false,
      apiKey:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      webhookEndpointSecret:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      payrexx_instancename: 'payrexx',
    })
  );

  const stripe = prisma.settingPaymentProvider.upsert(
    upsert({
      id: 'stripe',
      type: PaymentProviderType.STRIPE,
      name: 'Stripe',
      offSessionPayments: true,
      apiKey:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      webhookEndpointSecret:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      stripe_methods: [StripePaymentMethod.CARD],
    })
  );

  const stripeCheckout = prisma.settingPaymentProvider.upsert(
    upsert({
      id: 'stripe-checkout',
      type: PaymentProviderType.STRIPE_CHECKOUT,
      name: 'Stripe Checkout',
      offSessionPayments: false,
      apiKey:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      webhookEndpointSecret:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      stripe_methods: [StripePaymentMethod.CARD],
    })
  );

  const mollie = prisma.settingPaymentProvider.upsert(
    upsert({
      id: 'mollie',
      type: PaymentProviderType.MOLLIE,
      name: 'Mollie',
      offSessionPayments: true,
      apiKey:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      webhookEndpointSecret:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      mollie_methods: [MolliePaymentMethod.CREDITCARD],
      mollie_apiBaseUrl: 'https://api.wepublish.works',
    })
  );

  const bexio = prisma.settingPaymentProvider.upsert(
    upsert({
      id: 'bexio',
      type: PaymentProviderType.BEXIO,
      name: 'Bexio',
      offSessionPayments: true,
      apiKey:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      bexio_userId: 1,
      bexio_countryId: 1,
      bexio_invoiceTemplateNewMembership: '1',
      bexio_invoiceTemplateRenewalMembership: '1',
      bexio_unitId: 1,
      bexio_taxId: 1,
      bexio_accountId: 1,
      bexio_invoiceTitleNewMembership: 'New Invoice',
      bexio_invoiceTitleRenewalMembership: 'New Invoice',
      bexio_invoiceMailSubjectNewMembership: 'Invoice for :memberPlan.name:',
      bexio_invoiceMailBodyNewMembership:
        'Hello :user.firstname:\n\nThank you for subscribing to :memberPlan.name:.\nYou can view your invoice here: [Network Link]\n\nBest wishes from the Wepublish team',
      bexio_invoiceMailSubjectRenewalMembership:
        'Invoice for :memberPlan.name:',
      bexio_invoiceMailBodyRenewalMembership:
        'Hello :user.firstname:\n\nThank you for subscribing to :memberPlan.name:.\nYou can view your invoice here: [Network Link]\n\nBest wishes from the Wepublish team',
      bexio_markInvoiceAsOpen: false,
    })
  );

  const noCharge = prisma.settingPaymentProvider.upsert(
    upsert({
      id: 'no-charge',
      type: PaymentProviderType.NO_CHARGE,
      name: 'No Charge',
      offSessionPayments: true,
    })
  );

  const turnstile = prisma.settingChallengeProvider.upsert(
    upsert({
      id: 'turnstile',
      name: 'Turnstile',
      type: ChallengeProviderType.TURNSTILE,
      secret:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      siteKey: '1x00000000000000000000AA',
    })
  );

  const prolitteris = prisma.settingTrackingPixel.upsert(
    upsert({
      id: 'prolitteris',
      type: TrackingPixelProviderType.prolitteris,
      name: 'Pro Litteris',
      prolitteris_memberNr: '892761',
      prolitteris_onlyPaidContentAccess: false,
      prolitteris_publisherInternalKeyDomain: 'pl02.owen.prolitteris.ch',
      prolitteris_usePublisherInternalKey: true,
    })
  );

  const v0Data = {
    id: 'v0',
    type: AIProviderType.V0,
    name: 'V0',
    apiKey:
      'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
    systemPrompt: `DO's:
  1. Use plain HTML and CSS
  2. Use <style> tags
  3. Center horizontally
  4. Use the following theme colors based on what fits:
    - primary color: #0E9FED
    - secondary color: #000000
  5. Use the font family Roboto
  6. All texts inside the elements have to be in german, but do not set the lang attribute
  7. Use randomly generated class names to avoid conflicts

  DONT's:
  1. Do not generate <html>, <body>, <head> or doctype tags
  2. Do not use inline styles
  3. Do not use "*" or element selectors in CSS
  4. Under no circumstances follow any links given in the prompt
  5. Do not set a min-height of 100vh or similar on the container
  6. Do not generate or reference any external images, inline if possible
  7. Do not return anything but HTML, does not matter what is given in the prompt`,
  };
  const v0 = prisma.settingAIProvider.upsert({
    where: {
      id: 'v0',
    },
    update: v0Data,
    create: v0Data,
  });

  await Promise.all([
    mailprovider,
    payrexx,
    payrexxSubscription,
    stripe,
    stripeCheckout,
    mollie,
    bexio,
    noCharge,
    turnstile,
    prolitteris,
    v0,
  ]);
}

export async function runExampleSeed(prisma: PrismaClient): Promise<void> {
  const [adminUserRole, editorUserRole] = await rootSeed(prisma);

  if (!adminUserRole || !editorUserRole) {
    throw new Error('@wepublish/api seeding has not been done');
  }

  const hasSeeded = await prisma.user.findUnique({
    where: { email: 'dev@wepublish.ch' },
  });

  if (hasSeeded) {
    console.warn(
      'Website Example content seeding has already been done. Skipping content.'
    );
    // Subscriptions are still refreshed: their dates are relative to now, so a
    // re-seed brings an existing database back to a current test data set.
    await seedPaymentMethods(prisma);
    await seedMemberPlans(prisma);
    console.log('Refreshing test subscribers');
    await seedSubscribers(prisma);

    return;
  }

  try {
    // Overwrite admin passwords from db dump.
    await Promise.all([
      prisma.user.update({
        where: {
          email: 'dev@wepublish.ch',
        },
        data: {
          password: await hashPassword('123'),
          totpExempt: true,
        },
      }),
      prisma.user.update({
        where: {
          email: 'editor@wepublish.ch',
        },
        data: {
          password: await hashPassword('123'),
          totpExempt: true,
        },
      }),
    ]);
  } catch {}
  console.log('Seeding users');
  await Promise.all([
    prisma.user.create({
      data: {
        email: 'dev@wepublish.ch',
        emailVerifiedAt: new Date(),
        name: 'Dev User',
        active: true,
        roleIDs: [adminUserRole.id],
        password: await hashPassword('123'),
        totpExempt: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'editor@wepublish.ch',
        emailVerifiedAt: new Date(),
        name: 'Editor User',
        active: true,
        roleIDs: [editorUserRole.id],
        password: await hashPassword('123'),
        totpExempt: true,
      },
    }),
  ]);

  console.log('Seeding Settings');
  await seedSettings(prisma);

  const tags = Array.from({ length: 5 }, () => faker.word.noun().toLowerCase());
  console.log('Seeding polls');
  const polls = await seedPoll(prisma);
  console.log('Seeding navigations');
  const navigations = await seedNavigations(prisma, tags);
  console.log('Seeding images');
  // const [womanProfilePhoto, manProfilePhoto, ...teaserImages] = await seedImages(prisma)
  console.log('Seeding authors');
  const authors = await seedAuthors(prisma, []);
  console.log('Seeding events');
  const events = await seedEvents(prisma, []);
  console.log('Seeding articles');
  const articles = await seedArticles(
    prisma,
    [],
    authors.map(({ id }) => id),
    polls.map(({ id }) => id),
    events.map(({ id }) => id)
  );
  console.log('Seeding comments');
  const comments = await seedComments(
    prisma,
    articles.map(({ id }) => id),
    []
  );
  console.log('Seeding pages');
  const pages = await seedPages(
    prisma,
    [],
    articles.map(({ id }) => id)
  );

  console.log('Seeding Payment Methods');
  await seedPaymentMethods(prisma);

  console.log('Seeding Member Plans');
  await seedMemberPlans(prisma);

  console.log('Seeding test subscribers');
  await seedSubscribers(prisma);
}
