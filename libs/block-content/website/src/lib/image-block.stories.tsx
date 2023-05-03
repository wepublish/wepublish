import {ComponentStory, Meta} from '@storybook/react'
import {ImageBlock} from './image-block'
import {css} from '@emotion/react'

export default {
  component: ImageBlock,
  title: 'Blocks/Image'
} as Meta

const image = {
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
}

const Template: ComponentStory<typeof ImageBlock> = args => <ImageBlock {...args} />
export const Default = Template.bind({})
Default.args = {
  image,
  caption: 'Image caption'
}

export const WithClassName = Template.bind({})
WithClassName.args = {
  image,
  caption: 'Image caption',
  className: 'extra-classname'
}

export const WithEmotion = Template.bind({})
WithEmotion.args = {
  image,
  css: css`
    background-color: #eee;
  `
} as any // The css prop comes from the WithConditionalCSSProp type by the Emotion JSX Pragma

export const WithoutCaption = Template.bind({})
WithoutCaption.args = {
  image,
  caption: '',
  className: 'extra-classname'
}

export const WithoutDescription = Template.bind({})
WithoutDescription.args = {
  image: {...image, description: undefined},
  caption: 'Image caption'
}

export const WithoutTitle = Template.bind({})
WithoutTitle.args = {
  image: {...image, title: undefined},
  caption: 'Image caption'
}
