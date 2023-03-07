import {Page, PageProps} from './page'
import {PageContainer} from './page-container'
import {action} from '@storybook/addon-actions'
import {ComponentStory, ComponentMeta} from '@storybook/react'
import {PageDocument} from '@wepublish/website/api'

export default {
  component: Page,
  title: 'Page'
} as ComponentMeta<typeof Page>

const Template = (args: PageProps) => <Page {...args} />
export const Default = Template.bind({})

const ContainerTemplate: ComponentStory<typeof PageContainer> = args => <PageContainer {...args} />
export const WithContainer = ContainerTemplate.bind({})

WithContainer.args = {
  onQuery: action('onQuery')
}

WithContainer.parameters = {
  apolloClient: {
    mocks: [
      {
        request: {
          query: PageDocument
        },
        result: {
          data: {
            page: null
          }
        }
      }
    ]
  }
}
