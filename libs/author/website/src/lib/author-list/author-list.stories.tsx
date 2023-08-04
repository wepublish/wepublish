import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {action} from '@storybook/addon-actions'
import {AuthorList} from './author-list'
import {ApolloError} from '@apollo/client'
import {author} from '@wepublish/testing/fixtures/graphql'

export default {
  component: AuthorList,
  title: 'Components/AuthorList'
} as Meta

export const Default = {
  args: {
    data: {
      authors: {
        nodes: [
          author,
          {...author, id: '2'},
          {...author, id: '3'},
          {...author, id: '4'},
          {...author, id: '5'},
          {...author, id: '6'},
          {...author, id: '7'},
          {...author, id: '8'},
          {...author, id: '9'},
          {...author, id: '10'},
          {...author, id: '11'}
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
    variables: {},
    onVariablesChange: action('onVariablesChange')
  }
}

export const WithLoading = {
  args: {
    data: undefined,
    loading: true,
    onVariablesChange: action('onVariablesChange')
  }
}

export const WithError = {
  args: {
    data: undefined,
    loading: false,
    error: new ApolloError({
      errorMessage: 'Author list error'
    }),
    onVariablesChange: action('onVariablesChange')
  }
}

export const WithClassName = {
  args: {
    data: {
      events: {
        nodes: [
          author,
          {...author, id: '2'},
          {...author, id: '3'},
          {...author, id: '4'},
          {...author, id: '5'},
          {...author, id: '6'},
          {...author, id: '7'},
          {...author, id: '8'},
          {...author, id: '9'},
          {...author, id: '10'},
          {...author, id: '11'}
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null
        },
        totalCount: 5
      }
    },
    className: 'extra-classname',
    onVariablesChange: action('onVariablesChange')
  }
}

export const WithEmotion = {
  args: {
    data: {
      events: {
        nodes: [
          author,
          {...author, id: '2'},
          {...author, id: '3'},
          {...author, id: '4'},
          {...author, id: '5'},
          {...author, id: '6'},
          {...author, id: '7'},
          {...author, id: '8'},
          {...author, id: '9'},
          {...author, id: '10'},
          {...author, id: '11'}
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null
        },
        totalCount: 5
      }
    },
    css: css`
      background-color: #eee;
    `,
    onVariablesChange: action('onVariablesChange')
  }
}

export const WithoutJobTitle = {
  args: {
    data: {
      authors: {
        nodes: [
          author,
          {...author, id: '2', jobTitle: null},
          {...author, id: '3', jobTitle: null},
          {...author, id: '4'},
          {...author, id: '5'},
          {...author, id: '6', jobTitle: null},
          {...author, id: '7'},
          {...author, id: '8', jobTitle: null},
          {...author, id: '9'},
          {...author, id: '10', jobTitle: null},
          {...author, id: '11'}
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
    variables: {},
    onVariablesChange: action('onVariablesChange')
  }
}

export const WithoutImage = {
  args: {
    data: {
      authors: {
        nodes: [
          author,
          {...author, id: '2', image: null},
          {...author, id: '3', image: null},
          {...author, id: '4'},
          {...author, id: '5'},
          {...author, id: '6', image: null},
          {...author, id: '7', image: null},
          {...author, id: '8'},
          {...author, id: '9'},
          {...author, id: '10', image: null},
          {...author, id: '11'}
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
    variables: {},
    onVariablesChange: action('onVariablesChange')
  }
}
