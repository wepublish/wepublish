import {Meta} from '@storybook/react'
import {ImageUpload, ImageUploadProps} from './image-upload'

export default {
  component: ImageUpload,
  title: 'UI/ImageUpload'
} as Meta<typeof ImageUpload>

const Template = (args: ImageUploadProps) => <ImageUpload {...args} />

export const Default = {
  render: Template,
  args: {
    label: 'Label',
    onUpload: input => console.log('input', input),
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
    }
  } as ImageUploadProps
}

export const NoImage = {
  render: Template,
  args: {
    label: 'Label',
    onUpload: input => console.log('input', input),
    image: null
  } as ImageUploadProps
}
