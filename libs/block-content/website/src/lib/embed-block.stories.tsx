import {Meta} from '@storybook/react'
import {EmbedBlock} from './embed-block'

export default {
  component: EmbedBlock,
  title: 'Blocks/Embed'
} as Meta

export const Default = {
  args: {
    url: 'https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Fchangeclean%2Fvideos%2F3136062856696319%2F&show_text=false&width=560&t=0',
    title: 'Title',
    width: 560,
    height: 314,
    styleCustom: 'border: none; overflow: hidden;',
    sandbox: ''
  }
}

export const WithClassName = {
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}
