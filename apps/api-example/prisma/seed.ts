import {
  PaymentPeriodicity,
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
} from '@prisma/client';
import { faker } from '@faker-js/faker';
import { createReadStream } from 'fs';
import { Descendant, Node } from 'slate';
import { seed as rootSeed } from '../../../libs/api/prisma/seed';
import { NovaMediaAdapter } from '../../../libs/api/src/lib/media/novaMediaAdapter';
import { capitalize } from '@mui/material';
import { bootstrap } from '../../media/src/bootstrap';
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
import bcrypt from 'bcrypt';

async function hashPassword(password: string) {
  const hashCostFactor = 12;

  return await bcrypt.hash(password, hashCostFactor);
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
  const text: Descendant[] = Array.from(
    { length: faker.number.int({ min, max }) },
    () => ({
      type: 'paragraph',
      children: [
        {
          text: faker.lorem.paragraph(),
        },
      ],
    })
  );

  return text as Prisma.InputJsonValue;
}

async function seedImages(prisma: PrismaClient) {
  const internalUrl = process.env.MEDIA_SERVER_INTERNAL_URL;

  const mediaAdapter = new NovaMediaAdapter(
    new URL(process.env.MEDIA_SERVER_URL),
    process.env.MEDIA_SERVER_TOKEN,
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
        infoText: getText(1, 3),
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
        infoText: getText(1, 3) as Prisma.InputJsonValue,
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
          bio: getText(4, 9),
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
          description: getText(4, 12) as any,
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
                richText: getText(1, 2) as any,
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
                      richText: getText(3, 10) as any,
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
                      richText: getText(3, 10) as any,
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
                      richText: getText(3, 10) as any,
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
                      richText: getText(1, 1) as any,
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
                text: getText(),
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
  await prisma.paymentMethod.createMany({
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

async function seedMemberPlans(prisma: PrismaClient) {
  const testAbo1 = prisma.memberPlan.create({
    data: {
      active: true,
      name: 'Test-Abo CHF',
      description: [],
      slug: 'test-abo-chf',
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

  const testAbo2 = prisma.memberPlan.create({
    data: {
      active: true,
      name: 'Test-Abo EUR',
      description: [],
      slug: 'test-abo-eur',
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

  await Promise.all([testAbo1, testAbo2]);
}

async function seedSettings(prisma: PrismaClient) {
  const mailprovider = prisma.settingMailProvider.create({
    data: {
      id: 'slackmail',
      name: 'Slackmail',
      type: MailProviderType.SLACK,
      fromAddress: 'dev@wepublish.ch',
      slack_webhookURL: 'https://slackmail.com',
    },
  });

  const payrexx = prisma.settingPaymentProvider.create({
    data: {
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
    },
  });

  const payrexxSubscription = prisma.settingPaymentProvider.create({
    data: {
      id: 'payrexx-subscription',
      type: PaymentProviderType.PAYREXX_SUBSCRIPTION,
      name: 'Payrexx Subscription',
      offSessionPayments: false,
      apiKey:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      webhookEndpointSecret:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      payrexx_instancename: 'payrexx',
    },
  });
  const stripe = prisma.settingPaymentProvider.create({
    data: {
      id: 'stripe',
      type: PaymentProviderType.STRIPE,
      name: 'Stripe',
      offSessionPayments: true,
      apiKey:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      webhookEndpointSecret:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      stripe_methods: [StripePaymentMethod.CARD],
    },
  });

  const stripeCheckout = prisma.settingPaymentProvider.create({
    data: {
      id: 'stripe-checkout',
      type: PaymentProviderType.STRIPE_CHECKOUT,
      name: 'Stripe Checkout',
      offSessionPayments: false,
      apiKey:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      webhookEndpointSecret:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      stripe_methods: [StripePaymentMethod.CARD],
    },
  });

  const mollie = prisma.settingPaymentProvider.create({
    data: {
      id: 'mollie',
      type: PaymentProviderType.MOLLIE,
      name: 'Mollie',
      offSessionPayments: true,
      apiKey:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      webhookEndpointSecret:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      mollie_methods: [MolliePaymentMethod.CREDITCARD],
      mollie_apiBaseUrl: 'https://api.wepublish.dev',
    },
  });

  const bexio = prisma.settingPaymentProvider.create({
    data: {
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
    },
  });

  const noCharge = prisma.settingPaymentProvider.create({
    data: {
      id: 'no-charge',
      type: PaymentProviderType.NO_CHARGE,
      name: 'No Charge',
      offSessionPayments: true,
    },
  });

  const turnstile = prisma.settingChallengeProvider.create({
    data: {
      id: 'turnstile',
      name: 'Turnstile',
      type: ChallengeProviderType.TURNSTILE,
      secret:
        'v1.Y8W3JLH3z5h7U9Lg.ecgpjFza7TLGjgU5TzApvw==.BavphN7gRyEfUls1l3ttNk1+bwo7Uqd+Lvb7mwF+iaSKPXw=',
      siteKey: '1x00000000000000000000AA',
    },
  });

  const prolitteris = prisma.settingTrackingPixel.create({
    data: {
      id: 'turnstile',
      type: TrackingPixelProviderType.prolitteris,
      name: 'Pro Litteris',
      prolitteris_memberNr: '892761',
      prolitteris_onlyPaidContentAccess: false,
      prolitteris_publisherInternalKeyDomain: 'pl02.owen.prolitteris.ch',
      prolitteris_usePublisherInternalKey: true,
    },
  });

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

async function seed() {
  const { app } = await bootstrap(['error']);
  const prisma = new PrismaClient();
  await prisma.$connect();

  try {
    const [adminUserRole, editorUserRole] = await rootSeed(prisma);

    if (!adminUserRole || !editorUserRole) {
      throw new Error('@wepublish/api seeding has not been done');
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
          },
        }),
        prisma.user.update({
          where: {
            email: 'editor@wepublish.ch',
          },
          data: {
            password: await hashPassword('123'),
          },
        }),
      ]);
    } catch {}

    const hasUsers = await prisma.user.count();

    if (hasUsers) {
      throw 'Website Example seeding has already been done. Skipping';
    }
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
        },
      }),
    ]);

    console.log('Seeding Settings');
    await seedSettings(prisma);

    const tags = Array.from({ length: 5 }, () =>
      faker.word.noun().toLowerCase()
    );
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
  } catch (e) {
    if (typeof e === 'string') {
      console.warn(e);
    } else {
      throw e;
    }
  } finally {
    await app.close();
    await prisma.$disconnect();
  }
}

seed();
