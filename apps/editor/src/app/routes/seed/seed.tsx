import { faker } from '@faker-js/faker';
import { capitalize } from '@mui/material';
import {
  ArticleListDocument,
  ArticleListQueryVariables,
  AuthorListDocument,
  BlockContentInput,
  BlockStyle,
  BlockStylesDocument,
  BreakBlockInput,
  CommentItemType,
  CommentListDocument,
  CreateArticleMutationVariables,
  EventListDocument,
  getApiClientV2,
  ImageBlockInput,
  ImageListDocument,
  MemberPlanListDocument,
  NavigationLinkType,
  NavigationListDocument,
  PageListDocument,
  PaymentMethodListDocument,
  ProductType,
  PropertyInput,
  QuoteBlockInput,
  SubscriptionFlowsDocument,
  SubscriptionListDocument,
  Tag,
  TagListDocument,
  TagListQueryVariables,
  TagType,
  TeaserListBlockSort,
  TeaserSlotInput,
  TeaserSlotsAutofillConfig,
  TeaserSlotsBlockInput,
  TeaserType,
  TitleBlockInput,
  YouTubeVideoBlockInput,
  useApproveCommentMutation,
  useCreateArticleMutation,
  useCreateAuthorMutation,
  useCreateBlockStyleMutation,
  useCreateCommentMutation,
  useCreateEventMutation,
  useCreateMemberPlanMutation,
  useCreateNavigationMutation,
  useCreatePageMutation,
  useCreatePaymentMethodMutation,
  useCreateTagMutation,
  useDeleteArticleMutation,
  useDeleteAuthorMutation,
  useDeleteBlockStyleMutation,
  useDeleteCommentMutation,
  useDeleteEventMutation,
  useDeleteImageMutation,
  useDeleteMemberPlanMutation,
  useDeleteNavigationMutation,
  useDeletePageMutation,
  useDeletePaymentMethodMutation,
  useDeleteSubscriptionFlowMutation,
  useDeleteSubscriptionMutation,
  useDeleteTagMutation,
  usePublishArticleMutation,
  usePublishPageMutation,
  useUpdateArticleMutation,
  useUpdateCommentMutation,
  useUploadImageMutation,
} from '@wepublish/editor/api';
import {
  getImgMinSizeToCompress,
  getOperationNameFromDocument,
} from '@wepublish/ui/editor';
import imageCompression from 'browser-image-compression';
import { useEffect, useState } from 'react';
import { Descendant } from 'slate';

import imageData from './image-data.json';
import { useQueryState } from './useQueryState';

const shuffle = <T,>(list: T[]): T[] => {
  let idx = -1;
  const len = list.length;
  let position;
  const result: T[] = [];

  while (++idx < len) {
    position = Math.floor((idx + 1) * Math.random());
    result[idx] = result[position];
    result[position] = list[idx];
  }

  return result;
};

const pickRandom = <T,>(value: T, chance = 0.5): T[] | never[] => {
  const seed = Math.random();

  if (seed > chance) {
    return [];
  }

  return [value];
};

const getText = (min = 1, max = 10): Descendant[] => {
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
  ) as Descendant[];

  return text;
};

const waitForMs = async (msToWait: number) =>
  new Promise(resolve => setTimeout(resolve, msToWait));

async function seedImages(
  uploadImage: ReturnType<typeof useUploadImageMutation>[0]
) {
  console.log('Seeding images...');
  const getCommonInput = (imgConf: any) => ({
    filename: `image${imgConf.id}.jpg`,
    title: imgConf.author,
    description: faker.lorem.sentence(),
    tags: [] as string[],

    source: imgConf.url,
    link: faker.internet.url(),
    license: faker.lorem.word(),

    focalPoint: { x: 0, y: 0 },
  });
  const imageIds: string[] = [];

  for await (const imgConf of imageData) {
    const file = new File(
      [await fetch(imgConf.download_url).then(res => res.blob())],
      `image${imgConf.id}.jpg`,
      { type: 'image/jpg' }
    );
    console.log(`Uploading image ${imgConf.id}...`);

    const optimizedImage: File = await resizeImage(file!);
    const { data } = await uploadImage({
      variables: {
        file: optimizedImage!,
        ...getCommonInput(imgConf),
      },
    });
    await waitForMs(200);
    if (data?.uploadImage?.id) {
      imageIds.push(data.uploadImage.id);
    }
  }
  return imageIds;
}

async function resizeImage(file: File): Promise<File> {
  const imgMinSizeToCompress: number = getImgMinSizeToCompress();
  if (!willImageResize(file, imgMinSizeToCompress)) {
    return file;
  }
  const options = {
    maxSizeMB: imgMinSizeToCompress, // the max size in MB, defaults to 2MB
  };
  return imageCompression(file, options);
}

function willImageResize(file: File, imgMinSizeToResize: number) {
  const originalFileSize: number = file.size / (1024 * 1024);
  if (originalFileSize > imgMinSizeToResize) {
    return true;
  }
  return false;
}

async function seedArticleTags(createTag: any) {
  return Promise.all(
    Array.from(['news'], tag =>
      createTag({
        variables: {
          tag,
          type: TagType.Article,
          description: [],
          main: false,
        },
      })
    )
  );
}

async function seedAuthors(createAuthor: any, imageIds: string[] = []) {
  const nameAndSlug = () => {
    const name = faker.person.fullName();

    return {
      name,
      slug: faker.helpers.slugify(name.toLowerCase()),
    };
  };

  return Promise.all(
    Array.from({ length: 10 }, (_, i) => {
      const accounts = [
        'github',
        'reddit',
        //'vimeo',
        'discord',
        //'bluesky',
        'youtube',
        //'strava',
        'twitter',
        'tiktok',
        'facebook',
        'instagram',
        'linkedin',
        'email',
        'website',
      ];
      return createAuthor({
        variables: {
          ...nameAndSlug(),
          bio: getText(1, 2) as Descendant[],
          jobTitle: faker.person.jobTitle(),
          imageID: imageIds[imageIds.length - 1 - i],
          links: Array.from(
            { length: faker.number.int({ min: 1, max: 5 }) },
            () => {
              const account = accounts.splice(
                shuffle(Array.from(accounts, (e, i) => i)).at(0)!,
                1
              )[0];
              return {
                title: account,
                url:
                  account === 'email' ?
                    faker.internet.email()
                  : faker.internet.url(),
              };
            }
          ),
          tagIds: [],
          hideOnArticle: false,
          hideOnTeaser: false,
          hideOnTeam: false,
        },
      });
    })
  );
}

const addRichTextHeading = (
  text: string,
  level: string,
  headings: string[],
  headingTwo: string[]
): Descendant => {
  if (level === 'two') {
    headingTwo.push(text);
  }
  const t = {
    text: `${level === 'two' ? `${headingTwo.length}. ` : ''}${text}`,
  };
  const heading = {
    type: `heading-${level}`,
    children: [t],
  };
  headings.push(t.text);
  return heading as Descendant;
};

const getBlockStyle = (blockStyles: any, blockStyleName: string) => {
  let retVal = blockStyles.find((style: any) =>
    [style.id, style.name].includes(blockStyleName)
  );
  if (!retVal) {
    retVal = undefined;
  } else {
    retVal = retVal.id;
  }
  return retVal;
};

