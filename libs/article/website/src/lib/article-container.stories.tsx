import {action} from '@storybook/addon-actions'
import {ComponentStory, Meta} from '@storybook/react'
import {ArticleDocument, ArticleQuery} from '@wepublish/website/api'
import {ArticleContainer} from './article-container'
import {css} from '@emotion/react'

const article = {
  __typename: 'Article',
  id: 'clgp1hfio50331801rejmrk6sj3',
  slug: 'slug',
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
      image: {
        __typename: 'Image',
        id: 'ljh9FHAvHAs0AxC',
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
        largeURL: 'https://unsplash.it/500/281',
        mediumURL: 'https://unsplash.it/500/281',
        thumbURL: 'https://unsplash.it/500/281',
        squareURL: 'https://unsplash.it/500/281',
        previewURL: 'https://unsplash.it/500/281',
        column1URL: 'https://unsplash.it/500/281',
        column6URL: 'https://unsplash.it/500/281'
      }
    },
    {
      __typename: 'ImageGalleryBlock'
    },
    {
      __typename: 'ListicleBlock'
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
      __typename: 'TeaserGridBlock'
    },
    {
      __typename: 'TeaserGridBlock'
    },
    {
      __typename: 'TeaserGridFlexBlock',
      flexTeasers: [
        {
          alignment: {
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
              filename: 'DSC07717',
              extension: '.JPG',
              title: null,
              description: null,
              width: 4000,
              height: 6000,
              url: 'https://unsplash.it/500/281',
              largeURL: 'https://unsplash.it/500/281',
              mediumURL: 'https://unsplash.it/500/281',
              thumbURL: 'https://unsplash.it/500/281',
              squareURL: 'https://unsplash.it/500/281',
              previewURL: 'https://unsplash.it/500/281',
              column1URL: 'https://unsplash.it/500/281',
              column6URL: 'https://unsplash.it/500/281'
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
                    largeURL: 'https://unsplash.it/500/281',
                    mediumURL: 'https://unsplash.it/500/281',
                    thumbURL: 'https://unsplash.it/500/281',
                    squareURL: 'https://unsplash.it/500/281',
                    previewURL: 'https://unsplash.it/500/281',
                    column1URL: 'https://unsplash.it/500/281',
                    column6URL: 'https://unsplash.it/500/281'
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
          alignment: {
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
                    largeURL: 'https://unsplash.it/500/281',
                    mediumURL: 'https://unsplash.it/500/281',
                    thumbURL: 'https://unsplash.it/500/281',
                    squareURL: 'https://unsplash.it/500/281',
                    previewURL: 'https://unsplash.it/500/281',
                    column1URL: 'https://unsplash.it/500/281',
                    column6URL: 'https://unsplash.it/500/281'
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
          alignment: {
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
              filename: 'DSC07717',
              extension: '.JPG',
              title: null,
              description: null,
              width: 4000,
              height: 6000,
              url: 'https://unsplash.it/500/281',
              largeURL: 'https://unsplash.it/500/281',
              mediumURL: 'https://unsplash.it/500/281',
              thumbURL: 'https://unsplash.it/500/281',
              squareURL: 'https://unsplash.it/500/281',
              previewURL: 'https://unsplash.it/500/281',
              column1URL: 'https://unsplash.it/500/281',
              column6URL: 'https://unsplash.it/500/281'
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
                    createdAt: '2022-10-14T08:26:06.209Z',
                    modifiedAt: '2022-10-17T13:54:22.743Z',
                    filename: '20220522_171501',
                    extension: '.jpg',
                    width: 1814,
                    height: 2419,
                    fileSize: 1559255,
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
                    largeURL: 'https://unsplash.it/500/281',
                    mediumURL: 'https://unsplash.it/500/281',
                    thumbURL: 'https://unsplash.it/500/281',
                    squareURL: 'https://unsplash.it/500/281',
                    previewURL: 'https://unsplash.it/500/281',
                    column1URL: 'https://unsplash.it/500/281',
                    column6URL: 'https://unsplash.it/500/281'
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
                    createdAt: '2022-10-14T08:26:06.209Z',
                    modifiedAt: '2022-10-17T13:54:22.743Z',
                    filename: '20220522_171501',
                    extension: '.jpg',
                    width: 1814,
                    height: 2419,
                    fileSize: 1559255,
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
                    largeURL: 'https://unsplash.it/500/281',
                    mediumURL: 'https://unsplash.it/500/281',
                    thumbURL: 'https://unsplash.it/500/281',
                    squareURL: 'https://unsplash.it/500/281',
                    previewURL: 'https://unsplash.it/500/281',
                    column1URL: 'https://unsplash.it/500/281',
                    column6URL: 'https://unsplash.it/500/281'
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
                    createdAt: '2022-10-14T08:26:06.209Z',
                    modifiedAt: '2022-10-17T13:54:22.743Z',
                    filename: '20220522_171501',
                    extension: '.jpg',
                    width: 1814,
                    height: 2419,
                    fileSize: 1559255,
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
                    largeURL: 'https://unsplash.it/500/281',
                    mediumURL: 'https://unsplash.it/500/281',
                    thumbURL: 'https://unsplash.it/500/281',
                    squareURL: 'https://unsplash.it/500/281',
                    previewURL: 'https://unsplash.it/500/281',
                    column1URL: 'https://unsplash.it/500/281',
                    column6URL: 'https://unsplash.it/500/281'
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
                    largeURL: 'https://unsplash.it/500/281',
                    mediumURL: 'https://unsplash.it/500/281',
                    thumbURL: 'https://unsplash.it/500/281',
                    squareURL: 'https://unsplash.it/500/281',
                    previewURL: 'https://unsplash.it/500/281',
                    column1URL: 'https://unsplash.it/500/281',
                    column6URL: 'https://unsplash.it/500/281'
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
                    largeURL: 'https://unsplash.it/500/281',
                    mediumURL: 'https://unsplash.it/500/281',
                    thumbURL: 'https://unsplash.it/500/281',
                    squareURL: 'https://unsplash.it/500/281',
                    previewURL: 'https://unsplash.it/500/281',
                    column1URL: 'https://unsplash.it/500/281',
                    column6URL: 'https://unsplash.it/500/281'
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
          alignment: {
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
                    createdAt: '2022-10-14T08:26:06.209Z',
                    modifiedAt: '2022-10-17T13:54:22.743Z',
                    filename: '20220522_171501',
                    extension: '.jpg',
                    width: 1814,
                    height: 2419,
                    fileSize: 1559255,
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
                    largeURL: 'https://unsplash.it/500/281',
                    mediumURL: 'https://unsplash.it/500/281',
                    thumbURL: 'https://unsplash.it/500/281',
                    squareURL: 'https://unsplash.it/500/281',
                    previewURL: 'https://unsplash.it/500/281',
                    column1URL: 'https://unsplash.it/500/281',
                    column6URL: 'https://unsplash.it/500/281'
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
                    createdAt: '2022-10-14T08:26:06.209Z',
                    modifiedAt: '2022-10-17T13:54:22.743Z',
                    filename: '20220522_171501',
                    extension: '.jpg',
                    width: 1814,
                    height: 2419,
                    fileSize: 1559255,
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
                    largeURL: 'https://unsplash.it/500/281',
                    mediumURL: 'https://unsplash.it/500/281',
                    thumbURL: 'https://unsplash.it/500/281',
                    squareURL: 'https://unsplash.it/500/281',
                    previewURL: 'https://unsplash.it/500/281',
                    column1URL: 'https://unsplash.it/500/281',
                    column6URL: 'https://unsplash.it/500/281'
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
                    createdAt: '2022-10-14T08:26:06.209Z',
                    modifiedAt: '2022-10-17T13:54:22.743Z',
                    filename: '20220522_171501',
                    extension: '.jpg',
                    width: 1814,
                    height: 2419,
                    fileSize: 1559255,
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
                    largeURL: 'https://unsplash.it/500/281',
                    mediumURL: 'https://unsplash.it/500/281',
                    thumbURL: 'https://unsplash.it/500/281',
                    squareURL: 'https://unsplash.it/500/281',
                    previewURL: 'https://unsplash.it/500/281',
                    column1URL: 'https://unsplash.it/500/281',
                    column6URL: 'https://unsplash.it/500/281'
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
                    largeURL: 'https://unsplash.it/500/281',
                    mediumURL: 'https://unsplash.it/500/281',
                    thumbURL: 'https://unsplash.it/500/281',
                    squareURL: 'https://unsplash.it/500/281',
                    previewURL: 'https://unsplash.it/500/281',
                    column1URL: 'https://unsplash.it/500/281',
                    column6URL: 'https://unsplash.it/500/281'
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
                    largeURL: 'https://unsplash.it/500/281',
                    mediumURL: 'https://unsplash.it/500/281',
                    thumbURL: 'https://unsplash.it/500/281',
                    squareURL: 'https://unsplash.it/500/281',
                    previewURL: 'https://unsplash.it/500/281',
                    column1URL: 'https://unsplash.it/500/281',
                    column6URL: 'https://unsplash.it/500/281'
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
          alignment: {
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
              filename: 'DSC07717',
              extension: '.JPG',
              title: null,
              description: null,
              width: 4000,
              height: 6000,
              url: 'https://unsplash.it/500/281',
              largeURL: 'https://unsplash.it/500/281',
              mediumURL: 'https://unsplash.it/500/281',
              thumbURL: 'https://unsplash.it/500/281',
              squareURL: 'https://unsplash.it/500/281',
              previewURL: 'https://unsplash.it/500/281',
              column1URL: 'https://unsplash.it/500/281',
              column6URL: 'https://unsplash.it/500/281'
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
} as Exclude<ArticleQuery['article'], undefined | null>

export default {
  component: ArticleContainer,
  title: 'Container/Article'
} as Meta

const Template: ComponentStory<typeof ArticleContainer> = args => <ArticleContainer {...args} />

export const ById = Template.bind({})

ById.args = {
  onQuery: action('onQuery'),
  id: article.id
}

ById.parameters = {
  apolloClient: {
    mocks: [
      {
        request: {
          query: ArticleDocument,
          variables: {
            id: article.id
          }
        },
        result: {
          data: {
            article
          }
        }
      }
    ]
  }
}

export const BySlug = Template.bind({})

BySlug.args = {
  onQuery: action('onQuery'),
  slug: article.slug
}

BySlug.parameters = {
  apolloClient: {
    mocks: [
      {
        request: {
          query: ArticleDocument,
          variables: {
            slug: article.slug
          }
        },
        result: {
          data: {
            article
          }
        }
      }
    ]
  }
}

export const WithClassName = Template.bind({})

WithClassName.args = {
  onQuery: action('onQuery'),
  id: article.id,
  className: 'extra-classname'
}

WithClassName.parameters = {
  apolloClient: {
    mocks: [
      {
        request: {
          query: ArticleDocument,
          variables: {
            id: article.id
          }
        },
        result: {
          data: {
            article
          }
        }
      }
    ]
  }
}

export const WithEmotion = Template.bind({})

WithEmotion.args = {
  onQuery: action('onQuery'),
  id: article.id,
  css: css`
    background-color: #eee;
  `
} as any // The css prop comes from the WithConditionalCSSProp type by the Emotion JSX Pragma

WithEmotion.parameters = {
  apolloClient: {
    mocks: [
      {
        request: {
          query: ArticleDocument,
          variables: {
            id: article.id
          }
        },
        result: {
          data: {
            article
          }
        }
      }
    ]
  }
}
