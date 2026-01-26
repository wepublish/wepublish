import { useApolloClient } from '@apollo/client';
import { faker } from '@faker-js/faker';
import { capitalize } from '@mui/material';
import {
  CommentAuthorType,
  CommentItemType,
  CommentListDocument,
  CommentState,
  ProductType,
  SubscriptionListDocument,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useDeleteSubscriptionMutation,
} from '@wepublish/editor/api';
import {
  ArticleListDocument,
  ArticleListQueryVariables,
  AuthorListDocument,
  BlockContentInput,
  BlockStyle,
  BlockStylesDocument,
  BreakBlockInput,
  CreateArticleMutationVariables,
  EventListDocument,
  getApiClientV2,
  IFrameBlockInput,
  ImageBlockInput,
  ImageListDocument,
  MemberPlanListDocument,
  NavigationLinkType,
  NavigationListDocument,
  PageListDocument,
  PaymentMethodListDocument,
  RichTextBlockInput,
  SubscriptionFlowsDocument,
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
  useCreateArticleMutation,
  useCreateAuthorMutation,
  useCreateBlockStyleMutation,
  useCreateEventMutation,
  useCreateMemberPlanMutation,
  useCreateNavigationMutation,
  useCreatePageMutation,
  useCreatePaymentMethodMutation,
  useCreateTagMutation,
  useDeleteArticleMutation,
  useDeleteAuthorMutation,
  useDeleteBlockStyleMutation,
  useDeleteEventMutation,
  useDeleteImageMutation,
  useDeleteMemberPlanMutation,
  useDeleteNavigationMutation,
  useDeletePageMutation,
  useDeletePaymentMethodMutation,
  useDeleteSubscriptionFlowMutation,
  useDeleteTagMutation,
  usePublishArticleMutation,
  usePublishPageMutation,
  useUpdateArticleMutation,
  useUploadImageMutation,
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

const createArticleInput = (
  tagIds: string[],
  authorIds: string[],
  imageIds: string[],
  i: number,
  blockStyles: BlockStyle[]
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
      authorIds: [shuffle(authorIds).at(0)],
      imageID: imageIds[i],
      breaking: pickRandom(true, 0.1).length ? true : false,
      paywallId: null,
      hidden: false,
      disableComments: false,
      tagIds: (() => {
        if (tagIds.length) {
          let _tagIds = [...tagIds];
          let picks: string[] | never[] = [];
          for (let i = 0; i < 4; i++) {
            picks = [
              ...picks,
              ...pickRandom(
                (_tagIds = shuffle(_tagIds)).splice(0, 1)[0],
                Math.random()
              ),
            ];
          }
          picks = picks.filter((tagId, i) => !!tagId);
          return [..._tagIds.splice(i % tagIds.length, 1), ...picks];
        }
        return [];
      })(),
      canonicalUrl: faker.internet.url(),
      properties: [],
      blocks: [
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

        // a break block --> on large screens placed in sidebar
        {
          linkPageBreak: {
            blockStyle: getBlockStyle(blockStyles, 'SB_SidebarContent'),
            hideButton: false,
            text: 'Shop',
            imageID: imageIds[imageIds.length - 25],
            linkTarget: null,
            linkText: capitalize(faker.lorem.words({ min: 1, max: 3 })),
            linkURL: 'https://shop.tsri.ch/products/cap-tsuri',
            richText: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: `Neu! ${capitalize(faker.lorem.words({ min: 2, max: 4 }))}`,
                  },
                ],
              },
              ...(getText(1, 1) as Descendant[]),
              {
                type: 'paragraph',
                children: [
                  {
                    text: `Design von Armanda Asani
CHF 42.00

Jetzt im Shop erhältlich.`,
                  },
                ],
              },
            ] as Descendant[],
          } as BreakBlockInput,
        } as BlockContentInput,

        // a rich text block
        {
          richText: {
            richText: getText(3, 7),
          } as RichTextBlockInput,
        } as BlockContentInput,

        // a bildwurf ad block
        {
          bildwurfAd: {
            zoneID: '77348',
          } as IFrameBlockInput,
        } as BlockContentInput,

        // some alternating image and rich text blocks
        ...Array.from({ length: faker.number.int({ min: 5, max: 9 }) }, () => {
          const imageBlock = pickRandom<BlockContentInput>(
            {
              image: {
                imageID:
                  imageIds[
                    faker.number.int({ min: 0, max: imageIds.length - 1 })
                  ],
                caption: faker.lorem.sentence(),
              } as ImageBlockInput,
            },
            0.1
          );
          const richTextBlock = {
            richText: {
              richText: [
                {
                  type: 'heading-three',
                  children: [
                    {
                      text: capitalize(faker.lorem.words({ min: 3, max: 9 })),
                    },
                  ],
                },
                ...(getText(3, 5) as Descendant[]),
              ] as Descendant[],
            } as RichTextBlockInput,
          } as BlockContentInput;
          if (imageBlock.length) {
            return imageBlock[0];
          } else {
            return richTextBlock;
          }
        }),

        // another break block (newsletter registration) --> on large screens placed in sidebar
        {
          linkPageBreak: {
            blockStyle: getBlockStyle(blockStyles, 'SB_SidebarContent'),
            hideButton: false,
            imageID: imageIds[imageIds.length - 30],
            linkTarget: null,
            linkText: capitalize(faker.lorem.words({ min: 1, max: 3 })),
            linkURL: `/newsletter?mc_u=56ee24de7341c744008a13c9e&mc_id=32c65d081a&mc_f_id=00e5c2e1f0&source=tsri&tf_id=jExhxiVv&popTitle=${encodeURIComponent(faker.lorem.words({ min: 2, max: 5 }).toUpperCase())}&popButtonText=${encodeURIComponent(capitalize(faker.lorem.words({ min: 2, max: 3 })))}&popText=${encodeURIComponent(faker.lorem.sentence({ min: 16, max: 30 }))}`,
            richText: [
              {
                type: 'heading-two',
                children: [
                  {
                    text: capitalize(faker.lorem.words({ min: 2, max: 4 })),
                  },
                ],
              },
              ...(getText(1, 1) as Descendant[]),
            ] as Descendant[],
            text: 'Newsletter',
          } as BreakBlockInput,
        } as BlockContentInput,

        // more rich text blocks
        ...Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => {
          return {
            richText: {
              richText: [
                {
                  type: 'heading-three',
                  children: [
                    {
                      text: capitalize(faker.lorem.words({ min: 3, max: 9 })),
                    },
                  ],
                },
                ...(getText(3, 5) as Descendant[]),
              ] as Descendant[],
            } as RichTextBlockInput,
          } as BlockContentInput;
        }),
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

