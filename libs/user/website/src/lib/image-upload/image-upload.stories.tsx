import {Meta, StoryObj} from '@storybook/react'
import {ImageUpload} from './image-upload'
import {ComponentProps} from 'react'
import {action} from '@storybook/addon-actions'
import {FullImageFragment} from '@wepublish/website/api'

export default {
  component: ImageUpload,
  title: 'Components/Image Upload'
} as Meta<typeof ImageUpload>

export const Default: StoryObj<ComponentProps<typeof ImageUpload>> = {
  args: {
    onUpload: action('onUpload'),
    image: {
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
  }
}

export const NoImage: StoryObj<ComponentProps<typeof ImageUpload>> = {
  ...Default,
  args: {
    ...Default.args,
    image: null
  }
}
