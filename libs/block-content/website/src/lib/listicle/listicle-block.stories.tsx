import {Meta} from '@storybook/react'
import {ListicleBlock} from './listicle-block'
import {css} from '@emotion/react'
import {image, text} from '@wepublish/testing/fixtures/graphql'

export default {
  component: ListicleBlock,
  title: 'Blocks/Listicle'
} as Meta

export const Default = {
  args: {
    items: [
      {
        title: 'Foobar',
        richText: text,
        image
      },
      {
        title: 'Foobar',
        richText: text,
        image
      },
      {
        title: 'Foobar',
        richText: text,
        image
      },
      {
        title: 'Foobar',
        richText: text,
        image
      }
    ]
  }
}

export const WithClassName = {
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    ...Default.args,
    css: css`
      background-color: #eee;
    `
  }
}

export const WithoutImage = {
  args: {
    items: [
      {
        title: 'Foobar',
        richText: text,
        image
      },
      {
        title: 'Foobar',
        richText: text
      },
      {
        title: 'Foobar',
        richText: text,
        image
      },
      {
        title: 'Foobar',
        richText: text
      }
    ]
  }
}
