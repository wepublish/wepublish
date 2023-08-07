import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {AuthorChip} from './author-chip'
import {author} from '@wepublish/testing/fixtures/graphql'

export default {
  component: AuthorChip,
  title: 'Components/Author Chip'
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
