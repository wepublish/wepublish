import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {ArticleListItem} from './article-list-item'
import {article} from '../article.stories'

export default {
  component: ArticleListItem,
  title: 'Components/ArticleListItem'
} as Meta

export const Default = {
  args: {
    ...article
  }
}

export const WithClassName = {
  args: {
    ...article,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    ...article,
    css: css`
      background-color: #eee;
    `
  }
}

export const WithoutTitle = {
  args: {
    ...article,
    title: null
  }
}

export const WithoutImage = {
  args: {
    ...article,
    image: null
  }
}
