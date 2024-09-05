import {Meta} from '@storybook/react'
import {
  Event,
  EventStatus,
  FullAuthorFragment,
  FullImageFragment,
  PageDocument,
  PageQuery
} from '@wepublish/website/api'
import {PageContainer} from './page-container'
import {css} from '@emotion/react'

const image = {
  __typename: 'Image',
  id: 'ljh9FHAvHAs0AxC',
  mimeType: 'image/jpg',
  format: 'jpg',
  createdAt: '2023-04-18T12:38:56.369Z',
  modifiedAt: '2023-04-18T12:38:56.371Z',
  filename: 'DSC07717',
  extension: '.JPG',
  width: 4000,
  height: 6000,
  fileSize: 8667448,
  description: null,
  tags: [],
  source: null,
  link: null,
  license: null,
  focalPoint: {
    x: 0.5,
    y: 0.5
  },
  title: null,
  url: 'https://unsplash.it/500/281',
  xl: 'https://unsplash.it/1200/400',
  l: 'https://unsplash.it/1000/400',
  m: 'https://unsplash.it/800/400',
  s: 'https://unsplash.it/500/300',
  xs: 'https://unsplash.it/300/200',
  xxs: 'https://unsplash.it/200/100',
  xlSquare: 'https://unsplash.it/1200/1200',
  lSquare: 'https://unsplash.it/1000/1000',
  mSquare: 'https://unsplash.it/800/800',
  sSquare: 'https://unsplash.it/500/500',
  xsSquare: 'https://unsplash.it/300/300',
  xxsSquare: 'https://unsplash.it/200/200'
} as FullImageFragment

const event = {
  id: '16ca80ce-a2d0-44dc-8c87-b735e4b08877',
  name: 'Cool concert',
  description: [
    {
      type: 'paragraph',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, '
        },
        {
          text: 'consectetur adipiscing elit, ',
          bold: true
        },
        {
          text: 'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
          italic: true
        },
        {
          text: 'Ut enim ad minim veniam, ',
          underline: true
        },
        {
          text: 'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ',
          strikethrough: true
        },
        {
          text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. '
        },
        {
          text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        }
      ]
    },
    {
      type: 'paragraph',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, '
        },
        {
          text: 'consectetur adipiscing elit, ',
          bold: true
        },
        {
          text: 'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
          italic: true
        },
        {
          text: 'Ut enim ad minim veniam, ',
          underline: true
        },
        {
          text: 'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ',
          strikethrough: true
        },
        {
          text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. '
        },
        {
          text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        }
      ]
    },
    {
      type: 'paragraph',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, '
        },
        {
          text: 'consectetur adipiscing elit, ',
          bold: true
        },
        {
          text: 'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
          italic: true
        },
        {
          text: 'Ut enim ad minim veniam, ',
          underline: true
        },
        {
          text: 'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ',
          strikethrough: true
        },
        {
          text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. '
        },
        {
          text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        }
      ]
    },
    {
      type: 'paragraph',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, '
        },
        {
          text: 'consectetur adipiscing elit, ',
          bold: true
        },
        {
          text: 'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
          italic: true
        },
        {
          text: 'Ut enim ad minim veniam, ',
          underline: true
        },
        {
          text: 'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ',
          strikethrough: true
        },
        {
          text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. '
        },
        {
          text: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        }
      ]
    }
  ],
  status: EventStatus.Scheduled,
  location: 'Basel',
  image,
  tags: [
    {
      id: 'cldwtndha026601nui49kyxrk',
      tag: 'Concert',
      __typename: 'Tag'
    }
  ],
  startsAt: '2023-02-24T09:00:00.000Z',
  endsAt: '2023-02-25T07:30:00.000Z',
  url: 'https://example.com',
  __typename: 'Event'
} as Event

const author = {
  __typename: 'Author',
  id: 'clgp1hfio50331801rejmrk6sj3',
  slug: 'slug',
  name: 'Foobar',
  jobTitle: 'Editor',
  url: 'https://example.com',
  bio: [
    {
      type: 'paragraph',
      children: [
        {
          text: 'Normal text,'
        }
      ]
    }
  ],
  links: [
    {
      title: 'Twitter',
      url: 'https://twitter.com',
      __typename: 'AuthorLink'
    },
    {
      title: 'Facebook',
      url: 'https://facebook.com',
      __typename: 'AuthorLink'
    },
    {
      title: 'Instagram',
      url: 'https://instagram.com',
      __typename: 'AuthorLink'
    }
  ],
  image,
  createdAt: '2023-01-01',
  modifiedAt: '2023-01-01'
} as FullAuthorFragment

