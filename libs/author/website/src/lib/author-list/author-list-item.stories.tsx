import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {AuthorListItem} from './author-list-item'
import {author} from '@wepublish/testing/fixtures/graphql'

export default {
  component: AuthorListItem,
  title: 'Components/AuthorList/Item'
} as Meta

export const Default = {
  args: {
    ...author
  }
}

export const WithClassName = {
  args: {
    ...author,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    ...author,
    css: css`
      background-color: #eee;
    `
  }
}

export const WithoutJobTitle = {
  args: {
    ...author,
    jobTitle: null
  }
}

export const WithoutImage = {
  args: {
    ...author,
    image: null
  }
}