const updateToc = (
  blocks: BlockContentInput[],
  headings: string[],
  blockStyles: BlockStyle[]
): BlockContentInput[] => {
  return blocks.map(block => {
    if (
      'linkPageBreak' in block &&
      block.linkPageBreak?.blockStyle ===
        getBlockStyle(blockStyles, 'TableOfContents')
    ) {
      return {
        linkPageBreak: {
          blockStyle: block.linkPageBreak?.blockStyle,
          hideButton: false,
          imageID: null,
          linkTarget: null,
          linkText: null,
          linkURL: null,
          text: 'Kapitel',
          richText: [
            {
              type: 'unordered-list',
              children: headings.map(heading => ({
                type: 'list-item',
                children: [
                  {
                    type: 'link',
                    url: `#`,
                    title: `Zum Kapitel: ${heading}`,
                    children: [{ text: heading }],
                    id: heading,
                  },
                ],
              })),
            },
          ],
        },
      };
    }
    return block;
  }) as BlockContentInput[];
};

const createArticleBlocksInput = (
  tagIds: string[],
  authorIds: string[],
  imageIds: string[],
  i: number,
  blockStyles: BlockStyle[],
  title: string,
  headings: string[],
  headingTwo: string[]
): BlockContentInput[] => {
  const blocks: BlockContentInput[] = [
    // a title block
    {
      title: {
        title,
        preTitle: capitalize(faker.lorem.words({ min: 3, max: 8 })),
        lead: faker.lorem.sentences({ min: 3, max: 5 }),
      } as TitleBlockInput,
    } as BlockContentInput,

    // an image block
    {
      image: {
        imageID: imageIds[(i + 1) % imageIds.length],
        caption: faker.lorem.sentence(),
      } as ImageBlockInput,
    } as BlockContentInput,
  ] as BlockContentInput[];

  return blocks;
};

const createArticleInput = (
  tagIds: string[],
  authorIds: string[],
  imageIds: string[],
  i: number,
  blockStyles: BlockStyle[]
) => {
  const headings: string[] = [];
  const headingTwo: string[] = [];
  const title = capitalize(faker.lorem.words({ min: 3, max: 8 }));
  return {
    variables: {
      shared: true,
      slug: `${faker.helpers.slugify(title.toLowerCase())}-${faker.helpers.arrayElement(['de', 'fr'])}`,
      publishedAt: new Date().toISOString(),
      preTitle: capitalize(faker.lorem.words({ min: 3, max: 8 })),
      title,
      lead: faker.lorem.paragraph(),
      seoTitle: `SEO - ${title}`,
      authorIds: [shuffle(authorIds).at(0)],
      imageID: (() => {
        let imageId = imageIds[i % imageIds.length];
        const predefinedImageIds = [
          '10b0625c-6a01-4b89-acb8-1522cf7c1102',
          '99ec3c29-3371-44af-804f-1c17fa2fab6b',
          'f24cf6f5-dfdb-4777-82c0-599a88f71b73',
        ];

        if (i < 10) {
          imageId =
            (
              imageIds.find(
                imageId =>
                  imageId === predefinedImageIds[i % predefinedImageIds.length]
              )
            ) ?
              predefinedImageIds[i % predefinedImageIds.length]
            : imageId;
        }
        return imageId;
      })(),
      breaking: pickRandom(true, 0.1).length ? true : false,
      paywallId: null,
      hidden: false,
      disableComments: false,
      tagIds: (() => {
        if (tagIds.length) {
          if (i < 10) {
            return [tagIds[0]];
          }
          return [tagIds[1]];
        }
        return [];
      })(),
      canonicalUrl: faker.internet.url(),
      properties:
        i % 3 === 2 ?
          ([
            { key: 'leadColor', value: 'black', public: true },
          ] as PropertyInput[])
        : ([] as PropertyInput[]),
      blocks: [
        ...updateToc(
          createArticleBlocksInput(
            tagIds,
            authorIds,
            imageIds,
            i,
            blockStyles,
            title,
            headings,
            headingTwo
          ),
          headings,
          blockStyles
        ),
      ] as BlockContentInput[],

      hideAuthor: false,
      socialMediaTitle: `Social Media - ${title}`,
      socialMediaDescription: faker.lorem.paragraph(),
      socialMediaAuthorIds: [],
      socialMediaImageID: undefined,
      likes: 0,
    } as CreateArticleMutationVariables,
  };
};

const nrOfArticlesPerTag = 10;
async function seedArticlesByTag(
  createArticle: any,
  updateArticle: any,
  tagIds: string[] = [],
  authorIds: string[] = [],
  imageIds: string[] = [],
  blockStyles: BlockStyle[]
) {
  const articles = await Promise.all(
    Array.from({ length: nrOfArticlesPerTag * tagIds.length }, (_, index) => {
      const articleData = createArticleInput(
        tagIds,
        authorIds,
        imageIds,
        index,
        blockStyles
      );
      return createArticle(articleData).then((_a: any) => {
        return updateArticle({
          variables: {
            id: _a?.data?.createArticle.id,
            ...articleData.variables,
          },
        }).then((_v: any) => {
          return _v.data.updateArticle;
        });
      });
    })
  );

  return articles;
}

async function seedNavigations(createNavigation: any, tags: string[] = []) {
  /*
    Links can be of type:
      Article
      External
      Page
  */

  const navigations = await Promise.all([
    createNavigation({
      variables: {
        key: 'main-header-de',
        name: 'Main Header Navigation DE',
        links: [
          {
            type: NavigationLinkType.External,
            label: 'We.Start',
            url: '/de/we-start',
          },
          {
            type: NavigationLinkType.External,
            label: 'We.Develop',
            url: '/de/we-develop',
          },
          {
            type: NavigationLinkType.External,
            label: 'We.Share',
            url: '/de/we-share',
          },
          {
            type: NavigationLinkType.External,
            label: 'Über uns',
            url: '/de/ueber-uns',
          },
          {
            type: NavigationLinkType.External,
            label: 'Demo buchen',
            url: 'mailto:info@wepublish.ch',
          },
        ],
      },
    }),
    createNavigation({
      variables: {
        key: 'main-header-fr',
        name: 'Main Header Navigation FR',
        links: [
          {
            type: NavigationLinkType.External,
            label: 'We.Start',
            url: '/fr/we-start',
          },
          {
            type: NavigationLinkType.External,
            label: 'We.Develop',
            url: '/fr/we-develop',
          },
          {
            type: NavigationLinkType.External,
            label: 'We.Share',
            url: '/fr/we-share',
          },
        ],
      },
    }),

    createNavigation({
      variables: {
        key: 'main-footer-de',
        name: 'Main Footer Navigation DE',
        links: [
          {
            type: NavigationLinkType.External,
            label: 'We.Start',
            url: '/de/we-start',
          },
          {
            type: NavigationLinkType.External,
            label: 'We.Develop',
            url: '/de/we-develop',
          },
          {
            type: NavigationLinkType.External,
            label: 'We.Share',
            url: '/de/we-share',
          },
        ],
      },
    }),

    createNavigation({
      variables: {
        key: 'main-footer-fr',
        name: 'Main Footer Navigation FR',
        links: [
          {
            type: NavigationLinkType.External,
            label: 'We.Start',
            url: '/fr/we-start',
          },
          {
            type: NavigationLinkType.External,
            label: 'We.Develop',
            url: '/fr/we-develop',
          },
          {
            type: NavigationLinkType.External,
            label: 'We.Share',
            url: '/fr/we-share',
          },
        ],
      },
    }),

    createNavigation({
      variables: {
        key: 'categories-de',
        name: 'Categories Navigation DE',
        links: [
          {
            type: NavigationLinkType.External,
            label: 'Über uns',
            url: '/de/ueber-uns',
          },
          {
            type: NavigationLinkType.External,
            label: 'Aktuelles',
            url: '/de/aktuelles',
          },
          {
            type: NavigationLinkType.External,
            label: 'Newsletter',
            url: '/de/newsletter',
          },
        ],
      },
    }),
    createNavigation({
      variables: {
        key: 'categories-fr',
        name: 'Categories Navigation FR',
        links: [
          {
            type: NavigationLinkType.External,
            label: 'Über uns',
            url: '/fr/ueber-uns',
          },
          {
            type: NavigationLinkType.External,
            label: 'Aktuelles',
            url: '/fr/aktuelles',
          },
          {
            type: NavigationLinkType.External,
            label: 'Newsletter',
            url: '/fr/newsletter',
          },
        ],
      },
    }),

    createNavigation({
      variables: {
        key: 'ueber-uns-de',
        name: 'Über uns Navigation DE',
        links: [
          {
            type: NavigationLinkType.External,
            label: 'Impressum',
            url: '/de/impressum',
          },
        ],
      },
    }),
    createNavigation({
      variables: {
        key: 'ueber-uns-fr',
        name: 'Über uns Navigation FR',
        links: [
          {
            type: NavigationLinkType.External,
            label: 'Impressum',
            url: '/fr/impressum',
          },
        ],
      },
    }),

    createNavigation({
      variables: {
        key: 'sprachwahl',
        name: 'Sprachwahl Navigation',
        links: [
          {
            type: NavigationLinkType.External,
            label: 'Deutsch',
            url: 'https://www.wepublish.ch/de',
          },
          {
            type: NavigationLinkType.External,
            label: 'Français',
            url: 'https://www.wepublish.ch/fr',
          },
        ],
      },
    }),
  ]);

  return navigations;
}

