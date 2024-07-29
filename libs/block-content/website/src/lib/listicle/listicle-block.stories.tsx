import {Meta} from '@storybook/react'
import {ListicleBlock} from './listicle-block'
import {css} from '@emotion/react'
import {FullImageFragment} from '@wepublish/website/api'
import {Node} from 'slate'

export default {
  component: ListicleBlock,
  title: 'Blocks/Listicle'
} as Meta

const image = {
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
  xl: 'https://unsplash.it/1200/400',
  l: 'https://unsplash.it/1000/400',
  m: 'https://unsplash.it/800/400',
  s: 'https://unsplash.it/500/300',
  xs: 'https://unsplash.it/300/200',
  xxs: 'https://unsplash.it/200/100',
  xlSquare: 'https://unsplash.it/1200/1200',
  lSquare: 'https://unsplash.it/1000/1000',
  mSquare: 'https://unsplash.it/800/800',
  sSquare: 'https://unsplash.it/500/500',
  xsSquare: 'https://unsplash.it/300/300',
  xxsSquare: 'https://unsplash.it/200/200'
} as FullImageFragment

const text = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
      }
    ]
  }
] as Node[]

export const Default = {
  args: {
    items: [
      {
        title: 'Foobar',
        richText: text,
        image
      },
      {
        title: 'Foobar',
        richText: text,
        image
      },
      {
        title: 'Foobar',
        richText: text,
        image
      },
      {
        title: 'Foobar',
        richText: text,
        image
      }
    ]
  }
}

export const WithClassName = {
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    ...Default.args,
    css: css`
      background-color: #eee;
    `
  }
}

export const WithoutImage = {
  args: {
    items: [
      {
        title: 'Foobar',
        richText: text,
        image
      },
      {
        title: 'Foobar',
        richText: text
      },
      {
        title: 'Foobar',
        richText: text,
        image
      },
      {
        title: 'Foobar',
        richText: text
      }
    ]
  }
}