const page = {
  __typename: 'Page',
  id: 'clgoyl8n042780301remhfw9cqj',
  slug: 'slug',
  url: 'https://example.com',
  title: 'title',
  description: '',
  image,
  tags: ['foo', 'bar'],
  socialMediaImage: image,
  socialMediaDescription: 'socialMediaDescription',
  socialMediaTitle: 'socialMediaTitle',
  blocks: [
    {
      __typename: 'TitleBlock',
      title: 'Title',
      lead: 'Lead'
    },
    {
      __typename: 'RichTextBlock',
      richText: [
        {
          type: 'heading-one',
          children: [
            {
              text: 'Title'
            }
          ]
        },
        {
          type: 'heading-two',
          children: [
            {
              text: 'Title 2'
            }
          ]
        },
        {
          type: 'heading-three',
          children: [
            {
              text: 'Title 3'
            }
          ]
        },
        {
          type: 'unordered-list',
          children: [
            {
              type: 'list-item',
              children: [
                {
                  text: 'Unordered List'
                }
              ]
            }
          ]
        },
        {
          type: 'ordered-list',
          children: [
            {
              type: 'list-item',
              children: [
                {
                  text: 'Ordered List'
                }
              ]
            }
          ]
        },
        {
          type: 'paragraph',
          children: [
            {
              text: ''
            }
          ]
        },
        {
          type: 'table',
          children: [
            {
              type: 'table-row',
              children: [
                {
                  type: 'table-cell',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          text: 'Table Cell 1'
                        }
                      ]
                    }
                  ],
                  borderColor: '#000000'
                },
                {
                  type: 'table-cell',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          text: 'Table Cell 2'
                        }
                      ]
                    }
                  ],
                  borderColor: '#000000'
                }
              ]
            },
            {
              type: 'table-row',
              children: [
                {
                  type: 'table-cell',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          text: 'Table Cell 3'
                        }
                      ]
                    }
                  ],
                  borderColor: '#000000'
                },
                {
                  type: 'table-cell',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          text: 'Table Cell 4'
                        }
                      ]
                    }
                  ],
                  borderColor: '#000000'
                }
              ]
            }
          ]
        },
        {
          type: 'paragraph',
          children: [
            {
              text: 'Normal text,'
            },
            {
              bold: true,
              text: ' Bold'
            },
            {
              text: ', '
            },
            {
              text: 'Italic',
              italic: true
            },
            {
              text: ', '
            },
            {
              text: 'Underline',
              underline: true
            },
            {
              text: ', '
            },
            {
              text: 'Strikethrough',
              strikethrough: true
            },
            {
              text: ', '
            },
            {
              text: 'Sup',
              superscript: true
            },
            {
              text: ', '
            },
            {
              text: 'Sub',
              subscript: true
            },
            {
              text: ', '
            },
            {
              url: 'https://google.com',
              type: 'link',
              title: 'Link',
              children: [
                {
                  text: 'Link'
                }
              ]
            },
            {
              text: ', 😀'
            }
          ]
        }
      ]
    },
    {
      __typename: 'ImageBlock',
      caption: 'Caption',
      image
    },
    {
      __typename: 'ImageGalleryBlock',
      images: [
        {
          caption: 'Caption',
          image
        },
        {
          caption: 'Caption',
          image
        },
        {
          caption: 'Caption',
          image
        }
      ]
    },
    {
      __typename: 'ListicleBlock',
      items: [
        {
          title: 'Foobar',
          richText: [
            {
              type: 'paragraph',
              children: [
                {
                  text: 'Lorem Ipsum'
                }
              ]
            }
          ],
          image
        },
        {
          title: 'Foobar',
          richText: [
            {
              type: 'paragraph',
              children: [
                {
                  text: 'Lorem Ipsum'
                }
              ]
            }
          ],
          image
        },
        {
          title: 'Foobar',
          richText: [
            {
              type: 'paragraph',
              children: [
                {
                  text: 'Lorem Ipsum'
                }
              ]
            }
          ],
          image
        }
      ]
    },
    {
      __typename: 'QuoteBlock',
      quote: 'Quote',
      author: 'By an Author'
    },
    {
      __typename: 'LinkPageBreakBlock',
      text: 'Break block test',
      linkText: null,
      linkURL: null,
      styleOption: 'default',
      richText: [
        {
          type: 'paragraph',
          children: [
            {
              text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'
            }
          ]
        },
        {
          type: 'paragraph',
          children: [
            {
              text: ''
            }
          ]
        },
        {
          type: 'heading-three',
          children: [
            {
              text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'
            }
          ]
        },
        {
          type: 'heading-three',
          children: [
            {
              text: ''
            }
          ]
        },
        {
          type: 'paragraph',
          children: [
            {
              bold: true,
              text: ' Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
              italic: true
            },
            {
              text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
              italic: true
            },
            {
              text: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
              italic: true,
              underline: true
            }
          ]
        }
      ],
      linkTarget: null,
      hideButton: false,
      templateOption: 'none',
      layoutOption: 'image-left',
      image
    },
    {
      __typename: 'EmbedBlock',
      url: 'https://www.example.com',
      title: 'Title',
      width: 560,
      height: 314,
      styleCustom: '',
      sandbox: ''
    },
    {
      __typename: 'BildwurfAdBlock',
      zoneID: '77348'
    },
    {
      __typename: 'FacebookPostBlock',
      userID: 'ladolcekita',
      postID: 'pfbid02JcJeoMg7KasRL8dNjgRJJDFiU8YzeBzEeGeXtqpsE2bnTmeH2y6LRsu7RnmhkPxel'
    },
    {
      __typename: 'FacebookVideoBlock',
      userID: '100064959061177',
      videoID: '1310370486335266'
    },
    {
      __typename: 'InstagramPostBlock',
      postID: 'CvACOxxIqT2'
    },
    {
      __typename: 'PolisConversationBlock',
      conversationID: '744469711'
    },
    {
      __typename: 'SoundCloudTrackBlock',
      trackID: '744469711'
    },
    {
      __typename: 'TikTokVideoBlock',
      userID: 'scout2015',
      videoID: '6718335390845095173'
    },
    {
      __typename: 'TwitterTweetBlock',
      userID: 'WePublish_media',
      tweetID: '1600079498845863937'
    },
    {
      __typename: 'VimeoVideoBlock',
      videoID: '104626862'
    },
    {
      __typename: 'YouTubeVideoBlock',
      videoID: 'CCOdQsZa15o'
    },
    {
      __typename: 'TeaserGridBlock',
      numColumns: 1,
      teasers: [
        {
          __typename: 'ArticleTeaser',
          style: 'DEFAULT',
          image: {
            id: 'ljh9FHAvHAs0AxC',
            filename: 'DSC07717',
            extension: '.JPG',
            title: null,
            description: null,
            width: 4000,
            height: 6000,
            url: 'https://unsplash.it/500/281',
            xl: 'https://unsplash.it/1200/400',
            l: 'https://unsplash.it/1000/400',
            m: 'https://unsplash.it/800/400',
            s: 'https://unsplash.it/500/300',
            xs: 'https://unsplash.it/300/200',
            xxs: 'https://unsplash.it/200/100',
            xlSquare: 'https://unsplash.it/1200/1200',
            lSquare: 'https://unsplash.it/1000/1000',
            mSquare: 'https://unsplash.it/800/800',
            sSquare: 'https://unsplash.it/500/500',
            xsSquare: 'https://unsplash.it/300/300',
            xxsSquare: 'https://unsplash.it/200/200'
          },
          preTitle: 'Pre Title',
          title: 'Title',
          lead: 'Lead',
          article: {
            id: 'clg2cxnig57497901rej8i9ubj1',
            title: 'Chur solidarisiert sich mit der Ukraine',
            preTitle: null,
            lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
            url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
            blocks: [
              {
                __typename: 'TitleBlock',
                title: 'Chur solidarisiert sich mit der Ukraine',
                lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: 'Ca9dRSDJknEtNM6',
                  createdAt: '2023-03-16T10:52:48.814Z',
                  modifiedAt: '2023-03-16T10:52:48.857Z',
                  filename: '220226115806_lom',
                  extension: '.jpg',
                  width: 4000,
                  height: 2667,
                  fileSize: 2150341,
                  description:
                    'Friedensdemonstration gegen die Invasion und den Krieg von Russland in der Ukraine, fotografiert am 26.02.2022 in Bern. (KEYSTONE / Manuel Lopez)',
                  tags: [],
                  source: 'KEYSTONE / Manuel Lopez',
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: 'SCHWEIZ UKRAINE RUSSLAND KRIEG PROTEST',
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200'
                }
              },
              {
                __typename: 'RichTextBlock'
              }
            ],
            authors: [author],
            publishedAt: new Date('2023-01-01').toISOString()
          }
        },
        {
          __typename: 'ArticleTeaser',
          style: 'DEFAULT',
          image: null,
          preTitle: null,
          title: null,
          lead: null,
          article: {
            id: 'clg2cxnig57497901rej8i9ubj1',
            title: 'Chur solidarisiert sich mit der Ukraine',
            preTitle: null,
            lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
            url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
            blocks: [
              {
                __typename: 'TitleBlock',
                title: 'Chur solidarisiert sich mit der Ukraine',
                lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: 'Ca9dRSDJknEtNM6',
                  createdAt: '2023-03-16T10:52:48.814Z',
                  modifiedAt: '2023-03-16T10:52:48.857Z',
                  filename: '220226115806_lom',
                  extension: '.jpg',
                  width: 4000,
                  height: 2667,
                  fileSize: 2150341,
                  description:
                    'Friedensdemonstration gegen die Invasion und den Krieg von Russland in der Ukraine, fotografiert am 26.02.2022 in Bern. (KEYSTONE / Manuel Lopez)',
                  tags: [],
                  source: 'KEYSTONE / Manuel Lopez',
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: 'SCHWEIZ UKRAINE RUSSLAND KRIEG PROTEST',
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200'
                }
              },
              {
                __typename: 'RichTextBlock'
              }
            ],
            authors: [author],
            publishedAt: new Date('2023-01-01').toISOString()
          }
        },
        {
          __typename: 'PageTeaser',
          style: 'DEFAULT',
          image: {
            id: 'ljh9FHAvHAs0AxC',
            filename: 'DSC07717',
            extension: '.JPG',
            title: null,
            description: null,
            width: 4000,
            height: 6000,
            url: 'https://unsplash.it/500/281',
            xl: 'https://unsplash.it/1200/400',
            l: 'https://unsplash.it/1000/400',
            m: 'https://unsplash.it/800/400',
            s: 'https://unsplash.it/500/300',
            xs: 'https://unsplash.it/300/200',
            xxs: 'https://unsplash.it/200/100',
            xlSquare: 'https://unsplash.it/1200/1200',
            lSquare: 'https://unsplash.it/1000/1000',
            mSquare: 'https://unsplash.it/800/800',
            sSquare: 'https://unsplash.it/500/500',
            xsSquare: 'https://unsplash.it/300/300',
            xxsSquare: 'https://unsplash.it/200/200'
          },
          preTitle: 'Pre Title',
          title: 'Title',
          lead: 'Lead',
          page: {
            id: 'cl95fumlq261901phgrctx4mz',
            title: 'Home',
            description: '',
            url: 'https://demo.wepublish.media/page/cl95fumlq261901phgrctx4mz/',
            blocks: [
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'EventBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: '8TgBNHynpsJcBO3',
                  mimeType: 'image/jpg',
                  format: 'jpg',
                  createdAt: '2023-04-18T12:38:56.369Z',
                  modifiedAt: '2023-04-18T12:38:56.371Z',
                  filename: 'DSC07717',
                  extension: '.JPG',
                  width: 4000,
                  height: 6000,
                  fileSize: 8667448,
                  description: null,
                  tags: [],
                  source: null,
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: null,
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200',
                  __typename: 'Image'
                }
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: '8TgBNHynpsJcBO3',
                  mimeType: 'image/jpg',
                  format: 'jpg',
                  createdAt: '2023-04-18T12:38:56.369Z',
                  modifiedAt: '2023-04-18T12:38:56.371Z',
                  filename: 'DSC07717',
                  extension: '.JPG',
                  width: 4000,
                  height: 6000,
                  fileSize: 8667448,
                  description: null,
                  tags: [],
                  source: null,
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: null,
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200',
                  __typename: 'Image'
                }
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: '8TgBNHynpsJcBO3',
                  mimeType: 'image/jpg',
                  format: 'jpg',
                  createdAt: '2023-04-18T12:38:56.369Z',
                  modifiedAt: '2023-04-18T12:38:56.371Z',
                  filename: 'DSC07717',
                  extension: '.JPG',
                  width: 4000,
                  height: 6000,
                  fileSize: 8667448,
                  description: null,
                  tags: [],
                  source: null,
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: null,
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200',
                  __typename: 'Image'
                }
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: 'EjkHi6FuKY4LVKp',
                  createdAt: '2022-11-09T15:35:02.433Z',
                  modifiedAt: '2022-11-09T15:35:02.434Z',
                  filename: 's',
                  extension: '.jpg',
                  width: 900,
                  height: 717,
                  fileSize: 364910,
                  description: null,
                  tags: [],
                  source:
                    'Public domain mark / Baugeschichtliches Archiv, falls bekannt bitte FotografIn angeben',
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: 'Limmathaus',
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200'
                }
              },
              {
                __typename: 'RichTextBlock'
              },
              {
                __typename: 'LinkPageBreakBlock'
              },
              {
                __typename: 'TitleBlock',
                title: 'Das ist ein Titel',
                lead: null
              },
              {
                __typename: 'ImageBlock',
                caption: 'Das ist eine Bildunterschrift',
                image: {
                  id: 'EjkHi6FuKY4LVKp',
                  createdAt: '2022-11-09T15:35:02.433Z',
                  modifiedAt: '2022-11-09T15:35:02.434Z',
                  filename: 's',
                  extension: '.jpg',
                  width: 900,
                  height: 717,
                  fileSize: 364910,
                  description: null,
                  tags: [],
                  source:
                    'Public domain mark / Baugeschichtliches Archiv, falls bekannt bitte FotografIn angeben',
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: 'Limmathaus',
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200'
                }
              },
              {
                __typename: 'RichTextBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              }
            ]
          }
        },
        {
          __typename: 'PageTeaser',
          style: 'DEFAULT',
          image: null,
          preTitle: null,
          title: null,
          lead: null,
          page: {
            id: 'cl95fumlq261901phgrctx4mz',
            title: 'Home',
            description: '',
            url: 'https://demo.wepublish.media/page/cl95fumlq261901phgrctx4mz/',
            blocks: [
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'EventBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: '8TgBNHynpsJcBO3',
                  mimeType: 'image/jpg',
                  format: 'jpg',
                  createdAt: '2023-04-18T12:38:56.369Z',
                  modifiedAt: '2023-04-18T12:38:56.371Z',
                  filename: 'DSC07717',
                  extension: '.JPG',
                  width: 4000,
                  height: 6000,
                  fileSize: 8667448,
                  description: null,
                  tags: [],
                  source: null,
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: null,
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200',
                  __typename: 'Image'
                }
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: '8TgBNHynpsJcBO3',
                  mimeType: 'image/jpg',
                  format: 'jpg',
                  createdAt: '2023-04-18T12:38:56.369Z',
                  modifiedAt: '2023-04-18T12:38:56.371Z',
                  filename: 'DSC07717',
                  extension: '.JPG',
                  width: 4000,
                  height: 6000,
                  fileSize: 8667448,
                  description: null,
                  tags: [],
                  source: null,
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: null,
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200',
                  __typename: 'Image'
                }
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: '8TgBNHynpsJcBO3',
                  mimeType: 'image/jpg',
                  format: 'jpg',
                  createdAt: '2023-04-18T12:38:56.369Z',
                  modifiedAt: '2023-04-18T12:38:56.371Z',
                  filename: 'DSC07717',
                  extension: '.JPG',
                  width: 4000,
                  height: 6000,
                  fileSize: 8667448,
                  description: null,
                  tags: [],
                  source: null,
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: null,
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200',
                  __typename: 'Image'
                }
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: 'EjkHi6FuKY4LVKp',
                  createdAt: '2022-11-09T15:35:02.433Z',
                  modifiedAt: '2022-11-09T15:35:02.434Z',
                  filename: 's',
                  extension: '.jpg',
                  width: 900,
                  height: 717,
                  fileSize: 364910,
                  description: null,
                  tags: [],
                  source:
                    'Public domain mark / Baugeschichtliches Archiv, falls bekannt bitte FotografIn angeben',
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: 'Limmathaus',
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200'
                }
              },
              {
                __typename: 'RichTextBlock'
              },
              {
                __typename: 'LinkPageBreakBlock'
              },
              {
                __typename: 'TitleBlock',
                title: 'Das ist ein Titel',
                lead: null
              },
              {
                __typename: 'ImageBlock',
                caption: 'Das ist eine Bildunterschrift',
                image: {
                  id: 'EjkHi6FuKY4LVKp',
                  createdAt: '2022-11-09T15:35:02.433Z',
                  modifiedAt: '2022-11-09T15:35:02.434Z',
                  filename: 's',
                  extension: '.jpg',
                  width: 900,
                  height: 717,
                  fileSize: 364910,
                  description: null,
                  tags: [],
                  source:
                    'Public domain mark / Baugeschichtliches Archiv, falls bekannt bitte FotografIn angeben',
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: 'Limmathaus',
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200'
                }
              },
              {
                __typename: 'RichTextBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              }
            ]
          }
        },
        {
          __typename: 'CustomTeaser',
          style: 'DEFAULT',
          image: {
            id: 'ljh9FHAvHAs0AxC',
            filename: 'DSC07717',
            extension: '.JPG',
            title: null,
            description: null,
            width: 4000,
            height: 6000,
            url: 'https://unsplash.it/500/281',
            xl: 'https://unsplash.it/1200/400',
            l: 'https://unsplash.it/1000/400',
            m: 'https://unsplash.it/800/400',
            s: 'https://unsplash.it/500/300',
            xs: 'https://unsplash.it/300/200',
            xxs: 'https://unsplash.it/200/100',
            xlSquare: 'https://unsplash.it/1200/1200',
            lSquare: 'https://unsplash.it/1000/1000',
            mSquare: 'https://unsplash.it/800/800',
            sSquare: 'https://unsplash.it/500/500',
            xsSquare: 'https://unsplash.it/300/300',
            xxsSquare: 'https://unsplash.it/200/200'
          },
          preTitle: 'Pre Title',
          title: 'Title',
          lead: 'Lead',
          contentUrl: 'https://google.com',
          properties: []
        }
      ]
    },
    {
      __typename: 'TeaserGridBlock',
      numColumns: 3,
      teasers: [
        {
          __typename: 'ArticleTeaser',
          style: 'DEFAULT',
          image: {
            id: 'ljh9FHAvHAs0AxC',
            filename: 'DSC07717',
            extension: '.JPG',
            title: null,
            description: null,
            width: 4000,
            height: 6000,
            url: 'https://unsplash.it/500/281',
            xl: 'https://unsplash.it/1200/400',
            l: 'https://unsplash.it/1000/400',
            m: 'https://unsplash.it/800/400',
            s: 'https://unsplash.it/500/300',
            xs: 'https://unsplash.it/300/200',
            xxs: 'https://unsplash.it/200/100',
            xlSquare: 'https://unsplash.it/1200/1200',
            lSquare: 'https://unsplash.it/1000/1000',
            mSquare: 'https://unsplash.it/800/800',
            sSquare: 'https://unsplash.it/500/500',
            xsSquare: 'https://unsplash.it/300/300',
            xxsSquare: 'https://unsplash.it/200/200'
          },
          preTitle: 'Pre Title',
          title: 'Title',
          lead: 'Lead',
          article: {
            id: 'clg2cxnig57497901rej8i9ubj1',
            title: 'Chur solidarisiert sich mit der Ukraine',
            preTitle: null,
            lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
            url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
            blocks: [
              {
                __typename: 'TitleBlock',
                title: 'Chur solidarisiert sich mit der Ukraine',
                lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: 'Ca9dRSDJknEtNM6',
                  createdAt: '2023-03-16T10:52:48.814Z',
                  modifiedAt: '2023-03-16T10:52:48.857Z',
                  filename: '220226115806_lom',
                  extension: '.jpg',
                  width: 4000,
                  height: 2667,
                  fileSize: 2150341,
                  description:
                    'Friedensdemonstration gegen die Invasion und den Krieg von Russland in der Ukraine, fotografiert am 26.02.2022 in Bern. (KEYSTONE / Manuel Lopez)',
                  tags: [],
                  source: 'KEYSTONE / Manuel Lopez',
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: 'SCHWEIZ UKRAINE RUSSLAND KRIEG PROTEST',
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200'
                }
              },
              {
                __typename: 'RichTextBlock'
              }
            ],
            authors: [author],
            publishedAt: new Date('2023-01-01').toISOString()
          }
        },
        {
          __typename: 'ArticleTeaser',
          style: 'DEFAULT',
          image: null,
          preTitle: null,
          title: null,
          lead: null,
          article: {
            id: 'clg2cxnig57497901rej8i9ubj1',
            title: 'Chur solidarisiert sich mit der Ukraine',
            preTitle: null,
            lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
            url: 'https://demo.wepublish.media/a/clg2cxnig57497901rej8i9ubj1/chur-solidarisiert-sich-mit-der-ukraine',
            blocks: [
              {
                __typename: 'TitleBlock',
                title: 'Chur solidarisiert sich mit der Ukraine',
                lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: 'Ca9dRSDJknEtNM6',
                  createdAt: '2023-03-16T10:52:48.814Z',
                  modifiedAt: '2023-03-16T10:52:48.857Z',
                  filename: '220226115806_lom',
                  extension: '.jpg',
                  width: 4000,
                  height: 2667,
                  fileSize: 2150341,
                  description:
                    'Friedensdemonstration gegen die Invasion und den Krieg von Russland in der Ukraine, fotografiert am 26.02.2022 in Bern. (KEYSTONE / Manuel Lopez)',
                  tags: [],
                  source: 'KEYSTONE / Manuel Lopez',
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: 'SCHWEIZ UKRAINE RUSSLAND KRIEG PROTEST',
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200'
                }
              },
              {
                __typename: 'RichTextBlock'
              }
            ],
            authors: [author],
            publishedAt: new Date('2023-01-01').toISOString()
          }
        },
        {
          __typename: 'PageTeaser',
          style: 'DEFAULT',
          image: {
            id: 'ljh9FHAvHAs0AxC',
            filename: 'DSC07717',
            extension: '.JPG',
            title: null,
            description: null,
            width: 4000,
            height: 6000,
            url: 'https://unsplash.it/500/281',
            xl: 'https://unsplash.it/1200/400',
            l: 'https://unsplash.it/1000/400',
            m: 'https://unsplash.it/800/400',
            s: 'https://unsplash.it/500/300',
            xs: 'https://unsplash.it/300/200',
            xxs: 'https://unsplash.it/200/100',
            xlSquare: 'https://unsplash.it/1200/1200',
            lSquare: 'https://unsplash.it/1000/1000',
            mSquare: 'https://unsplash.it/800/800',
            sSquare: 'https://unsplash.it/500/500',
            xsSquare: 'https://unsplash.it/300/300',
            xxsSquare: 'https://unsplash.it/200/200'
          },
          preTitle: 'Pre Title',
          title: 'Title',
          lead: 'Lead',
          page: {
            id: 'cl95fumlq261901phgrctx4mz',
            title: 'Home',
            description: '',
            url: 'https://demo.wepublish.media/page/cl95fumlq261901phgrctx4mz/',
            blocks: [
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'EventBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: '8TgBNHynpsJcBO3',
                  mimeType: 'image/jpg',
                  format: 'jpg',
                  createdAt: '2023-04-18T12:38:56.369Z',
                  modifiedAt: '2023-04-18T12:38:56.371Z',
                  filename: 'DSC07717',
                  extension: '.JPG',
                  width: 4000,
                  height: 6000,
                  fileSize: 8667448,
                  description: null,
                  tags: [],
                  source: null,
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: null,
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200',
                  __typename: 'Image'
                }
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: '8TgBNHynpsJcBO3',
                  mimeType: 'image/jpg',
                  format: 'jpg',
                  createdAt: '2023-04-18T12:38:56.369Z',
                  modifiedAt: '2023-04-18T12:38:56.371Z',
                  filename: 'DSC07717',
                  extension: '.JPG',
                  width: 4000,
                  height: 6000,
                  fileSize: 8667448,
                  description: null,
                  tags: [],
                  source: null,
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: null,
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200',
                  __typename: 'Image'
                }
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: '8TgBNHynpsJcBO3',
                  mimeType: 'image/jpg',
                  format: 'jpg',
                  createdAt: '2023-04-18T12:38:56.369Z',
                  modifiedAt: '2023-04-18T12:38:56.371Z',
                  filename: 'DSC07717',
                  extension: '.JPG',
                  width: 4000,
                  height: 6000,
                  fileSize: 8667448,
                  description: null,
                  tags: [],
                  source: null,
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: null,
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200',
                  __typename: 'Image'
                }
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: 'EjkHi6FuKY4LVKp',
                  createdAt: '2022-11-09T15:35:02.433Z',
                  modifiedAt: '2022-11-09T15:35:02.434Z',
                  filename: 's',
                  extension: '.jpg',
                  width: 900,
                  height: 717,
                  fileSize: 364910,
                  description: null,
                  tags: [],
                  source:
                    'Public domain mark / Baugeschichtliches Archiv, falls bekannt bitte FotografIn angeben',
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: 'Limmathaus',
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200'
                }
              },
              {
                __typename: 'RichTextBlock'
              },
              {
                __typename: 'LinkPageBreakBlock'
              },
              {
                __typename: 'TitleBlock',
                title: 'Das ist ein Titel',
                lead: null
              },
              {
                __typename: 'ImageBlock',
                caption: 'Das ist eine Bildunterschrift',
                image: {
                  id: 'EjkHi6FuKY4LVKp',
                  createdAt: '2022-11-09T15:35:02.433Z',
                  modifiedAt: '2022-11-09T15:35:02.434Z',
                  filename: 's',
                  extension: '.jpg',
                  width: 900,
                  height: 717,
                  fileSize: 364910,
                  description: null,
                  tags: [],
                  source:
                    'Public domain mark / Baugeschichtliches Archiv, falls bekannt bitte FotografIn angeben',
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: 'Limmathaus',
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200'
                }
              },
              {
                __typename: 'RichTextBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              }
            ]
          }
        },
        {
          __typename: 'PageTeaser',
          style: 'DEFAULT',
          image: null,
          preTitle: null,
          title: null,
          lead: null,
          page: {
            id: 'cl95fumlq261901phgrctx4mz',
            title: 'Home',
            description: '',
            url: 'https://demo.wepublish.media/page/cl95fumlq261901phgrctx4mz/',
            blocks: [
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'EventBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: '8TgBNHynpsJcBO3',
                  mimeType: 'image/jpg',
                  format: 'jpg',
                  createdAt: '2023-04-18T12:38:56.369Z',
                  modifiedAt: '2023-04-18T12:38:56.371Z',
                  filename: 'DSC07717',
                  extension: '.JPG',
                  width: 4000,
                  height: 6000,
                  fileSize: 8667448,
                  description: null,
                  tags: [],
                  source: null,
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: null,
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200',
                  __typename: 'Image'
                }
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: '8TgBNHynpsJcBO3',
                  mimeType: 'image/jpg',
                  format: 'jpg',
                  createdAt: '2023-04-18T12:38:56.369Z',
                  modifiedAt: '2023-04-18T12:38:56.371Z',
                  filename: 'DSC07717',
                  extension: '.JPG',
                  width: 4000,
                  height: 6000,
                  fileSize: 8667448,
                  description: null,
                  tags: [],
                  source: null,
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: null,
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200',
                  __typename: 'Image'
                }
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: '8TgBNHynpsJcBO3',
                  mimeType: 'image/jpg',
                  format: 'jpg',
                  createdAt: '2023-04-18T12:38:56.369Z',
                  modifiedAt: '2023-04-18T12:38:56.371Z',
                  filename: 'DSC07717',
                  extension: '.JPG',
                  width: 4000,
                  height: 6000,
                  fileSize: 8667448,
                  description: null,
                  tags: [],
                  source: null,
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: null,
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200',
                  __typename: 'Image'
                }
              },
              {
                __typename: 'TeaserGridBlock'
              },
              {
                __typename: 'ImageBlock',
                caption: null,
                image: {
                  id: 'EjkHi6FuKY4LVKp',
                  createdAt: '2022-11-09T15:35:02.433Z',
                  modifiedAt: '2022-11-09T15:35:02.434Z',
                  filename: 's',
                  extension: '.jpg',
                  width: 900,
                  height: 717,
                  fileSize: 364910,
                  description: null,
                  tags: [],
                  source:
                    'Public domain mark / Baugeschichtliches Archiv, falls bekannt bitte FotografIn angeben',
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: 'Limmathaus',
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200'
                }
              },
              {
                __typename: 'RichTextBlock'
              },
              {
                __typename: 'LinkPageBreakBlock'
              },
              {
                __typename: 'TitleBlock',
                title: 'Das ist ein Titel',
                lead: null
              },
              {
                __typename: 'ImageBlock',
                caption: 'Das ist eine Bildunterschrift',
                image: {
                  id: 'EjkHi6FuKY4LVKp',
                  createdAt: '2022-11-09T15:35:02.433Z',
                  modifiedAt: '2022-11-09T15:35:02.434Z',
                  filename: 's',
                  extension: '.jpg',
                  width: 900,
                  height: 717,
                  fileSize: 364910,
                  description: null,
                  tags: [],
                  source:
                    'Public domain mark / Baugeschichtliches Archiv, falls bekannt bitte FotografIn angeben',
                  link: null,
                  license: null,
                  focalPoint: {
                    x: 0.5,
                    y: 0.5
                  },
                  title: 'Limmathaus',
                  url: 'https://unsplash.it/500/281',
                  xl: 'https://unsplash.it/1200/400',
                  l: 'https://unsplash.it/1000/400',
                  m: 'https://unsplash.it/800/400',
                  s: 'https://unsplash.it/500/300',
                  xs: 'https://unsplash.it/300/200',
                  xxs: 'https://unsplash.it/200/100',
                  xlSquare: 'https://unsplash.it/1200/1200',
                  lSquare: 'https://unsplash.it/1000/1000',
                  mSquare: 'https://unsplash.it/800/800',
                  sSquare: 'https://unsplash.it/500/500',
                  xsSquare: 'https://unsplash.it/300/300',
                  xxsSquare: 'https://unsplash.it/200/200'
                }
              },
              {
                __typename: 'RichTextBlock'
              },
              {
                __typename: 'TeaserGridBlock'
              }
            ]
          }
        },
        {
          __typename: 'CustomTeaser',
          style: 'DEFAULT',
          image: {
            id: 'ljh9FHAvHAs0AxC',
            filename: 'DSC07717',
            extension: '.JPG',
            title: null,
            description: null,
            width: 4000,
            height: 6000,
            url: 'https://unsplash.it/500/281',
            xl: 'https://unsplash.it/1200/400',
            l: 'https://unsplash.it/1000/400',
            m: 'https://unsplash.it/800/400',
            s: 'https://unsplash.it/500/300',
            xs: 'https://unsplash.it/300/200',
            xxs: 'https://unsplash.it/200/100',
            xlSquare: 'https://unsplash.it/1200/1200',
            lSquare: 'https://unsplash.it/1000/1000',
            mSquare: 'https://unsplash.it/800/800',
            sSquare: 'https://unsplash.it/500/500',
            xsSquare: 'https://unsplash.it/300/300',
            xxsSquare: 'https://unsplash.it/200/200'
          },
          preTitle: 'Pre Title',
          title: 'Title',
          lead: 'Lead',
          contentUrl: 'https://google.com',
          properties: []
        }
      ]
    },
    {
      __typename: 'TeaserGridFlexBlock',
      flexTeasers: [
        {
          __typename: 'FlexTeaser',
          alignment: {
            __typename: 'FlexAlignment',
            x: 0,
            y: 0,
            w: 3,
            h: 6
          },
          teaser: {
            __typename: 'ArticleTeaser',
            style: 'DEFAULT',
            image,
            preTitle: 'Pre Title',
            title: 'Title',
            lead: 'Lead',
            article: {
              __typename: 'Article',
              id: 'clg2cxnig57497901rej8i9ubj1',
              title: 'Chur solidarisiert sich mit der Ukraine',
              preTitle: null,
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
              url: 'https://example.com',
              slug: 'slug',
              authors: [author, {...author, id: '1234'}],
              tags: ['foo', 'bar'],
              breaking: false,
              publishedAt: new Date('2023-01-01').toISOString(),
              image,
              socialMediaImage: image,
              socialMediaTitle: 'socialMediaTitle',
              socialMediaDescription: 'socialMediaDescription',
              blocks: [
                {
                  __typename: 'TitleBlock',
                  title: 'Chur solidarisiert sich mit der Ukraine',
                  lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
                },
                {
                  __typename: 'ImageBlock',
                  caption: null,
                  image
                },
                {
                  __typename: 'RichTextBlock'
                }
              ]
            }
          }
        },
        {
          __typename: 'FlexTeaser',
          alignment: {
            __typename: 'FlexAlignment',
            x: 3,
            y: 0,
            w: 5,
            h: 3
          },
          teaser: {
            __typename: 'ArticleTeaser',
            style: 'DEFAULT',
            image: null,
            preTitle: null,
            title: null,
            lead: null,
            article: {
              __typename: 'Article',
              id: 'clg2cxnig57497901rej8i9ubj1',
              title: 'Chur solidarisiert sich mit der Ukraine',
              slug: 'slug',
              authors: [author, {...author, id: '1234'}],
              tags: ['foo', 'bar'],
              breaking: false,
              publishedAt: new Date('2023-01-01').toISOString(),
              image,
              socialMediaImage: image,
              socialMediaTitle: 'socialMediaTitle',
              socialMediaDescription: 'socialMediaDescription',
              lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. ',
              url: 'https://example.com',
              blocks: [
                {
                  __typename: 'TitleBlock',
                  title: 'Chur solidarisiert sich mit der Ukraine',
                  lead: 'Auch ein Jahr nach Kriegsausbruch sind die Sympathien klar. 1000 Churer*innen standen am Samstag Mahnwache in Chur. '
                },
                {
                  __typename: 'ImageBlock',
                  caption: null,
                  image
                },
                {
                  __typename: 'RichTextBlock'
                }
              ]
            }
          }
        },
        {
          __typename: 'FlexTeaser',
          alignment: {
            __typename: 'FlexAlignment',
            x: 3,
            y: 3,
            w: 5,
            h: 3
          },
          teaser: {
            __typename: 'PageTeaser',
            style: 'DEFAULT',
            image,
            preTitle: 'Pre Title',
            title: 'Title',
            lead: 'Lead',
            page: {
              __typename: 'Page',
              id: 'cl95fumlq261901phgrctx4mz',
              slug: 'slug',
              url: 'https://example.com',
              title: 'title',
              description: '',
              image,
              tags: ['foo', 'bar'],
              socialMediaImage: image,
              socialMediaDescription: 'socialMediaDescription',
              socialMediaTitle: 'socialMediaTitle',
              blocks: [
                {
                  __typename: 'TeaserGridBlock'
                },
                {
                  __typename: 'TeaserGridBlock'
                },
                {
                  __typename: 'EventBlock'
                },
                {
                  __typename: 'TeaserGridBlock'
                },
                {
                  __typename: 'ImageBlock',
                  caption: null,
                  image
                },
                {
                  __typename: 'TeaserGridBlock'
                },
                {
                  __typename: 'TeaserGridBlock'
                },
                {
                  __typename: 'TeaserGridBlock'
                },
                {
                  __typename: 'ImageBlock',
                  caption: null,
                  image
                },
                {
                  __typename: 'TeaserGridBlock'
                },
                {
                  __typename: 'TeaserGridBlock'
                },
                {
                  __typename: 'ImageBlock',
                  caption: null,
                  image
                },
                {
                  __typename: 'TeaserGridBlock'
                },
                {
                  __typename: 'ImageBlock',
                  caption: null,
                  image
                },
                {
                  __typename: 'RichTextBlock'
                },
                {
                  __typename: 'LinkPageBreakBlock'
                },
                {
                  __typename: 'TitleBlock',
                  title: 'Das ist ein Titel',
                  lead: null
                },
                {
                  __typename: 'ImageBlock',
                  caption: 'Das ist eine Bildunterschrift',
                  image
                },
                {
                  __typename: 'RichTextBlock'
                },
                {
                  __typename: 'TeaserGridBlock'
                }
              ]
            }
          }
        },
        {
          __typename: 'FlexTeaser',
          alignment: {
            __typename: 'FlexAlignment',
            x: 8,
            y: 0,
            w: 4,
            h: 6
          },
          teaser: {
            __typename: 'PageTeaser',
            style: 'DEFAULT',
            image: null,
            preTitle: null,
            title: null,
            lead: null,
            page: {
              __typename: 'Page',
              id: 'cl95fumlq261901phgrctx4mz',
              slug: 'slug',
              url: 'https://example.com',
              title: 'title',
              description: '',
              image,
              tags: ['foo', 'bar'],
              socialMediaImage: image,
              socialMediaDescription: 'socialMediaDescription',
              socialMediaTitle: 'socialMediaTitle',
              blocks: [
                {
                  __typename: 'TeaserGridBlock'
                },
                {
                  __typename: 'TeaserGridBlock'
                },
                {
                  __typename: 'EventBlock'
                },
                {
                  __typename: 'TeaserGridBlock'
                },
                {
                  __typename: 'ImageBlock',
                  caption: null,
                  image
                },
                {
                  __typename: 'TeaserGridBlock'
                },
                {
                  __typename: 'TeaserGridBlock'
                },
                {
                  __typename: 'TeaserGridBlock'
                },
                {
                  __typename: 'ImageBlock',
                  caption: null,
                  image
                },
                {
                  __typename: 'TeaserGridBlock'
                },
                {
                  __typename: 'TeaserGridBlock'
                },
                {
                  __typename: 'ImageBlock',
                  caption: null,
                  image
                },
                {
                  __typename: 'TeaserGridBlock'
                },
                {
                  __typename: 'ImageBlock',
                  caption: null,
                  image
                },
                {
                  __typename: 'RichTextBlock'
                },
                {
                  __typename: 'LinkPageBreakBlock'
                },
                {
                  __typename: 'TitleBlock',
                  title: 'Das ist ein Titel',
                  lead: null
                },
                {
                  __typename: 'ImageBlock',
                  caption: 'Das ist eine Bildunterschrift',
                  image
                },
                {
                  __typename: 'RichTextBlock'
                },
                {
                  __typename: 'TeaserGridBlock'
                }
              ]
            }
          }
        },
        {
          __typename: 'FlexTeaser',
          alignment: {
            __typename: 'FlexAlignment',
            x: 0,
            y: 6,
            w: 12,
            h: 2
          },
          teaser: {
            __typename: 'CustomTeaser',
            style: 'DEFAULT',
            image,
            preTitle: 'Pre Title',
            title: 'Title',
            lead: 'Lead',
            contentUrl: 'https://google.com',
            properties: []
          }
        }
      ]
    },
    {
      __typename: 'HTMLBlock',
      html: '<div>Some HTML embed</div>\n<script>console.log("Some HTML embed")</script>'
    },
    {
      __typename: 'PollBlock'
    },
    {
      __typename: 'CommentBlock'
    },
    {
      __typename: 'EventBlock',
      events: [event]
    }
  ]
} as NonNullable<PageQuery['page']>

