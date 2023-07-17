import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {AuthorQuery} from '@wepublish/website/api'
import {AuthorListItem} from './author-list-item'

const author = {
  __typename: 'Author',
  id: 'clgp1hfio50331801rejmrk6sj3',
  slug: 'slug',
  name: 'Foobar',
  jobTitle: 'Editor',
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
  },
  createdAt: '2023-01-01',
  modifiedAt: '2023-01-01'
} as NonNullable<AuthorQuery['author']>

export default {
  component: AuthorListItem,
  title: 'Components/AuthorListItem'
} as Meta

export const Default = {
  args: {
    author
  }
}

export const WithClassName = {
  args: {
    author,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    author,
    css: css`
      background-color: #eee;
    `
  }
}

export const WithoutJobTitle = {
  args: {
    author: {
      ...author,
      jobTitle: null
    }
  }
}

export const WithoutImage = {
  args: {
    author: {
      ...author,
      image: null
    }
  }
}
