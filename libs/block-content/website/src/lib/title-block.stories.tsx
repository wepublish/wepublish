import {ComponentStory, Meta} from '@storybook/react'
import {TitleBlock} from './title-block'
import {css} from '@emotion/react'

export default {
  component: TitleBlock,
  title: 'Blocks/Title'
} as Meta

const Template: ComponentStory<typeof TitleBlock> = args => <TitleBlock {...args} />
export const Default = Template.bind({})
Default.args = {
  title: 'This is a title',
  lead: 'This is a lead'
}

export const WithClassName = Template.bind({})
WithClassName.args = {
  title: 'This is a title',
  lead: 'This is a lead',
  className: 'extra-classname'
}

export const WithEmotion = Template.bind({})
WithEmotion.args = {
  title: 'This is a title',
  lead: 'This is a lead',
  css: css`
    background-color: #eee;
  `
} as any // The css prop comes from the WithConditionalCSSProp type by the Emotion JSX Pragma

export const WithoutLead = Template.bind({})
WithoutLead.args = {
  title: 'This is a title',
  lead: ''
}
