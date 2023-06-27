import {action} from '@storybook/addon-actions'
import {Meta} from '@storybook/react'
import {
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
  bigURL: 'https://unsplash.it/800/400',
  largeURL: 'https://unsplash.it/500/300',
  mediumURL: 'https://unsplash.it/300/200',
  smallURL: 'https://unsplash.it/200/100',
  squareBigURL: 'https://unsplash.it/800/800',
  squareLargeURL: 'https://unsplash.it/500/500',
  squareMediumURL: 'https://unsplash.it/300/300',
  squareSmallURL: 'https://unsplash.it/200/200'
} as FullImageFragment

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
  image
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
      __typename: 'EventBlock'
    }
  ]
} as Exclude<PageQuery['page'], undefined | null>

export default {
  component: PageContainer,
  title: 'Container/Page'
} as Meta

export const ById = {
  args: {
    onQuery: action('onQuery'),
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
    onQuery: action('onQuery'),
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

export const WithClassName = {
  args: {
    onQuery: action('onQuery'),
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
    onQuery: action('onQuery'),
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
