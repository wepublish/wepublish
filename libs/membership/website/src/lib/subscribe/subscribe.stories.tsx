import {ComponentStory, Meta} from '@storybook/react'
import {Subscribe} from './subscribe'

export default {
  component: Subscribe,
  title: 'Subscribe'
} as Meta

const Template: ComponentStory<typeof Subscribe> = args => <Subscribe {...args} />
export const Default = Template.bind({})
