import {Meta} from '@storybook/react'
import {BreakBlock} from '../break/break-block'
import {css} from '@emotion/react'
import {FullImageFragment, LinkPageBreakBlock} from '@wepublish/website/api'

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
  bigURL: 'https://unsplash.it/800/400',
  largeURL: 'https://unsplash.it/500/300',
  mediumURL: 'https://unsplash.it/300/200',
  smallURL: 'https://unsplash.it/200/100',
  squareBigURL: 'https://unsplash.it/800/800',
  squareLargeURL: 'https://unsplash.it/500/500',
  squareMediumURL: 'https://unsplash.it/300/300',
  squareSmallURL: 'https://unsplash.it/200/200'
} as FullImageFragment

const breakBlock = {
  __typename: 'LinkPageBreakBlock',
  text: 'Break block test',
  linkText: 'Link Text',
  linkURL: 'Link URL',
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
  templateOption: 'none',
  layoutOption: 'image-left',
  image
} as LinkPageBreakBlock

export const Default = {
  args: {
    ...breakBlock
  }
}

export const ImageRight = {
  args: {
    ...breakBlock,
    layoutOption: 'image-right'
  }
}

export const WithButton = {
  args: {
    ...breakBlock,
    hideButton: false
  }
}

export const WithClassName = {
  args: {
    ...breakBlock,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    ...breakBlock,
    css: css`
      background-color: #eee;
    `
  }
}

export const WithoutImage = {
  args: {
    ...breakBlock,
    image: null
  }
}

export const WithoutImageRight = {
  args: {
    ...breakBlock,
    image: null,
    layoutOption: 'image-right'
  }
}