async function seedEvents(createEvent: any, imageIds: string[] = []) {
  const future = faker.date.future({ refDate: new Date() });

  return Promise.all(
    Array.from({ length: faker.number.int({ min: 4, max: 10 }) }, () =>
      createEvent({
        variables: {
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
  createPage: any,
  imageIds: string[] = [],
  tags: Tag[] = [],
  articleIds: string[] = [],
  blockStyles: any,
  memberPlandIds: string[] = []
) {
  const subPagesFR = await Promise.all([
    // we start
    createPage({
      variables: {
        publishedAt: new Date().toISOString(),
        slug: 'we-start-fr',
        tagIds: [],
        imageID: null,
        canonicalUrl: null,
        properties: [],
        title: 'We.Start FR',
        blocks: [
          {
            title: {
              title: 'We.Start FR',
              preTitle: null,
              lead: 'Wir begleiten (neue) Medienprojekte von der Idee bis zur tragfähigen, finanzierten Organisation, sowie in Transformationsprozessen mit strategischer Beratung, Netzwerkzugang und Unterstützung im Fundraising.',
            } as TitleBlockInput,
          },
        ] as BlockContentInput[],
      },
    }),

    // we develop
    createPage({
      variables: {
        publishedAt: new Date().toISOString(),
        slug: 'we-develop-fr',
        tagIds: [],
        imageID: null,
        canonicalUrl: null,
        properties: [],
        title: 'We.Develop FR',
        blocks: [
          {
            title: {
              title: 'We.Develop FR',
              preTitle: null,
              lead: 'Wir bieten eine digitale Infrastruktur entwickelt, mit und für unabhängige Medien: Know-how wird gebündelt und Entwicklungskosten geteilt  – alles Open Source.',
            } as TitleBlockInput,
          },
        ] as BlockContentInput[],
      },
    }),

    // we share
    createPage({
      variables: {
        publishedAt: new Date().toISOString(),
        slug: 'we-share-fr',
        tagIds: [],
        imageID: null,
        canonicalUrl: null,
        properties: [],
        title: 'We.Share FR',
        blocks: [
          {
            title: {
              title: 'We.Share FR',
              preTitle: null,
              lead: 'Wir schaffen Formate für Kooperation: regelmässige Treffen, Workshops und inhaltliches Teilen im Netzwerk stärken Reichweite, Know-how und Resilienz unabhängiger Medien.',
            } as TitleBlockInput,
          },
        ] as BlockContentInput[],
      },
    }),
  ]);

  const subPagesDE = await Promise.all([
    // we start
    createPage({
      variables: {
        publishedAt: new Date().toISOString(),
        slug: 'we-start-de',
        tagIds: [],
        imageID: null,
        canonicalUrl: null,
        properties: [],
        title: 'We.Start',
        blocks: [
          {
            title: {
              title: 'We.Start',
              preTitle: null,
              lead: 'Wir begleiten (neue) Medienprojekte von der Idee bis zur tragfähigen, finanzierten Organisation, sowie in Transformationsprozessen mit strategischer Beratung, Netzwerkzugang und Unterstützung im Fundraising.',
            } as TitleBlockInput,
          },
        ] as BlockContentInput[],
      },
    }),

    // we develop
    createPage({
      variables: {
        publishedAt: new Date().toISOString(),
        slug: 'we-develop-de',
        tagIds: [],
        imageID: null,
        canonicalUrl: null,
        properties: [],
        title: 'We.Develop',
        blocks: [
          {
            title: {
              title: 'We.Develop',
              preTitle: null,
              lead: 'Wir bieten eine digitale Infrastruktur entwickelt, mit und für unabhängige Medien: Know-how wird gebündelt und Entwicklungskosten geteilt  – alles Open Source.',
            } as TitleBlockInput,
          },
        ] as BlockContentInput[],
      },
    }),

    // we share
    createPage({
      variables: {
        publishedAt: new Date().toISOString(),
        slug: 'we-share-de',
        tagIds: [],
        imageID: null,
        canonicalUrl: null,
        properties: [],
        title: 'We.Share',
        blocks: [
          {
            title: {
              title: 'We.Share',
              preTitle: null,
              lead: 'Wir schaffen Formate für Kooperation: regelmässige Treffen, Workshops und inhaltliches Teilen im Netzwerk stärken Reichweite, Know-how und Resilienz unabhängiger Medien.',
            } as TitleBlockInput,
          },
        ] as BlockContentInput[],
      },
    }),
  ]);

  const logoImages = imageIds.splice(imageIds.length - 15, imageIds.length);

  const homePageDE = await createPage({
    variables: {
      publishedAt: new Date().toISOString(),
      slug: '-de',
      tagIds: [],
      imageID: null,
      canonicalUrl: null,
      properties: [],
      title: 'Home',
      blocks: [
        {
          title: {
            title:
              'Wir begleiten Medien im Auf- und Umbau, bieten eine digitale Infrastruktur speziell für unabhängige Redaktionen und teilen Wissen im Netzwerk.',
            preTitle: 'Das Ökosystem unabhängiger Medien',
            lead: null,
          } as TitleBlockInput,
        },

        {
          teaserSlots: {
            title: null,
            blockStyle: getBlockStyle(blockStyles, 'TeaserExpertise'),
            autofillConfig: {
              enabled: false,
              filter: {},
              teaserType: TeaserType.Page,
              sort: null,
            } as TeaserSlotsAutofillConfig,
            slots: subPagesDE.map((page: any) => ({
              type: 'Manual',
              teaser: {
                page: {
                  pageID: page.data.createPage.id,
                  title: (() => {
                    //console.log(page.data.createPage);
                    switch (page.data.createPage.latest.title) {
                      case 'We.Start':
                        return 'Gründen & Transformieren';
                      case 'We.Develop':
                        return 'Digitale Infrastruktur';
                      case 'We.Share':
                        return 'Netzwerk & Wissen';
                      default:
                        return '';
                    }
                  })(),
                  lead: (() => {
                    switch (page.data.createPage.latest.title) {
                      case 'We.Start':
                        return 'Wir begleiten (neue) Medien in Gründung und Transformation mit strategischer Beratung, Netzwerk-zugang und Fundraising.';
                      case 'We.Develop':
                        return 'Wir bieten eine digitale Infrastruktur für und mit unabhängigen Medien entwickelt. Kosten werden geteilt, alles Open Source.';
                      case 'We.Share':
                        return 'Wir schaffen Formate für Kooperation: Austausch im Netzwerk stärken Reichweite, Know-how und Resilienz unabhängiger Medien.';
                      default:
                        return '';
                    }
                  })(),
                  preTitle: page.data.createPage.latest.title,
                  imageID:
                    imageIds.length ?
                      imageIds[
                        faker.number.int({
                          min: 0,
                          max: imageIds.length - 1,
                        })
                      ]
                    : null,
                },
              },
            })) as TeaserSlotInput[],
          } as TeaserSlotsBlockInput,
        } as BlockContentInput,

        {
          teaserSlots: {
            title: 'Das Netzwerk',
            blockStyle: getBlockStyle(blockStyles, 'LogoWall'),
            autofillConfig: {
              enabled: false,
              filter: {},
              teaserType: TeaserType.Page,
              sort: null,
            } as TeaserSlotsAutofillConfig,
            slots: logoImages.map((image: string) => ({
              type: 'Manual',
              teaser: {
                custom: {
                  imageID: image,
                },
              },
            })) as TeaserSlotInput[],
          } as TeaserSlotsBlockInput,
        } as BlockContentInput,

        {
          teaserSlots: {
            title: 'Aktuelle Angebote',
            blockStyle: getBlockStyle(blockStyles, 'TeaserServices'),
            autofillConfig: {
              enabled: false,
              filter: {},
              teaserType: TeaserType.Page,
              sort: null,
            } as TeaserSlotsAutofillConfig,
            slots: [
              {
                type: 'Manual',
                teaser: {
                  custom: {
                    title: 'KI-Exoskelett',
                    lead: 'KI-gestützte Werkzeuge für Recherche, Textarbeit und redaktionelle Prozesse. Ohne die journalistische Kontrolle abzugeben.',
                    contentUrl: 'mailto:info@wepublish.ch',
                    preTitle: 'Mehr erfahren',
                    openInNewTab: false,
                    properties: [],
                    imageID: null,
                  },
                },
              },
              {
                type: 'Manual',
                teaser: {
                  custom: {
                    title: 'Fundraising',
                    lead: 'Wir übernehmen den grössten Teil des Fundraising-Prozesses. Strukturiert, datenbasiert, massgeschneidert. Wir rechnen nur ab, wenn ihr gewinnt.',
                    contentUrl: 'mailto:info@wepublish.ch',
                    preTitle: 'Mehr erfahren',
                    openInNewTab: false,
                    properties: [],
                    imageID: null,
                  },
                },
              },
              {
                type: 'Manual',
                teaser: {
                  custom: {
                    title: 'OSINT',
                    lead: 'Ihr habt eine Recherchefrage, wir liefern die Antworten. Mit den Methoden und Quellen der Open Source Intelligence graben wir tief und finden Antworten.',
                    contentUrl: 'mailto:info@wepublish.ch',
                    preTitle: 'Mehr erfahren',
                    openInNewTab: false,
                    properties: [],
                    imageID: null,
                  },
                },
              },
            ] as TeaserSlotInput[],
          } as TeaserSlotsBlockInput,
        } as BlockContentInput,

        {
          linkPageBreak: {
            blockStyle: getBlockStyle(blockStyles, 'AttentionCatcher'),
            hideButton: false,
            imageID: null,
            linkTarget: null,
            linkText: 'Demo anfragen',
            linkURL: 'mailto:info@wepublish.ch',
            text: 'Interessiert? In einer Demo beantworten wir alle Fragen und du kannst unser CMS mit allen Features ausprobieren.',
            richText: [] as Descendant[],
          } as BreakBlockInput,
        },

        {
          teaserSlots: {
            title: 'Aktuell',
            blockStyle: getBlockStyle(blockStyles, 'TeaserNews'),
            autofillConfig: {
              enabled: true,
              filter: {
                tags: tags
                  .filter(tag => tag.tag === 'news')
                  .map(tag => tag.id) as string[],
              },
              teaserType: TeaserType.Article,
              sort: TeaserListBlockSort.PublishedAt,
            } as TeaserSlotsAutofillConfig,
            slots: [
              {
                type: 'Autofill',
                teaser: null,
              },
              {
                type: 'Autofill',
                teaser: null,
              },
              {
                type: 'Autofill',
                teaser: null,
              },
            ] as TeaserSlotInput[],
          } as TeaserSlotsBlockInput,
        } as BlockContentInput,

        {
          quote: {
            quote:
              'Mit We.Publish kriegen wir nicht nur ein top modernes und leistungsfähiges CMS. Das wirklich Fortschrittliche sind die Kooperations- und Inhalts-Tausch-Möglichkeiten unter den angeschlossenen Medien.',
            imageID:
              imageIds.length ?
                imageIds[faker.number.int({ min: 0, max: imageIds.length - 1 })]
              : null,
            author: 'Simon Jacoby, Verleger & Chefredaktor Tsüri.ch',
          } as QuoteBlockInput,
        } as BlockContentInput,

        {
          richText: {
            blockStyle: null,
            richText: [
              {
                type: 'heading-two',
                children: [
                  {
                    text: 'So funktioniert We.Publish',
                  },
                ],
              },
            ],
          },
        } as BlockContentInput,

        {
          youTubeVideo: {
            videoID: faker.helpers.arrayElement([
              'dQw4w9WgXcQ',
              'jNQXAC9IVRw',
              'kJQP7kiw5Fk',
              'OPf0YbXqDm0',
              'hT_nvWreIhg',
              '9bZkp7q19f0',
            ]),
          } as YouTubeVideoBlockInput,
        } as BlockContentInput,

        {
          linkPageBreak: {
            hideButton: false,
            imageID:
              imageIds.length ?
                imageIds[faker.number.int({ min: 0, max: imageIds.length - 1 })]
              : null,
            linkTarget: null,
            linkText: 'Mehr erfahren',
            linkURL: 'mailto:info@wepublish.ch',
            blockStyle: null,
            text: 'Über uns',
            richText: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: 'We.Publish ist eine Stiftung mit dem Ziel, die Medienvielfalt in der Schweiz zu stärken. Wir unterstützen Projekte, die demokratierelevante Inhalte einem breiten Publikum zugänglich machen – mit besonderem Fokus auf die Förderung und Weiterentwicklung offener, frei zugänglicher technischer Infrastrukturen (Open Source).',
                  },
                ],
              },
            ] as Descendant[],
          } as BreakBlockInput,
        } as BlockContentInput,
      ] as BlockContentInput[],
    },
  });

  const homePageFR = await createPage({
    variables: {
      publishedAt: new Date().toISOString(),
      slug: '-fr',
      tagIds: [],
      imageID: null,
      canonicalUrl: null,
      properties: [],
      title: 'Home FR',
      blocks: [
        {
          title: {
            title:
              'Nous accompagnons les médias dans leur développement et leur transformation, offrons une infrastructure numérique spécialement conçue pour les rédactions indépendantes et partageons des connaissances au sein du réseau.',
            preTitle: "L'écosystème des médias indépendants",
            lead: null,
          } as TitleBlockInput,
        },

        {
          teaserSlots: {
            title: null,
            blockStyle: getBlockStyle(blockStyles, 'TeaserExpertise'),
            autofillConfig: {
              enabled: false,
              filter: {},
              teaserType: TeaserType.Page,
              sort: null,
            } as TeaserSlotsAutofillConfig,
            slots: subPagesFR.map((page: any) => ({
              type: 'Manual',
              teaser: {
                page: {
                  pageID: page.data.createPage.id,
                },
              },
            })) as TeaserSlotInput[],
          } as TeaserSlotsBlockInput,
        } as BlockContentInput,
      ] as BlockContentInput[],
    },
  });

  return [homePageDE, homePageFR, ...subPagesDE, ...subPagesFR];
}

async function seedComments(
  createComment: any,
  updateComment: any,
  approveComment: any,
  articleIds: string[],
  imageIds: string[] = []
) {
  const createAndApproveComment = async (variables: {
    text: Descendant[];
    tagIds: string[];
    itemID: string;
    parentID: string | null;
    itemType: CommentItemType;
    source: string;
    guestUsername: string;
    guestUserImageID: string | undefined;
  }) => {
    const comment = await createComment({
      variables: {
        text: variables.text,
        tagIds: variables.tagIds,
        itemID: variables.itemID,
        parentID: variables.parentID,
        itemType: variables.itemType,
      },
    });
    const id = comment.data.createComment.id;
    await updateComment({
      variables: {
        id,
        guestUsername: variables.guestUsername,
        guestUserImageID: variables.guestUserImageID,
        source: variables.source,
      },
    });
    await approveComment({ variables: { id } });
    return comment;
  };

  const comments = await Promise.all(
    articleIds.map(async articleId => {
      const firstBatchOfComments = await Promise.all(
        Array.from(
          { length: faker.number.int({ min: 0, max: 8 }) },
          async () => {
            const comment = await createAndApproveComment({
              text: getText(2, 4) as Descendant[],
              tagIds: [],
              itemID: articleId,
              parentID: null,
              itemType: CommentItemType.Article,
              source: capitalize(faker.lorem.words({ min: 3, max: 8 })),
              guestUsername: faker.person.fullName(),
              guestUserImageID: shuffle(imageIds).at(0),
            });
            return comment;
          }
        )
      );

      let repliesToFirstBatchOfComments: any[] = [];
      if (firstBatchOfComments.length) {
        repliesToFirstBatchOfComments = await Promise.all(
          firstBatchOfComments.map(
            async parentComment =>
              await Promise.all(
                Array.from(
                  { length: faker.number.int({ min: 0, max: 4 }) },
                  async () => {
                    const reply = await createAndApproveComment({
                      text: getText(1, 3) as Descendant[],
                      tagIds: [],
                      itemID: articleId,
                      parentID: parentComment.data.createComment.id,
                      itemType: CommentItemType.Article,
                      source: capitalize(faker.lorem.words({ min: 3, max: 8 })),
                      guestUsername: faker.person.fullName(),
                      guestUserImageID: shuffle(imageIds).at(0),
                    });
                    return reply;
                  }
                )
              )
          )
        );
      }

      return [...firstBatchOfComments, ...repliesToFirstBatchOfComments];
    })
  );
  return comments;
}

async function seedBlockStyles(createBlockStyle: any): Promise<BlockStyle[]> {
  const blockStylesData = [
    {
      name: 'Banner',
      blocks: ['LinkPageBreak'],
    },
    {
      name: 'ContextBox',
      blocks: ['LinkPageBreak'],
    },
    {
      name: 'Alternating',
      blocks: ['TeaserList', 'TeaserSlots', 'TeaserGrid6'],
    },
    {
      name: 'Focus',
      blocks: ['TeaserList', 'TeaserSlots'],
    },
    {
      name: 'Slider',
      blocks: ['TeaserList', 'TeaserGrid6', 'TeaserSlots', 'ImageGallery'],
    },

    {
      name: 'TeaserExpertise',
      blocks: ['TeaserSlots'],
    },

    {
      name: 'TeaserNews',
      blocks: ['TeaserSlots'],
    },

    {
      name: 'TeaserServices',
      blocks: ['TeaserSlots'],
    },

    {
      name: 'LogoWall',
      blocks: ['TeaserSlots'],
    },

    {
      name: 'AttentionCatcher',
      blocks: ['LinkPageBreak'],
    },
  ];

  const blockStyles = [];

  for (const style of blockStylesData) {
    const blockStyle = await createBlockStyle({
      variables: { ...style },
    });
    blockStyles.push(blockStyle.data.createBlockStyle);
  }
  return blockStyles;
}

async function seedMemberPlans(createMemberPlan: any, paymentMethods: any) {
  const memberPlans = await Promise.all([
    createMemberPlan({
      variables: {
        name: 'Test-Abo CHF',
        slug: 'test-abo-chf',
        active: true,
        description: [],
        imageID: null,
        amountPerMonthMin: 1000,
        productType: ProductType.Subscription,
        extendable: true,
        currency: 'CHF',
        tags: ['selling'],
        availablePaymentMethods: [
          {
            forceAutoRenewal: false,
            paymentMethodIDs: [paymentMethods[0].data.createPaymentMethod.id],
            paymentPeriodicities: ['yearly', 'monthly'],
          },
        ],
      },
    }),
    createMemberPlan({
      variables: {
        name: 'Test-Abo EUR',
        slug: 'test-abo-eur',
        active: true,
        description: [],
        imageID: null,
        amountPerMonthMin: 1000,
        productType: ProductType.Subscription,
        extendable: true,
        currency: 'EUR',
        tags: ['selling'],
        availablePaymentMethods: [
          {
            forceAutoRenewal: false,
            paymentMethodIDs: [paymentMethods[1].data.createPaymentMethod.id],
            paymentPeriodicities: ['yearly', 'monthly'],
          },
        ],
      },
    }),
  ]);
  return memberPlans;
}

async function seedPaymentMethods(createPaymentMethod: any) {
  const paymentMethods = await Promise.all([
    createPaymentMethod({
      variables: {
        name: 'Payrexx',
        slug: 'payrexx',
        description: '',
        paymentProviderID: 'payrexx',
        gracePeriod: 7,
        imageId: null,
        active: true,
      },
    }),
    createPaymentMethod({
      variables: {
        name: 'Stripe',
        slug: 'stripe',
        description: '',
        paymentProviderID: 'stripe',
        gracePeriod: 7,
        imageId: null,
        active: true,
      },
    }),
  ]);
  return paymentMethods;
}

async function hashSHA256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

function SeedSession({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState(() => {
    const storedSession = localStorage.getItem('seed_session');
    return storedSession ? storedSession : 'expired';
  });

  useEffect(() => {
    localStorage.setItem('seed_session', session || 'expired');
  }, [session]);

  const isSessionValid = () =>
    session.startsWith('valid-') &&
    new Date().getTime() - new Date(session.split('valid-')[1]).getTime() <
      3600000;

  return (
    <div style={{ padding: '20px' }}>
      {!isSessionValid() ?
        <>
          <p>
            {'Please enter the seed password to proceed with database seeding:'}
          </p>
          <input
            type="password"
            onKeyDown={async e => {
              if (e.key === 'Enter') {
                if (
                  (await hashSHA256(e.currentTarget.value)) ===
                  '512bb61e029c56fedb857d55a4dad19d87c7636c627e7f585bc3a243cf2d8add'
                ) {
                  setSession(`valid-${new Date().toISOString()}`);
                } else {
                  setSession('expired');
                }
              }
            }}
          />
        </>
      : children}
    </div>
  );
}

// fetch all functions

const PAGE_SIZE = 100;
async function fetchAllTags(client: any) {
  let skip = 0;
  const all: Array<{ id: string }> = [];

  let hasMore = true;
  while (hasMore) {
    const { data } = await client.query({
      query: TagListDocument,
      variables: {
        filter: {
          type: TagType.Article,
        },
        take: PAGE_SIZE,
        skip,
      } as TagListQueryVariables,
      fetchPolicy: 'network-only',
    });

    const nodes = (data?.tags?.nodes ?? []) as Array<{ id: string }>;
    all.push(...nodes.map(n => ({ id: n.id })));

    hasMore = data?.tags?.totalCount > all.length;
    skip += PAGE_SIZE;
  }

  return all;
}

async function fetchAllAuthors(client: any) {
  let skip = 0;
  const all: Array<{ id: string }> = [];

  let hasMore = true;
  while (hasMore) {
    const { data } = await client.query({
      query: AuthorListDocument,
      variables: {
        take: PAGE_SIZE,
        skip,
      },
      fetchPolicy: 'network-only',
    });

    const nodes = (data?.authors?.nodes ?? []) as Array<{ id: string }>;
    all.push(...nodes.map(n => ({ id: n.id })));

    hasMore = data?.authors?.totalCount > all.length;
    skip += PAGE_SIZE;
  }

  return all;
}

async function fetchAllArticles(client: any) {
  let skip = 0;
  const all: Array<{ id: string }> = [];

  let hasMore = true;
  while (hasMore) {
    const { data } = await client.query({
      query: ArticleListDocument,
      variables: {
        take: PAGE_SIZE,
        skip,
      } as ArticleListQueryVariables,
      fetchPolicy: 'network-only',
    });

    const nodes = (data?.articles?.nodes ?? []) as Array<{ id: string }>;
    all.push(...nodes.map(n => ({ id: n.id })));

    hasMore = data?.articles?.totalCount > all.length;
    skip += PAGE_SIZE;
  }

  return all;
}

async function fetchAllNavigations(client: any) {
  let skip = 0;
  const all: Array<{ id: string }> = [];

  let hasMore = true;
  while (hasMore) {
    const { data } = await client.query({
      query: NavigationListDocument,
      variables: {
        take: PAGE_SIZE,
        skip,
      },
      fetchPolicy: 'network-only',
    });

    const nodes = (data?.navigations ?? []) as Array<{ id: string }>;
    all.push(...nodes.map(n => ({ id: n.id })));

    hasMore = data?.navigations.length > all.length;
    skip += PAGE_SIZE;
  }

  return all;
}

async function fetchAllImages(client: any) {
  let skip = 0;
  const all: Array<{ id: string }> = [];

  let hasMore = true;
  while (hasMore) {
    const { data } = await client.query({
      query: ImageListDocument,
      variables: {
        filter: undefined,
        take: PAGE_SIZE,
        skip,
      },
      fetchPolicy: 'network-only',
    });

    const nodes = (data?.images?.nodes ?? []) as Array<{ id: string }>;
    all.push(...nodes.map(n => ({ id: n.id })));

    hasMore = data?.images?.totalCount > all.length;
    skip += PAGE_SIZE;
  }

  return all;
}

async function fetchAllEvents(client: any) {
  let skip = 0;
  const all: Array<{ id: string }> = [];

  let hasMore = true;
  while (hasMore) {
    const { data } = await client.query({
      query: EventListDocument,
      variables: {
        take: PAGE_SIZE,
        skip,
      },
      fetchPolicy: 'network-only',
    });

    const nodes = (data?.events?.nodes ?? []) as Array<{ id: string }>;
    all.push(...nodes.map(n => ({ id: n.id })));

    hasMore = data?.events?.totalCount > all.length;
    skip += PAGE_SIZE;
  }

  return all;
}

async function fetchAllBlockStyles(client: any) {
  let skip = 0;
  const all: Array<{ id: string }> = [];

  let hasMore = true;
  while (hasMore) {
    const { data } = await client.query({
      query: BlockStylesDocument,
      variables: {
        take: PAGE_SIZE,
        skip,
      },
      fetchPolicy: 'network-only',
    });

    const nodes = (data?.blockStyles ?? []) as Array<{
      id: string;
    }>;
    all.push(...nodes.map(n => ({ id: n.id })));

    hasMore = data?.blockStyles?.length > all.length;
    skip += PAGE_SIZE;
  }

  return all;
}

async function fetchAllPages(client: any) {
  let skip = 0;
  const all: Array<{ id: string }> = [];

  let hasMore = true;
  while (hasMore) {
    const { data } = await client.query({
      query: PageListDocument,
      variables: {
        take: PAGE_SIZE,
        skip,
      },
      fetchPolicy: 'network-only',
    });

    const nodes = (data?.pages?.nodes ?? []) as Array<{ id: string }>;
    all.push(...nodes.map(n => ({ id: n.id })));

    hasMore = data?.pages?.totalCount > all.length;
    skip += PAGE_SIZE;
  }

  return all;
}

async function fetchAllComments(client: any) {
  let skip = 0;
  const all: Array<{ id: string }> = [];

  let hasMore = true;
  while (hasMore) {
    const { data } = await client.query({
      query: CommentListDocument,
      variables: {
        filter: {},
        take: PAGE_SIZE,
        skip,
      },
      fetchPolicy: 'network-only',
    });

    const nodes = (data?.comments?.nodes ?? []) as Array<{ id: string }>;
    all.push(...nodes.map(n => ({ id: n.id })));

    hasMore = data?.comments?.totalCount > all.length;
    skip += PAGE_SIZE;
  }

  return all;
}

async function fetchAllSubscriptions(client: any) {
  let skip = 0;
  const all: Array<{ id: string }> = [];

  let hasMore = true;
  while (hasMore) {
    const { data } = await client.query({
      query: SubscriptionListDocument,
      variables: {
        take: PAGE_SIZE,
        skip,
      },
      fetchPolicy: 'network-only',
    });

    const nodes = (data?.subscriptions?.nodes ?? []) as Array<{
      id: string;
    }>;
    all.push(...nodes.map(n => ({ id: n.id })));

    hasMore = data?.subscriptions?.totalCount > all.length;
    skip += PAGE_SIZE;
  }

  return all;
}

async function fetchAllMemberPlans(client: any) {
  let skip = 0;
  const all: Array<{ id: string }> = [];

  let hasMore = true;
  while (hasMore) {
    const { data } = await client.query({
      query: MemberPlanListDocument,
      variables: {
        take: PAGE_SIZE,
        skip,
      },
      fetchPolicy: 'network-only',
    });

    const nodes = (data?.memberPlans?.nodes ?? []) as Array<{
      id: string;
    }>;
    all.push(...nodes.map(n => ({ id: n.id })));

    hasMore = data?.memberPlans?.totalCount > all.length;
    skip += PAGE_SIZE;
  }

  return all;
}

async function fetchAllPaymentMethods(client: any) {
  let skip = 0;
  const all: Array<{ id: string }> = [];

  let hasMore = true;
  while (hasMore) {
    const { data } = await client.query({
      query: PaymentMethodListDocument,
      variables: {
        take: PAGE_SIZE,
        skip,
      },
      fetchPolicy: 'network-only',
    });

    const nodes = (data?.paymentMethods ?? []) as Array<{
      id: string;
    }>;
    all.push(...nodes.map(n => ({ id: n.id })));

    hasMore = data?.paymentMethods?.totalCount > all.length;
    skip += PAGE_SIZE;
  }

  return all;
}

async function fetchAllSubscriptionFlows(client: any) {
  let skip = 0;
  const all: Array<{ id: string }> = [];

  let hasMore = true;
  while (hasMore) {
    const { data } = await client.query({
      query: SubscriptionFlowsDocument,
      variables: {
        defaultFlowOnly: false,
        memberPlanID: null,
        take: PAGE_SIZE,
        skip,
      },
      fetchPolicy: 'network-only',
    });

    const nodes = (data?.subscriptionFlows ?? []) as Array<{
      id: string;
    }>;
    all.push(...nodes.map(n => ({ id: n.id })));

    hasMore = data?.subscriptionFlows?.totalCount > all.length;
    skip += PAGE_SIZE;
  }

  return all;
}
// end fetch all functions

async function handleDelete(
  deleteTag: ReturnType<typeof useDeleteTagMutation>[0],
  deleteAuthor: ReturnType<typeof useDeleteAuthorMutation>[0],
  deleteArticle: ReturnType<typeof useDeleteArticleMutation>[0],
  deleteNavigation: ReturnType<typeof useDeleteNavigationMutation>[0],
  deletePage: ReturnType<typeof useDeletePageMutation>[0],
  deleteImage: ReturnType<typeof useDeleteImageMutation>[0],
  deleteEvent: ReturnType<typeof useDeleteEventMutation>[0],
  deleteBlockStyle: ReturnType<typeof useDeleteBlockStyleMutation>[0],
  deleteComment: ReturnType<typeof useDeleteCommentMutation>[0],
  deletePaymentMethod: ReturnType<typeof useDeletePaymentMethodMutation>[0],
  deleteMemberPlan: ReturnType<typeof useDeleteMemberPlanMutation>[0],
  deleteSubscriptionFlow: ReturnType<
    typeof useDeleteSubscriptionFlowMutation
  >[0],
  deleteSubscription: ReturnType<typeof useDeleteSubscriptionMutation>[0],
  client: any,
  params?: URLSearchParams
) {
  const [
    allTags,
    allAuthors,
    allArticles,
    allNavigations,
    allImages,
    allPages,
    allEvents,
    allBlockStyles,
    allComments,
    allMemberPlans,
    allPaymentMethods,
    allSubscriptionFlows,
    allSubscriptions,
  ] = await Promise.all([
    fetchAllTags(client),
    fetchAllAuthors(client),
    fetchAllArticles(client),
    fetchAllNavigations(client),
    !(params?.get('type') === 'exclude-images') ?
      fetchAllImages(client)
    : Promise.resolve([]),
    fetchAllPages(client),
    fetchAllEvents(client),
    fetchAllBlockStyles(client),
    fetchAllComments(client),
    fetchAllMemberPlans(client),
    fetchAllPaymentMethods(client),
    fetchAllSubscriptionFlows(client),
    fetchAllSubscriptions(client),
  ]);

  await Promise.all(
    allTags.map(tag =>
      deleteTag({
        variables: { id: tag.id },
      })
    )
  );
  await Promise.all(
    allAuthors.map(author =>
      deleteAuthor({
        variables: { id: author.id },
      })
    )
  );
  await Promise.all(
    allArticles.map(article =>
      deleteArticle({
        variables: { id: article.id },
      })
    )
  );
  await Promise.all(
    allNavigations.map(nav =>
      deleteNavigation({
        variables: { id: nav.id },
      })
    )
  );
  if (!(params?.get('type') === 'exclude-images')) {
    console.log('Deleting images...');
    await Promise.all(
      allImages.map((image: any) =>
        deleteImage({
          variables: { id: image.id },
        })
      )
    );
  }
  await Promise.all(
    allPages.map(page => {
      if ((page as unknown as { slug: string }).slug === '404') {
        return Promise.resolve();
      }
      return deletePage({
        variables: { id: page.id },
      });
    })
  );
  await Promise.all(
    allEvents.map(event => {
      return deleteEvent({
        variables: { id: event.id },
      });
    })
  );
  await Promise.all(
    allBlockStyles.map(style =>
      deleteBlockStyle({
        variables: { id: style.id },
      })
    )
  );
  await Promise.all(
    allComments.map(comment =>
      deleteComment({
        variables: { deleteCommentId: comment.id },
      })
    )
  );
  await Promise.all(
    allSubscriptions.map(subscription =>
      deleteSubscription({
        variables: { id: subscription.id },
      })
    )
  );
  await Promise.all(
    allMemberPlans.map(memberPlan =>
      deleteMemberPlan({
        variables: { id: memberPlan.id },
      })
    )
  );
  await Promise.all(
    allPaymentMethods.map(paymentMethod =>
      deletePaymentMethod({
        variables: { id: paymentMethod.id },
      }).catch(err => {
        console.log(
          `Could not delete payment method with id ${paymentMethod.id}: ${err}`
        );
      })
    )
  );
  await Promise.all(
    allSubscriptionFlows.map(async subscriptionFlow => {
      deleteSubscriptionFlow({
        variables: { id: subscriptionFlow.id },
      }).catch(err => {
        console.log(
          `Could not delete subscription flow with id ${subscriptionFlow.id}: ${err}`
        );
        return Promise.resolve();
      });
    })
  );
}

async function handleSeed(
  uploadImage: ReturnType<typeof useUploadImageMutation>[0],
  createAuthor: ReturnType<typeof useCreateAuthorMutation>[0],
  createTag: ReturnType<typeof useCreateTagMutation>[0],
  createBlockStyle: ReturnType<typeof useCreateBlockStyleMutation>[0],
  createArticle: ReturnType<typeof useCreateArticleMutation>[0],
  publishArticle: ReturnType<typeof usePublishArticleMutation>[0],
  updateArticle: ReturnType<typeof useUpdateArticleMutation>[0],
  createNavigation: ReturnType<typeof useCreateNavigationMutation>[0],
  createEvent: ReturnType<typeof useCreateEventMutation>[0],
  createPage: ReturnType<typeof useCreatePageMutation>[0],
  createComment: ReturnType<typeof useCreateCommentMutation>[0],
  updateComment: ReturnType<typeof useUpdateCommentMutation>[0],
  approveComment: ReturnType<typeof useApproveCommentMutation>[0],
  publishPage: ReturnType<typeof usePublishPageMutation>[0],
  fetchAllImages: (client: any) => Promise<Array<{ id: string }>>,
  createMemberPlan: ReturnType<typeof useCreateMemberPlanMutation>[0],
  createPaymentMethod: ReturnType<typeof useCreatePaymentMethodMutation>[0],
  client: any,
  params?: URLSearchParams
) {
  const images =
    !(params?.get('type') === 'exclude-images') ?
      await seedImages(uploadImage)
    : (await fetchAllImages(client)).map(img => img.id);

  const authors = await seedAuthors(createAuthor, images);
  const tags = await seedArticleTags(createTag);
  const blockStyles = await seedBlockStyles(createBlockStyle);

  const articles = await seedArticlesByTag(
    createArticle,
    updateArticle,
    tags
      .sort((a, b) => {
        return (a.data?.createTag.tag || '').localeCompare(
          b.data?.createTag.tag || ''
        );
      })
      .reverse()
      .map(tag => tag.data?.createTag.id),
    authors.map(author => author.data?.createAuthor.id),
    images,
    blockStyles
  );

  const publishedArticles = [];

  for (const article of [...articles]) {
    const { data: publishData } = await publishArticle({
      variables: {
        id: article.id,
        publishedAt: new Date().toISOString(),
      },
    });
    publishedArticles.push(publishData?.publishArticle);
  }

  const navigations = await seedNavigations(
    createNavigation,
    tags.map(tag => tag.data?.createTag.tag).filter(tag => !!tag) as string[]
  );

  const events = await seedEvents(createEvent, images);

  const paymentMethods = await seedPaymentMethods(createPaymentMethod);

  const memberPlans = await seedMemberPlans(createMemberPlan, paymentMethods);

  const pages = await seedPages(
    createPage,
    images,
    tags.map(tag => tag.data?.createTag),
    publishedArticles
      .map(article => article?.latest?.id)
      .filter(id => !!id) as string[],
    blockStyles,
    memberPlans
      .map(plan => plan.data?.createMemberPlan.id)
      .filter(id => !!id) as string[]
  );

  for (const page of pages) {
    await publishPage({
      variables: {
        id: page?.data?.createPage.id,
        publishedAt: new Date().toISOString(),
      },
    });
  }

  const comments = await seedComments(
    createComment,
    updateComment,
    approveComment,
    publishedArticles
      .map(article => article?.id)
      .filter(id => !!id) as string[],
    images
  );
}

type SeedProps = { type?: string };

export const Seed = ({ type }: SeedProps) => {
  const client = getApiClientV2();

  // delete hooks
  const [deleteTag] = useDeleteTagMutation({ client });
  const [deleteAuthor] = useDeleteAuthorMutation({ client });
  const [deleteArticle] = useDeleteArticleMutation({ client });
  const [deleteNavigation] = useDeleteNavigationMutation({ client });
  const [deletePage] = useDeletePageMutation({ client });
  const [deleteImage] = useDeleteImageMutation({ client });
  const [deleteEvent] = useDeleteEventMutation({ client });
  const [deleteBlockStyle] = useDeleteBlockStyleMutation({ client });
  const [deleteComment] = useDeleteCommentMutation();
  const [deleteMemberPlan] = useDeleteMemberPlanMutation({ client });
  const [deletePaymentMethod] = useDeletePaymentMethodMutation({ client });
  const [deleteSubscriptionFlow] = useDeleteSubscriptionFlowMutation({
    client,
  });
  const [deleteSubscription] = useDeleteSubscriptionMutation();
  // end delete hooks

  // create hooks
  const [createTag] = useCreateTagMutation({ client });
  const [createAuthor] = useCreateAuthorMutation({ client });
  const [createArticle] = useCreateArticleMutation({ client });
  const [createPage] = useCreatePageMutation({ client });
  const [createNavigation] = useCreateNavigationMutation({ client });
  const [createEvent] = useCreateEventMutation({ client });
  const [uploadImage] = useUploadImageMutation({
    client,
    refetchQueries: [getOperationNameFromDocument(ImageListDocument)],
  });
  const [createBlockStyle] = useCreateBlockStyleMutation({
    variables: {
      blocks: [],
      name: '',
    },
    client,
  });
  const [createComment] = useCreateCommentMutation();
  const [updateComment] = useUpdateCommentMutation();
  const [approveComment] = useApproveCommentMutation();
  const [publishArticle] = usePublishArticleMutation({ client });
  const [publishPage] = usePublishPageMutation({ client });
  const [updateArticle] = useUpdateArticleMutation({ client });
  const [createMemberPlan] = useCreateMemberPlanMutation({ client });
  const [createPaymentMethod] = useCreatePaymentMethodMutation({ client });
  //const { data: blockStylesData } = useBlockStylesQuery({ client });
  // end create hooks

  const [params] = useQueryState<URLSearchParams>(
    new URLSearchParams(window.location.search)
  );

  function handleSeedParamsChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.currentTarget.checked) {
      window.history.replaceState(
        { 'exclude-images': true },
        '',
        `${window.location.pathname}?type=exclude-images`
      );
    } else {
      window.history.replaceState(
        {
          'exclude-images': false,
        },
        '',
        `${window.location.pathname}`
      );
    }
    window.dispatchEvent(new Event('popstate'));
  }

  return (
    <SeedSession>
      <div style={{ padding: '20px' }}>
        <label
          htmlFor="exclude-images"
          style={{
            whiteSpace: 'pre-line',
            display: 'flex',
            lineHeight: '.7rem',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignContent: 'flex-start',
            cursor: 'pointer',
          }}
        >
          <input
            style={{ marginRight: '1rem', alignSelf: 'flex-start' }}
            type="checkbox"
            id="exclude-images"
            defaultChecked={params?.get('type') === 'exclude-images'}
            onChange={handleSeedParamsChange}
          />
          {`Exclude images from delete & create actions. \n
            Default is to include them. \n
            Once images are seeded, check to speed up the process & save bandwidth.`}
        </label>
        <br />
        <br />
        <button
          onClick={async e => {
            const self = e.currentTarget;
            self.disabled = true;
            const t = self.innerText;
            self.innerText = 'Seeding...';

            console.log('Starting seeding process...');
            try {
              await handleSeed(
                uploadImage,
                createAuthor,
                createTag,
                createBlockStyle,
                createArticle,
                publishArticle,
                updateArticle,
                createNavigation,
                createEvent,
                createPage,
                createComment,
                updateComment,
                approveComment,
                publishPage,
                fetchAllImages,
                createMemberPlan,
                createPaymentMethod,
                client,
                params
              );
            } catch (error) {
              console.error('Error during seeding process:', error);
            }
            console.log('Seeding process completed.');

            self.innerText = t;
            self.disabled = false;
          }}
        >
          {'Create Content'}
        </button>
        <br />
        <br />
        <button
          onClick={async e => {
            const self = e.currentTarget;
            self.disabled = true;
            const t = self.innerText;
            self.innerText = 'Deleting...';

            console.log('Starting deletion process...');
            try {
              await handleDelete(
                deleteTag,
                deleteAuthor,
                deleteArticle,
                deleteNavigation,
                deletePage,
                deleteImage,
                deleteEvent,
                deleteBlockStyle,
                deleteComment,
                deletePaymentMethod,
                deleteMemberPlan,
                deleteSubscriptionFlow,
                deleteSubscription,
                client,
                params
              );
            } catch (error) {
              console.error('Error during deletion process:', error);
            }
            console.log('Deletion process completed.');

            self.innerText = t;
            self.disabled = false;
          }}
        >
          {'Delete Content'}
        </button>
      </div>
    </SeedSession>
  );
};
