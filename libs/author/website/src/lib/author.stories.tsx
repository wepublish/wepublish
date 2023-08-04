import {ApolloError} from '@apollo/client'
import {Meta} from '@storybook/react'
import {Author} from './author'
import {css} from '@emotion/react'
import {BuilderAuthorLinksProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {Box} from '@mui/material'
import {author} from '@wepublish/testing/fixtures/graphql'

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
