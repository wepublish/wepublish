import {ApolloError} from '@apollo/client'
import {Meta} from '@storybook/react'
import {AuthorQuery} from '@wepublish/website/api'
import {Author} from './author'
import {css} from '@emotion/react'
import {BuilderAuthorLinksProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Box} from '@mui/material'

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
  component: Author,
  title: 'Components/Author'
} as Meta

export const Default = {
  args: {
    data: {author}
  }
}

export const WithCustomAuthorLinks = {
  args: {
    data: {author},
    authorLinks: function AuthorLinks({links}: BuilderAuthorLinksProps) {
      const {
        elements: {Link}
      } = useWebsiteBuilder()

      return (
        <Box sx={{display: 'grid', gap: 1, gridTemplateColumns: 'repeat(12, max-content)'}}>
          {links.map((link, index) => (
            <Link key={index} href={link.url} target="__blank" title={link.title}>
              <svg
                viewBox="0 0 100 100"
                width={24}
                height={24}
                style={{justifySelf: 'center'}}
                xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="50" fill="#000" />
              </svg>
            </Link>
          ))}
        </Box>
      )
    }
  }
}

export const WithLoading = {
  args: {
    data: {
      author: null
    },
    loading: true
  }
}

export const WithError = {
  args: {
    data: {
      author: null
    },
    loading: false,
    error: new ApolloError({
      errorMessage: 'Foobar'
    })
  }
}

export const WithClassName = {
  args: {
    data: {author},
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    data: {author},
    css: css`
      background-color: #eee;
    `
  }
}

export const WithoutJobTitle = {
  args: {
    data: {
      author: {
        ...author,
        jobTitle: null
      }
    }
  }
}

export const WithoutImage = {
  args: {
    data: {
      author: {
        ...author,
        image: null
      }
    }
  }
}

export const WithoutBio = {
  args: {
    data: {
      author: {
        ...author,
        bio: null
      }
    }
  }
}

export const WithoutLinks = {
  args: {
    data: {
      author: {
        ...author,
        links: null
      }
    }
  }
}
