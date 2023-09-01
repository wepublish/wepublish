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
      bigURL: 'https://unsplash.it/800/400',
      largeURL: 'https://unsplash.it/500/300',
      mediumURL: 'https://unsplash.it/300/200',
      smallURL: 'https://unsplash.it/200/100',
      squareBigURL: 'https://unsplash.it/800/800',
      squareLargeURL: 'https://unsplash.it/500/500',
      squareMediumURL: 'https://unsplash.it/300/300',
      squareSmallURL: 'https://unsplash.it/200/200'
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
