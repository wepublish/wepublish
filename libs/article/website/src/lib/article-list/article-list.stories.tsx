import {Meta} from '@storybook/react'
import {ArticleList} from './article-list'
import {article} from '../article.stories'
import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'

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
