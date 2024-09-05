import {Meta} from '@storybook/react'
import {css} from '@emotion/react'
import {FullImageFragment, LinkPageBreakBlock} from '@wepublish/website/api'
import {Banner} from './banner'

export default {
  component: Banner,
  title: 'Blocks/Break/Block Styles/Banner'
} as Meta

const image = {
  id: '1234',
  createdAt: new Date('2023-01-01').toDateString(),
  modifiedAt: new Date('2023-01-01').toDateString(),
  extension: '.jpg',
  fileSize: 1,
  format: '',
  height: 500,
  width: 500,
  mimeType: 'image/jpg',
  tags: [],
  description: 'An image description',
  title: 'An image title',
  filename: 'An image filename',
  url: 'https://unsplash.it/500/500',
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
  __typename: 'LinkPageBreakBlock',
  text: 'Break block test',
  linkText: 'Link Text',
  linkURL: 'https://example.com',
  styleOption: 'default',
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
          text: 'Lorem ipsum dolor sit amet, conseclinkURLtetur adipiscing elit',
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
  hideButton: false,
  templateOption: 'none',
  layoutOption: 'image-left',
  image,
  blockStyle: 'Context Box'
} as LinkPageBreakBlock

export const Default = {
  args: {
    ...breakBlock
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
