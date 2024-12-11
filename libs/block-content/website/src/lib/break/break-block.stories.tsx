import {Meta} from '@storybook/react'
import {BreakBlock} from '../break/break-block'
import {css} from '@emotion/react'
import {FullImageFragment, BreakBlock as BreakBlockType} from '@wepublish/website/api'

export default {
  component: BreakBlock,
  title: 'Blocks/Break'
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

const breakBlock = {
  __typename: 'BreakBlock',
  text: 'Break block test',
  linkText: 'Link Text',
  linkURL: 'https://example.com',
  richText: [
    {
      type: 'paragraph',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'
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
      type: 'heading-three',
      children: [
        {
          text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'
        }
      ]
    },
    {
      type: 'heading-three',
      children: [
        {
          text: ''
        }
      ]
    },
    {
      type: 'paragraph',
      children: [
        {
          bold: true,
          text: ' Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
          italic: true
        },
        {
          text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
          italic: true
        },
        {
          text: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
          italic: true,
          underline: true
        }
      ]
    }
  ],
  linkTarget: null,
  hideButton: true,
  image
} as BreakBlockType

export const Default = {
  args: {
    ...breakBlock
  }
}

export const WithButton = {
  args: {
    ...breakBlock,
    hideButton: false
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

export const WithClassName = {
  ...Default,
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}

export const WithoutImage = {
  args: {
    ...breakBlock,
    image: null
  }
}
