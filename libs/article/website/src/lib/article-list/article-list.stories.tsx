import {Meta} from '@storybook/react'
import {ArticleList} from './article-list'
import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'
import {ArticleQuery, FullAuthorFragment, FullImageFragment} from '@wepublish/website/api'

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

const author = {
  __typename: 'Author',
  id: 'clgp1hfio50331801rejmrk6sj3',
  slug: 'slug',
  name: 'Foobar',
  jobTitle: 'Editor',
  url: 'https://example.com',
  createdAt: '2023-04-18T12:38:56.369Z',
  modifiedAt: '2023-04-18T12:38:56.371Z',
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
  image
} as FullAuthorFragment

const article = {
  __typename: 'Article',
  id: 'clgp1hfio50331801rejmrk6sj3',
  title: 'title',
  slug: 'slug',
  url: 'https://example.com',
  authors: [author, {...author, id: '1234'}],
  tags: ['foo', 'bar'],
  breaking: false,
  publishedAt: new Date('2023-01-01').toISOString(),
  image,
  socialMediaImage: image,
  socialMediaTitle: 'socialMediaTitle',
  socialMediaDescription: 'socialMediaDescription',
  lead: 'lead',
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
      __typename: 'LinkPageBreakBlock'
    },
    {
      __typename: 'EmbedBlock'
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
            image: {
              id: 'ljh9FHAvHAs0AxC',
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
              xxsSquare: 'https://unsplash.it/200/200',
              __typename: 'Image'
            },
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
                  image: {
                    id: 'Ca9dRSDJknEtNM6',
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
                  }
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
                  image: {
                    id: 'Ca9dRSDJknEtNM6',
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
            image: {
              id: 'ljh9FHAvHAs0AxC',
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
              xxsSquare: 'https://unsplash.it/200/200',
              __typename: 'Image'
            },
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
            image: {
              id: 'ljh9FHAvHAs0AxC',
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
              xxsSquare: 'https://unsplash.it/200/200',
              __typename: 'Image'
            },
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
      __typename: 'EventBlock'
    }
  ]
} as NonNullable<ArticleQuery['article']>

export default {
  component: ArticleList,
  title: 'Components/ArticleList'
} as Meta

export const Default = {
  args: {
    data: {
      articles: {
        nodes: [
          article,
          {...article, id: '2', title: 'Some longer article title: How will it look like?'},
          {...article, id: '3'},
          {...article, id: '4'},
          {...article, id: '5'},
          {...article, id: '6'},
          {...article, id: '7'},
          {...article, id: '8'},
          {...article, id: '9'},
          {...article, id: '10'},
          {...article, id: '11'}
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null
        },
        totalCount: 11
      }
    },
    variables: {}
  }
}

export const WithLoading = {
  args: {
    data: undefined,
    loading: true
  }
}

export const WithError = {
  args: {
    data: undefined,
    loading: false,
    error: new ApolloError({
      errorMessage: 'Article list error'
    })
  }
}

export const WithClassName = {
  args: {
    data: {
      articles: {
        nodes: [
          article,
          {...article, id: '2', title: 'Some longer article title: How will it look like?'},
          {...article, id: '3'},
          {...article, id: '4'},
          {...article, id: '5'},
          {...article, id: '6'},
          {...article, id: '7'},
          {...article, id: '8'},
          {...article, id: '9'},
          {...article, id: '10'},
          {...article, id: '11'}
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null
        },
        totalCount: 11
      }
    },
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    data: {
      articles: {
        nodes: [
          article,
          {...article, id: '2', title: 'Some longer article title: How will it look like?'},
          {...article, id: '3'},
          {...article, id: '4'},
          {...article, id: '5'},
          {...article, id: '6'},
          {...article, id: '7'},
          {...article, id: '8'},
          {...article, id: '9'},
          {...article, id: '10'},
          {...article, id: '11'}
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null
        },
        totalCount: 11
      }
    },
    css: css`
      background-color: #eee;
    `
  }
}

export const WithoutImage = {
  args: {
    data: {
      articles: {
        nodes: [
          article,
          {...article, id: '2', image: null},
          {...article, id: '3'},
          {...article, id: '4', image: null},
          {...article, id: '5', image: null},
          {...article, id: '6'},
          {...article, id: '7'},
          {...article, id: '8'},
          {...article, id: '9', image: null},
          {...article, id: '10', image: null},
          {...article, id: '11'}
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null
        },
        totalCount: 11
      }
    },
    variables: {}
  }
}