const nrOfArticlesPerTag = 7;
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

async function seedArticles(
  createArticle: any,
  updateArticle: any,
  tagIds: string[] = [],
  authorIds: string[] = [],
  imageIds: string[] = [],
  blockStyles: BlockStyle[]
) {
  const articles = await Promise.all(
    Array.from({ length: 1 }, (_, index) => {
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

  const [main, meta] = await Promise.all([
    createNavigation({
      variables: {
        key: 'main',
        name: 'Main Navigation',
        links: [
          {
            type: NavigationLinkType.External,
            label: 'Recherchen',
            url: faker.internet.url(),
          },
          {
            type: NavigationLinkType.External,
            label: 'News',
            url: faker.internet.url(),
          },
          {
            type: NavigationLinkType.External,
            label: 'Über uns',
            url: faker.internet.url(),
          },
          {
            type: NavigationLinkType.External,
            label: 'Workshop',
            url: faker.internet.url(),
          },
          {
            type: NavigationLinkType.External,
            label: 'Unterstützen',
            url: faker.internet.url(),
          },
          {
            type: NavigationLinkType.External,
            label: 'Mitglied werden',
            url: faker.internet.url(),
          },
          {
            type: NavigationLinkType.External,
            label: 'Mitgliedschaft verschenken',
            url: faker.internet.url(),
          },
          {
            type: NavigationLinkType.External,
            label: 'Recherchefonds',
            url: faker.internet.url(),
          },
          {
            type: NavigationLinkType.External,
            label: 'Kontakt',
            url: faker.internet.url(),
          },
          {
            type: NavigationLinkType.External,
            label: 'Hinweise',
            url: faker.internet.url(),
          },
          {
            type: NavigationLinkType.External,
            label: 'Umfrage',
            url: faker.internet.url(),
          },
        ],
      },
    }),
    /*
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
    */
    createNavigation({
      variables: {
        key: 'meta',
        name: 'Meta Navigation',
        links: [
          {
            type: NavigationLinkType.External,
            label: 'Mitglieder Login',
            url: faker.internet.url(),
          },
          {
            type: NavigationLinkType.External,
            label: 'Mitglieder Login',
            url: `/login`,
          },
          {
            type: NavigationLinkType.External,
            label: 'Datenschutzerklärung',
            url: faker.internet.url(),
          },
        ],
      },
    }),
    /*
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
        */
  ]);

  return [main, meta];
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
            linkPageBreak: {
              blockStyle: getBlockStyle(blockStyles, 'AttentionCatcher'),
              hideButton: false,
              text: 'Shop',
              imageID: imageIds[imageIds.length - 15],
              linkTarget: null,
              linkText: capitalize(faker.lorem.words({ min: 1, max: 3 })),
              linkURL: 'https://shop.tsri.ch/products/cap-tsuri',
              richText: [
                {
                  type: 'heading-two',
                  children: [
                    {
                      text: capitalize(faker.lorem.words({ min: 2, max: 4 })),
                    },
                  ],
                },
                ...(getText(2, 2) as Descendant[]),
              ] as Descendant[],
            } as BreakBlockInput,
          } as BlockContentInput,

          {
            teaserSlots: {
              title: 'XLFullsizeImage - 2 Teasers',
              blockStyle: undefined,
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
            } as TeaserSlotInput,
          } as BlockContentInput,
        ] as BlockContentInput[],
      },
    }),
  ]);

  return pages;
}

