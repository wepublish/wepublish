import { faker } from '@faker-js/faker';
import { capitalize } from '@mui/material';
import {
  ImageListDocument,
  /*
  FullImageFragment,
  useImageQuery,
  useUpdateImageMutation,
    */
  useDeleteImageMutation,
  useUploadImageMutation,
} from '@wepublish/editor/api';
import {
  ArticleListDocument,
  ArticleListQueryVariables,
  AuthorListDocument,
  BlockType,
  BreakBlock,
  EventBlock,
  getApiClientV2,
  ImageBlock,
  NavigationLinkType,
  NavigationListDocument,
  PollBlock,
  QuoteBlock,
  RichTextBlock,
  TagListDocument,
  TagListQueryVariables,
  TagType,
  TeaserGridBlock,
  TeaserGridFlexBlock,
  TeaserType,
  TitleBlock,
  useCreateArticleMutation,
  useCreateAuthorMutation,
  useCreateNavigationMutation,
  useCreatePageMutation,
  useCreateTagMutation,
  useDeleteArticleMutation,
  useDeleteAuthorMutation,
  useDeleteNavigationMutation,
  useDeleteTagMutation,
  usePublishArticleMutation,
} from '@wepublish/editor/api-v2';
import {
  getImgMinSizeToCompress,
  getOperationNameFromDocument,
} from '@wepublish/ui/editor';
import imageCompression from 'browser-image-compression';
import { Descendant } from 'slate';

