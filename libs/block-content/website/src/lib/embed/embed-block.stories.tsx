import {Meta} from '@storybook/react'
import {EmbedBlock} from './embed-block'

export default {
  component: EmbedBlock,
  title: 'Blocks/Embed'
} as Meta

export const Default = {
  args: {
    url: 'https://www.example.com',
    title: 'Title',
    width: 560,
    height: 314,
    styleCustom: 'background: #aaa; padding: 50px;',
    sandbox: ''
  }
}

export const WithClassName = {
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}
