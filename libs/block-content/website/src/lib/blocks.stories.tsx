import styled from '@emotion/styled'
import {Meta, StoryFn} from '@storybook/react'
import {blocks} from '@wepublish/testing/fixtures/graphql'
import {Blocks} from './blocks'

export default {
  component: Blocks,
  title: 'Blocks/Blocks'
} as Meta

export const Default = {
  args: {
    blocks
  }
}

const Layout = styled.div`
  display: grid;
  gap: 24px;
`

const LayoutTemplate: StoryFn<typeof Blocks> = args => (
  <Layout>
    <Blocks {...args} />
  </Layout>
)

export const WithLayout = {
  render: LayoutTemplate,

  args: {
    blocks
  }
}