export default {
  component: PageContainer,
  title: 'Container/Page'
} as Meta

export const ById = {
  args: {
    id: page.id
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: PageDocument,
            variables: {
              id: page.id
            }
          },
          result: {
            data: {
              page
            }
          }
        }
      ]
    }
  }
}

export const BySlug = {
  args: {
    slug: page.slug
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: PageDocument,
            variables: {
              slug: page.slug
            }
          },
          result: {
            data: {
              page
            }
          }
        }
      ]
    }
  }
}

export const ByToken = {
  args: {
    token: 'foobar'
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: PageDocument,
            variables: {
              token: 'foobar'
            }
          },
          result: {
            data: {
              page
            }
          }
        }
      ]
    }
  }
}

export const WithChildren = {
  args: {
    id: page.id,
    children: <div>Children</div>
  },
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: PageDocument,
            variables: {
              id: page.id
            }
          },
          result: {
            data: {
              page
            }
          }
        }
      ]
    }
  }
}

export const WithClassName = {
  args: {
    id: page.id,
    className: 'extra-classname'
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: PageDocument,
            variables: {
              id: page.id
            }
          },
          result: {
            data: {
              page
            }
          }
        }
      ]
    }
  }
}

export const WithEmotion = {
  args: {
    id: page.id,
    css: css`
      background-color: #eee;
    `
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: PageDocument,
            variables: {
              id: page.id
            }
          },
          result: {
            data: {
              page
            }
          }
        }
      ]
    }
  }
}
