import { useApolloClient } from '@apollo/client';
import { faker } from '@faker-js/faker';
import { capitalize } from '@mui/material';
import {
  ImageListDocument,
  useDeleteImageMutation,
  useUploadImageMutation,
} from '@wepublish/editor/api';
import {
  ArticleListDocument,
  ArticleListQueryVariables,
  ArticleTeaserInput,
  AuthorListDocument,
  BlockContentInput,
  BlockStyle,
  BlockStylesDocument,
  //BlockType,
  BlockWithAlignment,
  BreakBlockInput,
  CreateArticleMutationVariables,
  //BreakBlock,
  CustomTeaserInput,
  //EventBlock,
  EventListDocument,
  FlexBlockInput,
  getApiClientV2,
  //ImageBlock,
  NavigationLinkType,
  NavigationListDocument,
  PageListDocument,
  RichTextBlockInput,
  //PollBlock,
  //QuoteBlock,
  //RichTextBlock,
  Tag,
  TagListDocument,
  TagListQueryVariables,
  TagType,
  TeaserListBlockSort,
  TeaserSlotInput,
  TeaserSlotsAutofillConfig,
  TeaserSlotsBlock,
  TeaserSlotsBlockInput,
  TeaserType,
  //TitleBlock,
  TitleBlockInput,
  useCreateArticleMutation,
  useCreateAuthorMutation,
  useCreateBlockStyleMutation,
  useCreateEventMutation,
  useCreateNavigationMutation,
  useCreatePageMutation,
  useCreateTagMutation,
  useDeleteArticleMutation,
  useDeleteAuthorMutation,
  useDeleteBlockStyleMutation,
  useDeleteEventMutation,
  useDeleteNavigationMutation,
  useDeletePageMutation,
  useDeleteTagMutation,
  usePublishArticleMutation,
  usePublishPageMutation,
} from '@wepublish/editor/api-v2';
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
        input: { file: optimizedImage!, ...getCommonInput(imgConf) },
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
    Array.from(faker.helpers.uniqueArray(faker.lorem.word, 10), tag =>
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
    Array.from({ length: 10 }, (_, i) =>
      createAuthor({
        variables: {
          ...nameAndSlug(),
          bio: getText(4, 9),
          jobTitle: faker.person.jobTitle(),
          imageID: imageIds[imageIds.length - 1 - i],
          links: [],
          tagIds: [],
          hideOnArticle: false,
          hideOnTeaser: false,
          hideOnTeam: false,
        },
      })
    )
  );
}

