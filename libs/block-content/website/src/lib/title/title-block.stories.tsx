import {Meta} from '@storybook/react'
import {TitleBlock} from './title-block'
import {css} from '@emotion/react'

export default {
  component: TitleBlock,
  title: 'Blocks/Title'
} as Meta

export const Default = {
  args: {
    title: 'This is a title',
    lead: 'This is a lead'
  }
}

export const WithClassName = {
  args: {
    title: 'This is a title',
    lead: 'This is a lead',
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    title: 'This is a title',
    lead: 'This is a lead',
    css: css`
      background-color: #eee;
    `
  }
}

export const WithoutLead = {
  args: {
    title: 'This is a title',
    lead: ''
  }
}