import * as imageData from './image-data.json';

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

  for (const imgConf of imageData) {
    const file = new File(
      [await fetch(imgConf.download_url).then(res => res.blob())],
      `image${imgConf.id}.jpg`,
      { type: 'image/jpg' }
    );

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

  /*
  const file = new File(
    [
      await fetch(
        'https://images.unsplash.com/photo-1725610588086-b9e38da987f7?q=80&w=2000'
      ).then(res => res.blob()),
    ],
    'image.jpg',
    { type: 'image/jpg' }
  );

  const optimizedImage: File = await resizeImage(file!);
  const { data } = await uploadImage({
    variables: {
      input: { file: optimizedImage!, ...commonInput },
    },
  });
  */
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

/*
async function seedImages(uploadImage: any) {
  return new Promise<any[]>(resolve => {
    return null;
  });

  if (window && !window.fetch) {
    const photos = await Promise.all([
      mediaAdapter.uploadImage(
        new Promise(resolve => {
          resolve({
            filename: 'Woman Profile',
            mimetype: 'image/jpg',
            encoding: '',
            createReadStream() {
              const fetchImage = async () => {
                const s = await fetch(
                  'https://images.unsplash.com/photo-1725610588086-b9e38da987f7?q=80&w=2000'
                )
                  .then(res => res.blob())
                  .then(blob => blob.stream());
                return s;
              };
              return fetchImage() as any;
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
        uploadImage({
          variables: {
            ...photo,
            title: faker.lorem.words({ min: 2, max: 5 }),
            description: faker.lorem.sentence(),
          },
        })
      )
    );
  }
}
*/

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
    Array.from({ length: 10 }, () =>
      createAuthor({
        variables: {
          ...nameAndSlug(),
          bio: getText(4, 9),
          jobTitle: faker.person.jobTitle(),
          imageID: shuffle(imageIds).at(0),
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
    Array.from({ length: nrOfArticlesPerTag * tagIds.length }, (_, i) => {
      const title = capitalize(faker.lorem.words({ min: 3, max: 8 }));
      return createArticle({
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
          imageID: undefined,
          breaking: false,
          paywallId: null,
          hidden: false,
          disableComments: false,
          tagIds: tagIds.length ? [tagIds[i % tagIds.length]] : [],
          canonicalUrl: faker.internet.url(),
          properties: [],
          blocks: [],
          hideAuthor: false,
          socialMediaTitle: `Social Media - ${title}`,
          socialMediaDescription: undefined,
          socialMediaAuthorIds: [],
          socialMediaImageID: undefined,
          likes: 0,
          revisions: {
            create: {
              title,
              lead: faker.lorem.paragraph(),
              socialMediaTitle: `Social Media - ${title}`,
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
              publishedAt: new Date().toISOString(),
            },
          },
        },
        include: {
          revisions: true,
        },
      });
    })
  );

  /*
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
  */

  return articles;
}

/*
  Article = 'Article',
  External = 'External',
  Page = 'Page'
*/

async function seedNavigations(createNavigation: any, tags: string[] = []) {
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

async function seedPages(
  createPage: any,
  imageIds: string[] = [],
  articleIds: string[] = []
) {
  const [home] = await Promise.all([
    createPage({
      variables: {
        publishedAt: new Date().toISOString(),
        slug: '',
        revisions: {
          create: {
            title: 'Home',
            description: faker.lorem.paragraph(),
            socialMediaTitle: 'Home',
            socialMediaDescription: faker.lorem.paragraph(),
            blocks: [
              {
                type: BlockType.FlexBlock,
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
            publishedAt: new Date().toISOString(),
          },
        },
      },
    }),
  ]);

  return [home];
}

type SeedProps = { type?: string };

export const Seed = ({ type }: SeedProps) => {
  const client = getApiClientV2();

  const PAGE_SIZE = 100;

  async function fetchAllTags() {
    let skip = 0;
    const all: Array<{ id: string }> = [];

    // The server returns up to PAGE_SIZE + 1 items to indicate more pages
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

  async function fetchAllAuthors() {
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

  async function fetchAllArticles() {
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

  async function fetchAllNavigations() {
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

  async function fetchAllImages() {
    let skip = 0;
    const all: Array<{ id: string }> = [];

    let hasMore = true;
    while (hasMore) {
      const { data } = await client.query({
        query: ImageListDocument,
        variables: {
          filter: undefined,
          take: PAGE_SIZE / 2,
          skip,
        },
        //fetchPolicy: 'network-only',
      });

      const nodes = (data?.images?.nodes ?? []) as Array<{ id: string }>;
      all.push(...nodes.map(n => ({ id: n.id })));

      hasMore = data?.images?.totalCount > all.length;
      skip += PAGE_SIZE / 2;
    }

    return all;
  }

  // delete functions

  const [deleteTag] = useDeleteTagMutation({ client });

  const [deleteAuthor] = useDeleteAuthorMutation({ client });

  const [deleteArticle] = useDeleteArticleMutation({ client });

  const [deleteNavigation] = useDeleteNavigationMutation({ client });

  const [deleteImage, { loading: isDeletingImage }] = useDeleteImageMutation();

  // end delete functions

  // create functions

  const [createTag, { data: createTagData, loading: isCreatingTag }] =
    useCreateTagMutation({
      client,
    });
  const [createAuthor] = useCreateAuthorMutation({
    client,
    refetchQueries: undefined,
  });
  const [
    createArticle,
    { data: createArticleData, loading: isCreatingArticle },
  ] = useCreateArticleMutation({ client });

  const [
    createPage,
    { data: createPageData, loading: isCreatingPage, error: createPageError },
  ] = useCreatePageMutation({ client });

  const [createNavigation, { loading: isCreatingNavigation }] =
    useCreateNavigationMutation({ client });

  const [uploadImage, { loading: isUploadingImage, error: uploadError }] =
    useUploadImageMutation({
      refetchQueries: [getOperationNameFromDocument(ImageListDocument)],
    });
  // end create functions

  const [publishArticle] = usePublishArticleMutation({
    client,
  });

  console.log('Seeding content...');

  return (
    <>
      <button
        onClick={async () => {
          const images = await seedImages(uploadImage);
          const authors = await seedAuthors(createAuthor);
          const tags = await seedArticleTags(createTag);
          const articles = await seedArticlesByTag(
            createArticle,
            tags.map(tag => tag.data?.createTag.id),
            authors.map(author => author.data?.createAuthor.id)
          );
          for (const article of articles) {
            await publishArticle({
              variables: {
                id: article?.data?.createArticle.id,
                publishedAt: new Date().toISOString(),
              },
            });
          }
          const navigations = await seedNavigations(
            createNavigation,
            tags
              .map(tag => tag.data?.createTag.tag)
              .filter(tag => !!tag) as string[]
          );
          const pages = await seedPages(createPage);
        }}
        disabled={isCreatingArticle}
      >
        {isCreatingArticle ? 'Creating...' : 'Create Content'}
      </button>

      <button
        onClick={async () => {
          const [allTags, allAuthors, allArticles, allNavigations, allImages] =
            await Promise.all([
              fetchAllTags(),
              fetchAllAuthors(),
              fetchAllArticles(),
              fetchAllNavigations(),
              fetchAllImages(),
            ]);

          console.log('allImages', allImages);

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
          /*
          await Promise.all(
            allImages.map(image =>
              deleteImage({
                variables: { id: image.id },
              })
            )
          );
          */
        }}
      >
        {'Delete Content'}
      </button>
    </>
  );
};
