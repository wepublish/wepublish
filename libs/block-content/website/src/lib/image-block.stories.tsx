import {ComponentStory, Meta} from '@storybook/react'
import {ImageBlock} from './image-block'

export default {
  component: ImageBlock,
  title: 'Blocks/Image'
} as Meta

const Template: ComponentStory<typeof ImageBlock> = args => <ImageBlock {...args} />
export const Default = Template.bind({})
Default.args = {
  image: {
    id: '1234',
    createdAt: new Date().toDateString(),
    modifiedAt: new Date().toDateString(),
    extension: '.jpg',
    fileSize: 1,
    format: '',
    height: 500,
    width: 500,
    mimeType: '',
    tags: [],
    description: 'An image description',
    title: 'An image title',
    filename: 'An image filename',
    url: 'https://unsplash.it/500/500'
  },
  caption: 'Image caption'
}

export const WithClassName = Template.bind({})
WithClassName.args = {
  image: {
    id: '1234',
    createdAt: new Date().toDateString(),
    modifiedAt: new Date().toDateString(),
    extension: '.jpg',
    fileSize: 1,
    format: '',
    height: 500,
    width: 500,
    mimeType: '',
    tags: [],
    description: 'An image description',
    title: 'An image title',
    filename: 'An image filename',
    url: 'https://unsplash.it/500/500'
  },
  caption: 'Image caption',
  className: 'extra-classname'
}

export const WithoutDescription = Template.bind({})
WithoutDescription.args = {
  image: {
    id: '1234',
    createdAt: new Date().toDateString(),
    modifiedAt: new Date().toDateString(),
    extension: '.jpg',
    fileSize: 1,
    format: '',
    height: 500,
    width: 500,
    mimeType: '',
    tags: [],
    title: 'An image title',
    filename: 'An image filename',
    url: 'https://unsplash.it/500/500'
  },
  caption: 'Image caption'
}

export const WithoutTitle = Template.bind({})
WithoutTitle.args = {
  image: {
    id: '1234',
    createdAt: new Date().toDateString(),
    modifiedAt: new Date().toDateString(),
    extension: '.jpg',
    fileSize: 1,
    format: '',
    height: 500,
    width: 500,
    mimeType: '',
    tags: [],
    filename: 'An image filename',
    url: 'https://unsplash.it/500/500'
  },
  caption: 'Image caption'
}
