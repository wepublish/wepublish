import {Navigation, NavigationProps} from './navigation'
import {NavigationContainer} from './navigation-container'
import {action} from '@storybook/addon-actions'
import {ComponentStory, ComponentMeta} from '@storybook/react'
import {NavigationListDocument} from '@wepublish/website/api'

export default {
  component: Navigation,
  title: 'Navigation'
} as ComponentMeta<typeof Navigation>

const Template = (args: NavigationProps) => <Navigation {...args} />
export const Default = Template.bind({})

const ContainerTemplate: ComponentStory<typeof NavigationContainer> = args => (
  <NavigationContainer {...args} />
)
export const WithContainer = ContainerTemplate.bind({})

WithContainer.args = {
  onQuery: action('onQuery')
}

WithContainer.parameters = {
  apolloClient: {
    mocks: [
      {
        request: {
          query: NavigationListDocument
        },
        result: {
          data: {
            navigations: [
              {
                id: 'cldx7kcpi1168oapxftiqsh0p',
                key: 'main',
                name: 'main',
                links: [
                  {
                    __typename: 'PageNavigationLink',
                    label: 'Home',
                    page: {
                      url: '/'
                    }
                  },
                  {
                    __typename: 'ArticleNavigationLink',
                    label: 'Artikel',
                    article: {
                      url: '/a/abcd'
                    }
                  },
                  {
                    __typename: 'ExternalNavigationLink',
                    label: 'Google',
                    url: 'https://google.com'
                  }
                ]
              }
            ]
          }
        }
      }
    ]
  }
}
