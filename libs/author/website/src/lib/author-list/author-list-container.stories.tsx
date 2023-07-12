import {AuthorListDocument, AuthorQuery} from '@wepublish/website/api'
import {action} from '@storybook/addon-actions'
import {Meta} from '@storybook/react'
import {AuthorListContainer} from './author-list-container'
import {css} from '@emotion/react'

const author = {
  __typename: 'Author',
  id: 'clgp1hfio50331801rejmrk6sj3',
  slug: 'example-slug',
  name: 'Example Name',
  jobTitle: 'Co-Geschäftsleitung & Chefredaktor',
  createdAt: '2023-02-24T09:00:00.000Z',
  modifiedAt: '2023-02-25T07:30:00.000Z',
  url: 'https://example.com',
  bio: [
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
  image: {
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
  }
} as AuthorQuery['author']

export default {
  component: AuthorListContainer,
  title: 'Container/AuthorList'
} as Meta

export const Default = {
  args: {
    onQuery: action('onQuery')
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: AuthorListDocument,
            variables: {}
          },
          result: {
            data: {
              authors: {
                nodes: [author, {...author, id: '2'}, {...author, id: '3'}],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: null,
                  startCursor: null
                }
              }
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
    className: 'extra-classname'
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: AuthorListDocument,
            variables: {}
          },
          result: {
            data: {
              authors: {
                nodes: [author, {...author, id: '2'}, {...author, id: '3'}],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: null,
                  startCursor: null
                }
              }
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
    css: css`
      background-color: #eee;
    `
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: AuthorListDocument,
            variables: {}
          },
          result: {
            data: {
              authors: {
                nodes: [author, {...author, id: '2'}, {...author, id: '3'}],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: null,
                  startCursor: null
                }
              }
            }
          }
        }
      ]
    }
  }
}