const createArticleInput = (
  tagIds: string[],
  authorIds: string[],
  imageIds: string[],
  pollIds: string[],
  eventIds: string[],
  i: number
) => {
  const title = capitalize(faker.lorem.words({ min: 3, max: 8 }));
  return {
    variables: {
      shared: true,
      slug: faker.helpers.slugify(title.toLowerCase()),
      publishedAt: new Date().toISOString(),
      preTitle: capitalize(faker.lorem.words({ min: 3, max: 8 })),
      title,
      lead: faker.lorem.paragraph(),
      seoTitle: `SEO - ${title}`,
      authorIds: shuffle(
        authorIds
          .map(authorId => {
            const pick = pickRandom([authorId], Math.random());
            return pick.length ? pick[0][0] : undefined;
          })
          .filter(authorId => !!authorId)
      ).slice(0, faker.number.int({ min: 1, max: 3 })),
      imageID: imageIds[i],
      breaking: pickRandom(true, 0.1).length ? true : false,
      paywallId: null,
      hidden: false,
      disableComments: false,
      tagIds: tagIds.length ? [tagIds[i % tagIds.length]] : [],
      canonicalUrl: faker.internet.url(),
      properties: [],
      blocks: [
        {
          title: {
            title,
            preTitle: capitalize(faker.lorem.words({ min: 3, max: 8 })),
            lead: faker.lorem.sentences({ min: 3, max: 5 }),
          } as TitleBlockInput,
        } as BlockContentInput,
        {
          image: {
            imageID: imageIds[(i + 1) % imageIds.length],
            caption: faker.lorem.sentence(),
          },
        } as BlockContentInput,
        {
          richText: {
            richText: getText(3, 7),
          } as RichTextBlockInput,
        } as BlockContentInput,
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

const nrOfArticlesPerTag = 6;
async function seedArticlesByTag(
  createArticle: any,
  tagIds: string[] = [],
  authorIds: string[] = [],
  imageIds: string[] = [],
  pollIds: string[] = [],
  eventIds: string[] = []
) {
  const articles = await Promise.all(
    Array.from({ length: nrOfArticlesPerTag * tagIds.length }, (_, index) => {
      return createArticle(
        createArticleInput(
          tagIds,
          authorIds,
          imageIds,
          pollIds,
          eventIds,
          index
        )
      );
    })
  );

  return articles;
}

async function seedArticles(
  createArticle: any,
  tagIds: string[] = [],
  authorIds: string[] = [],
  imageIds: string[] = [],
  pollIds: string[] = [],
  eventIds: string[] = []
) {
  const articles = await Promise.all(
    Array.from({ length: 1 }, (_, index) => {
      return createArticle(
        createArticleInput(
          tagIds,
          authorIds,
          imageIds,
          pollIds,
          eventIds,
          index
        )
      );
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
  const [navbar, categories, aboutUs, footer] = await Promise.all([
    createNavigation({
      variables: {
        key: 'main',
        name: 'Navbar',
        links: [
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
    }),
    createNavigation({
      variables: {
        key: 'categories',
        name: 'Rubriken',
        links: tags.map(tag => ({
          type: NavigationLinkType.External,
          label: capitalize(tag),
          url: `/a/tag/${tag}`,
        })),
      },
    }),
    createNavigation({
      variables: {
        key: 'about-us',
        name: 'Über uns',
        links: [
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
    }),
    createNavigation({
      variables: {
        key: 'footer',
        name: 'Footer',
        links: [
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
    }),
  ]);

  return [navbar, categories, aboutUs, footer];
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

const createBlockWithAlignmentForArchiveLayout = (tag: any, index: number) => {
  return {
    alignment: {
      i: index.toString(),
      x: index * 2,
      y: 0,
      w: 2,
      h: 7,
      static: false,
    },
    block: {
      teaserSlots: {
        title: capitalize(tag.tag as string),
        autofillConfig: {
          enabled: true,
          filter: {
            tags: [tag.id],
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
          {
            type: 'Manual',
            teaser: {
              custom: {
                preTitle: `Mehr über ${capitalize(tag.tag as string)}`,
                title: '',
                lead: null,
                contentUrl: new URL(tag.url).pathname,
                openInNewTab: false,
                properties: [],
                imageID: null,
              },
            },
          },
        ],
      } as TeaserSlotsBlockInput,
    } as BlockContentInput,
  };
};

async function seedPages(
  createPage: any,
  imageIds: string[] = [],
  tags: Tag[] = [],
  articleIds: string[] = [],
  heroArticleId: string[] = [],
  blockStyles: any
) {
  const pages = await Promise.all([
    createPage({
      variables: {
        publishedAt: new Date().toISOString(),
        slug: '',
        tagIds: [],
        imageID: null,
        canonicalUrl: null,
        properties: [],
        blocks: [
          {
            flexBlock: {
              blockStyle: getBlockStyle(blockStyles, 'TabbedContentSidebar'),
              blocks: [
                // heros teaser
                {
                  alignment: {
                    i: '0',
                    x: 0,
                    y: 0,
                    w: 6,
                    h: 7,
                    static: false,
                  },
                  block: {
                    teaserSlots: {
                      title: 'Hero Teaser',
                      autofillConfig: {
                        enabled: false,
                      } as TeaserSlotsAutofillConfig,
                      slots: [
                        {
                          type: 'Manual',
                          teaser: {
                            article: {
                              articleID: heroArticleId[0],
                            } as ArticleTeaserInput,
                          } as TeaserSlotInput,
                        },
                      ],
                    } as TeaserSlotsBlock,
                  } as BlockContentInput,
                },

                // daily briefing
                {
                  alignment: {
                    i: '1',
                    x: 6,
                    y: 0,
                    w: 2,
                    h: 7,
                    static: false,
                  },
                  block: {
                    teaserSlots: {
                      title: 'Briefing',
                      autofillConfig: {
                        enabled: false,
                      } as TeaserSlotsAutofillConfig,
                      slots: [
                        {
                          type: 'Manual',
                          teaser: {
                            custom: {
                              title: 'daily-briefing',
                            } as ArticleTeaserInput,
                          } as TeaserSlotInput,
                        },
                        {
                          type: 'Manual',
                          teaser: {
                            custom: {
                              preTitle: 'Kostenlos abonnieren!',
                              title: 'Das Wichtigste aus Zürich',
                              lead: faker.lorem.paragraph(),
                              contentUrl:
                                '/newsletter?mc_u=56ee24de7341c744008a13c9e&mc_id=32c65d081a&mc_f_id=00e5c2e1f0&source=tsri&tf_id=jExhxiVv&popTitle=BASIUM%20UBI%20CURA%20ZÜRI&popButtonText=Lorem%20ipsum%20dolor!&popText=Provident%20agnosco%20absorbeo%20victoria%20rem%20celer%20uberrime%20vilis%20suscipit%20peccatus.%20Velum%20xiphias%20fuga%20solus%20alienus%20supplanto.%20Officiis%20cura%20cultellus%20tantum%20atrocitas.',
                            } as ArticleTeaserInput,
                          } as TeaserSlotInput,
                        },
                      ],
                    } as TeaserSlotsBlock,
                  } as BlockContentInput,
                },

                // event teasers
                {
                  alignment: {
                    i: '2',
                    x: 8,
                    y: 0,
                    w: 2,
                    h: 7,
                    static: false,
                  },
                  block: {
                    teaserSlots: {
                      title: 'Fokusmonat',
                      autofillConfig: {
                        enabled: true,
                        filter: {},
                        teaserType: TeaserType.Event,
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
                        {
                          type: 'Manual',
                          teaser: {
                            custom: {
                              title: 'Kreislaufwirtschaft',
                              lead: 'Unsere Events rund ums Thema Kreislauf-wirtschaft lia cum rem fugit es doluptur ratis ma dolorem numquo to excea illam ra voluptis endanis deris seque por aciaeri busciti scimin porum aliquid ut esti.',
                              preTitle: 'Alles zu Civic Media',
                              contentUrl:
                                'https://wepublish.ch/events/kreislaufwirtschaft',
                            },
                          },
                        },
                      ],
                    } as TeaserSlotsBlock,
                  } as BlockContentInput,
                },

                // shop product teasers
                {
                  alignment: {
                    i: '3',
                    x: 10,
                    y: 0,
                    w: 2,
                    h: 7,
                    static: false,
                  },
                  block: {
                    teaserSlots: {
                      title: 'Shop',
                      autofillConfig: {
                        enabled: false,
                      } as TeaserSlotsAutofillConfig,
                      slots: [
                        {
                          type: 'Manual',
                          teaser: {
                            custom: {
                              title: 'Tsüri Lette',
                              lead: 'Der Sommer ist da! Adilette, obere Lette, undere Lette, ... cheggsch? CHF 39.00',
                              contentUrl:
                                'https://shop.tsri.ch/products/tsuri-lette-1',
                              imageID: imageIds[imageIds.length - 20],
                            } as CustomTeaserInput,
                          },
                        },
                        {
                          type: 'Manual',
                          teaser: {
                            custom: {
                              title: 'Tsüri Lette',
                              lead: 'Der Sommer ist da! Adilette, obere Lette, undere Lette, ... cheggsch? CHF 39.00',
                              contentUrl:
                                'https://shop.tsri.ch/products/tsuri-lette-1',
                              imageID: imageIds[imageIds.length - 21],
                            } as CustomTeaserInput,
                          },
                        },
                        {
                          type: 'Manual',
                          teaser: {
                            custom: {
                              title: 'Tsüri Lette',
                              lead: 'Der Sommer ist da! Adilette, obere Lette, undere Lette, ... cheggsch? CHF 39.00',
                              contentUrl:
                                'https://shop.tsri.ch/products/tsuri-lette-1',
                              imageID: imageIds[imageIds.length - 22],
                            } as CustomTeaserInput,
                          },
                        },
                        {
                          type: 'Manual',
                          teaser: {
                            custom: {
                              preTitle: 'Zum Shop',
                              contentUrl: 'https://shop.tsri.ch/',
                            } as CustomTeaserInput,
                          },
                        },
                      ] as TeaserSlotInput[],
                    } as TeaserSlotsBlock,
                  } as BlockContentInput,
                },
              ] as BlockWithAlignment[],
            } as FlexBlockInput,
          } as BlockContentInput,

          {
            flexBlock: {
              blocks: [
                {
                  alignment: {
                    i: '0',
                    x: 0,
                    y: 0,
                    w: 12,
                    h: 2,
                    static: false,
                  },
                  block: {
                    teaserSlots: {
                      title: 'FullsizeImage - 6 Teasers',
                      blockStyle: getBlockStyle(blockStyles, 'FullsizeImage'),
                      autofillConfig: {
                        enabled: true,
                        filter: {},
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
                      ],
                    } as TeaserSlotsBlock,
                  } as BlockContentInput,
                },
              ] as BlockWithAlignment[],
            } as FlexBlockInput,
          } as BlockContentInput,

          {
            linkPageBreak: {
              blockStyle: getBlockStyle(blockStyles, 'LinkPageBreak'),
              hideButton: false,
              imageID: imageIds[imageIds.length - 15],
              linkTarget: null,
              linkText: faker.lorem.words({ min: 1, max: 3 }),
              linkURL: 'https://shop.tsri.ch/products/cap-tsuri',
              richText: getText(2, 2) as Descendant[],
              text: 'Shop',
            } as BreakBlockInput,
          } as BlockContentInput,

          {
            flexBlock: {
              blocks: [
                {
                  alignment: {
                    i: '0',
                    x: 0,
                    y: 0,
                    w: 12,
                    h: 2,
                    static: false,
                  },
                  block: {
                    teaserSlots: {
                      title: 'XLFullsizeImage - 2 Teasers',
                      blockStyle: getBlockStyle(blockStyles, 'XLFullsizeImage'),
                      autofillConfig: {
                        enabled: true,
                        filter: {},
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
                      ],
                    } as TeaserSlotsBlock,
                  } as BlockContentInput,
                },

                {
                  alignment: {
                    i: '1',
                    x: 0,
                    y: 2,
                    w: 12,
                    h: 2,
                    static: false,
                  },
                  block: {
                    teaserSlots: {
                      title: 'NoImageAltColor - 3 Teasers ',
                      blockStyle: getBlockStyle(blockStyles, 'NoImageAltColor'),
                      autofillConfig: {
                        enabled: true,
                        filter: {},
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
                      ],
                    } as TeaserSlotsBlock,
                  } as BlockContentInput,
                },

                {
                  alignment: {
                    i: '2',
                    x: 0,
                    y: 4,
                    w: 12,
                    h: 2,
                    static: false,
                  },
                  block: {
                    teaserSlots: {
                      title: 'TwoColAltColor - 3 Teasers',
                      blockStyle: getBlockStyle(blockStyles, 'TwoColAltColor'),
                      autofillConfig: {
                        enabled: true,
                        filter: {},
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
                      ],
                    } as TeaserSlotsBlock,
                  } as BlockContentInput,
                },
              ] as BlockWithAlignment[],
            } as FlexBlockInput,
          } as BlockContentInput,

          {
            flexBlock: {
              blockStyle: getBlockStyle(blockStyles, 'TabbedContentMain'),
              blocks: tags
                .splice(0, 6)
                .map(
                  createBlockWithAlignmentForArchiveLayout
                ) as BlockWithAlignment[],
            } as FlexBlockInput,
          } as BlockContentInput,
        ] as BlockContentInput[],
      },
    }),
  ]);

  return pages;
}

async function seedBlockStyles(createBlockStyle: any): Promise<BlockStyle[]> {
  const blockStylesData = [
    /*
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
    */

    // block layouts for FlexBlock
    {
      name: 'TabbedContent',
      blocks: ['FlexBlock'],
    },
    {
      name: 'TabbedContentMain',
      blocks: ['FlexBlock'],
    },
    {
      name: 'TabbedContentSidebar',
      blocks: ['FlexBlock'],
    },

    // archive layouts
    {
      name: 'ArchiveTopic',
      blocks: ['TeaserSlots'],
    },
    {
      name: 'ArchiveTopicWithTwoCol',
      blocks: ['TeaserSlots'],
    },
    {
      name: 'ArchiveTopicAuthor',
      blocks: ['TeaserSlots'],
    },

    // archive sidebar layouts
    {
      name: 'DailyBriefing',
      blocks: ['TeaserSlots'],
    },
    {
      name: 'ShopProducts',
      blocks: ['TeaserSlots'],
    },
    {
      name: 'FocusMonth',
      blocks: ['TeaserSlots'],
    },
    {
      name: 'TsriLove',
      blocks: ['TeaserSlots'],
    },

    // normal teaser layouts
    {
      name: 'FullsizeImage',
      blocks: ['TeaserSlots'],
    },
    {
      name: 'XLFullsizeImage',
      blocks: ['TeaserSlots'],
    },
    {
      name: 'NoImage',
      blocks: ['TeaserSlots'],
    },
    {
      name: 'NoImageAltColor',
      blocks: ['TeaserSlots'],
    },
    {
      name: 'TwoCol',
      blocks: ['TeaserSlots'],
    },
    {
      name: 'TwoColAltColor',
      blocks: ['TeaserSlots'],
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

async function fetchAllImages(clientV1: any) {
  let skip = 0;
  const all: Array<{ id: string }> = [];

  let hasMore = true;
  while (hasMore) {
    const { data } = await clientV1.query({
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
  client: any,
  clientV1: any,
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
  ] = await Promise.all([
    fetchAllTags(client),
    fetchAllAuthors(client),
    fetchAllArticles(client),
    fetchAllNavigations(client),
    !(params?.get('type') === 'exclude-images') ?
      fetchAllImages(clientV1)
    : Promise.resolve([]),
    fetchAllPages(client),
    fetchAllEvents(client),
    fetchAllBlockStyles(client),
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
}

async function handleSeed(
  uploadImage: ReturnType<typeof useUploadImageMutation>[0],
  createAuthor: ReturnType<typeof useCreateAuthorMutation>[0],
  createTag: ReturnType<typeof useCreateTagMutation>[0],
  createBlockStyle: ReturnType<typeof useCreateBlockStyleMutation>[0],
  createArticle: ReturnType<typeof useCreateArticleMutation>[0],
  publishArticle: ReturnType<typeof usePublishArticleMutation>[0],
  createNavigation: ReturnType<typeof useCreateNavigationMutation>[0],
  createEvent: ReturnType<typeof useCreateEventMutation>[0],
  createPage: ReturnType<typeof useCreatePageMutation>[0],
  publishPage: ReturnType<typeof usePublishPageMutation>[0],
  fetchAllImages: (clientV1: any) => Promise<Array<{ id: string }>>,
  clientV1: any,
  params?: URLSearchParams
) {
  const images =
    !(params?.get('type') === 'exclude-images') ?
      await seedImages(uploadImage)
    : (await fetchAllImages(clientV1)).map(img => img.id);

  const authors = await seedAuthors(createAuthor, images);
  const tags = await seedArticleTags(createTag);
  const blockStyles = await seedBlockStyles(createBlockStyle);
  const articles = await seedArticlesByTag(
    createArticle,
    tags.map(tag => tag.data?.createTag.id),
    authors.map(author => author.data?.createAuthor.id),
    images
  );
  const heroArticle = await seedArticles(
    createArticle,
    tags.map(tag => tag.data?.createTag.id),
    authors.map(author => author.data?.createAuthor.id),
    images
  );

  for (const article of [...articles, ...heroArticle]) {
    await publishArticle({
      variables: {
        id: article?.data?.createArticle.id,
        publishedAt: new Date().toISOString(),
      },
    });
  }

  const navigations = await seedNavigations(
    createNavigation,
    tags.map(tag => tag.data?.createTag.tag).filter(tag => !!tag) as string[]
  );

  const events = await seedEvents(createEvent, images);

  const pages = await seedPages(
    createPage,
    images,
    tags.map(tag => tag.data?.createTag),
    articles.map(article => article.data?.createArticle.id),
    heroArticle.map(article => article.data?.createArticle.id),
    blockStyles
  );

  for (const page of pages) {
    await publishPage({
      variables: {
        id: page?.data?.createPage.id,
        publishedAt: new Date().toISOString(),
      },
    });
  }
}

type SeedProps = { type?: string };

export const Seed = ({ type }: SeedProps) => {
  const client = getApiClientV2();
  const clientV1 = useApolloClient(); // used to fetch all images --> api v1

  // delete hooks
  const [deleteTag] = useDeleteTagMutation({ client });
  const [deleteAuthor] = useDeleteAuthorMutation({ client });
  const [deleteArticle] = useDeleteArticleMutation({ client });
  const [deleteNavigation] = useDeleteNavigationMutation({ client });
  const [deletePage] = useDeletePageMutation({ client });
  const [deleteImage] = useDeleteImageMutation();
  const [deleteEvent] = useDeleteEventMutation({ client });
  const [deleteBlockStyle] = useDeleteBlockStyleMutation({ client });
  // end delete hooks

  // create hooks
  const [createTag] = useCreateTagMutation({ client });
  const [createAuthor] = useCreateAuthorMutation({ client });
  const [createArticle] = useCreateArticleMutation({ client });
  const [createPage] = useCreatePageMutation({ client });
  const [createNavigation] = useCreateNavigationMutation({ client });
  const [createEvent] = useCreateEventMutation({ client });
  const [uploadImage] = useUploadImageMutation({
    refetchQueries: [getOperationNameFromDocument(ImageListDocument)],
  });
  const [createBlockStyle] = useCreateBlockStyleMutation({
    variables: {
      blocks: [],
      name: '',
    },
    client,
  });
  const [publishArticle] = usePublishArticleMutation({ client });
  const [publishPage] = usePublishPageMutation({ client });
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
                createNavigation,
                createEvent,
                createPage,
                publishPage,
                fetchAllImages,
                clientV1,
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
                client,
                clientV1,
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
