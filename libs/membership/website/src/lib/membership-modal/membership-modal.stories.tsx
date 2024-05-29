import {Meta, StoryObj} from '@storybook/react'
import {action} from '@storybook/addon-actions'
import {css} from '@emotion/react'
import {H5, Paragraph} from '@wepublish/ui'
import {MembershipModal} from './membership-modal'

export default {
  component: MembershipModal,
  title: 'Components/MembershipModal'
} as Meta

export const Default: StoryObj = {
  args: {
    open: true,
    onCancel: action('onCancel'),
    onSubmit: action('onSubmit'),
    submitText: 'Submit Text',
    children: (
      <div>
        <H5>Title</H5>
        <Paragraph>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
          sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
          est laborum.
        </Paragraph>
      </div>
    )
  }
}

export const WithClassName: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}

export const WithEmotion: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    css: css`
      background-color: #eee;
    `
  }
}
