import {Meta} from '@storybook/react'
import {AuthorLink} from '@wepublish/website/api'
import {css} from '@emotion/react'
import {AuthorLinks} from './author-links'

const links = [
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
  },
  {
    title: 'Mail',
    url: 'mailto:...',
    __typename: 'AuthorLink'
  },
  {
    title: 'Foobar',
    url: 'https://example.com',
    __typename: 'AuthorLink'
  },
  {
    title: 'Presseausweis',
    url: 'https://example.com',
    __typename: 'AuthorLink'
  }
] as AuthorLink[]

export default {
  component: AuthorLinks,
  title: 'Components/AuthorLinks'
} as Meta

export const Default = {
  args: {
    links
  }
}

export const WithClassName = {
  ...Default,
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  ...Default,
  args: {
    ...Default.args,
    css: css`
      background-color: #eee;
    `
  }
}