async function seedComments(
  createComment: any,
  articleIds: string[],
  imageIds: string[] = []
) {
  const comments = await Promise.all(
    articleIds.flatMap(async articleId => {
      const firstBatchOfComments = await Promise.all(
        Array.from({ length: faker.number.int({ min: 0, max: 8 }) }, () =>
          createComment({
            variables: {
              text: getText(2, 4) as Descendant[],
              tagIds: [],
              itemID: articleId,
              parentID: null,
              itemType: CommentItemType.Article,
              authorType: CommentAuthorType.GuestUser,
              source: capitalize(faker.lorem.words({ min: 3, max: 8 })),
              state: CommentState.Approved,
              guestUsername: faker.person.fullName(),
              guestUserImageID: shuffle(imageIds).at(0),
              userRatings: [],
            },
          })
        )
      );

      const repliesToFirstBatchOfComments = await Promise.all(
        firstBatchOfComments.flatMap(async parentComment => {
          return Promise.all(
            Array.from({ length: faker.number.int({ min: 0, max: 4 }) }, () =>
              createComment({
                variables: {
                  text: getText(1, 3) as Descendant[],
                  tagIds: [],
                  itemID: articleId,
                  parentID: parentComment.data.createComment.id,
                  itemType: CommentItemType.Article,
                  authorType: CommentAuthorType.GuestUser,
                  source: capitalize(faker.lorem.words({ min: 3, max: 8 })),
                  state: CommentState.Approved,
                  guestUsername: faker.person.fullName(),
                  guestUserImageID: shuffle(imageIds).at(0),
                  userRatings: [],
                },
              })
            )
          );
        })
      );

      return [...firstBatchOfComments, ...repliesToFirstBatchOfComments];
    })
  );
  return comments;
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
      name: 'SB_DailyBriefing',
      blocks: ['TeaserSlots'],
    },
    {
      name: 'SB_ShopProducts',
      blocks: ['TeaserSlots'],
    },
    {
      name: 'SB_Events',
      blocks: ['TeaserSlots'],
    },
    {
      name: 'SB_TsriLove',
      blocks: ['TeaserSlots'],
    },

    // normal teaser layouts
    {
      name: 'T_FullsizeImage',
      blocks: ['TeaserSlots'],
    },
    {
      name: 'T_XLFullsizeImage',
      blocks: ['TeaserSlots'],
    },
    {
      name: 'T_NoImage',
      blocks: ['TeaserSlots'],
    },
    {
      name: 'T_NoImageAltColor',
      blocks: ['TeaserSlots'],
    },
    {
      name: 'T_TwoCol',
      blocks: ['TeaserSlots'],
    },
    {
      name: 'T_TwoColAltColor',
      blocks: ['TeaserSlots'],
    },

    // break block styles
    {
      name: 'AttentionCatcher',
      blocks: ['LinkPageBreak'],
    },
    {
      name: 'SB_SidebarContent',
      blocks: ['LinkPageBreak'],
    },
    {
      name: 'ContextBox',
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

async function fetchAllComments(clientV1: any) {
  let skip = 0;
  const all: Array<{ id: string }> = [];

  let hasMore = true;
  while (hasMore) {
    const { data } = await clientV1.query({
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

async function fetchAllSubscriptions(clientV1: any) {
  let skip = 0;
  const all: Array<{ id: string }> = [];

  let hasMore = true;
  while (hasMore) {
    const { data } = await clientV1.query({
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
    fetchAllComments(clientV1),
    fetchAllMemberPlans(client),
    fetchAllPaymentMethods(client),
    fetchAllSubscriptionFlows(client),
    fetchAllSubscriptions(clientV1),
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
  publishPage: ReturnType<typeof usePublishPageMutation>[0],
  fetchAllImages: (client: any) => Promise<Array<{ id: string }>>,
  createMemberPlan: ReturnType<typeof useCreateMemberPlanMutation>[0],
  createPaymentMethod: ReturnType<typeof useCreatePaymentMethodMutation>[0],
  clientV1: any,
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
    tags.map(tag => tag.data?.createTag.id),
    authors.map(author => author.data?.createAuthor.id),
    images,
    blockStyles
  );

  const heroArticle = await seedArticles(
    createArticle,
    updateArticle,
    tags.map(tag => tag.data?.createTag.id),
    authors.map(author => author.data?.createAuthor.id),
    images,
    blockStyles
  );

  for (const article of [...articles, ...heroArticle]) {
    await publishArticle({
      variables: {
        id: article.id,
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
    articles.map(article => article.id),
    heroArticle.map(article => article.id),
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

  const comments = await seedComments(
    createComment,
    articles.map(article => article.id),
    images
  );

  const paymentMethods = await seedPaymentMethods(createPaymentMethod);

  const memberPlans = await seedMemberPlans(createMemberPlan, paymentMethods);
}

type SeedProps = { type?: string };

export const Seed = ({ type }: SeedProps) => {
  const client = getApiClientV2();
  const clientV1 = useApolloClient(); // used handle comments --> api v1

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
                publishPage,
                fetchAllImages,
                createMemberPlan,
                createPaymentMethod,
                clientV1,
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
