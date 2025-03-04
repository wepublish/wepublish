import {Meta} from '@storybook/react'
import {BreakBlock} from '@wepublish/website/api'
import {Banner} from './banner'
import {mockImage, mockRichText} from '@wepublish/storybook/mocks'

export default {
  component: Banner,
  title: 'Blocks/Break/Block Styles/Banner'
} as Meta

const breakBlock = {
  __typename: 'BreakBlock',
  text: 'Break block test',
  linkText: 'Link Text',
  linkURL: 'https://example.com',
  styleOption: 'default',
  richText: mockRichText(),
  linkTarget: null,
  hideButton: false,
  templateOption: 'none',
  layoutOption: 'image-left',
  image: mockImage(),
  blockStyle: 'Context Box'
} as BreakBlock

export const Default = {
  args: {
    ...breakBlock
  }
}
