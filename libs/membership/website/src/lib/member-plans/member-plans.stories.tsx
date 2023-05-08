import {ComponentStory, Meta} from '@storybook/react'
import {MemberPlans} from './member-plans'

export default {
  component: MemberPlans,
  title: 'Components/MemberPlans'
} as Meta

const Template: ComponentStory<typeof MemberPlans> = args => <MemberPlans {...args} />
export const Default = Template.bind({})
