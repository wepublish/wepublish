import {Navbar, NavbarProps} from './navbar'
import {NavbarContainer} from './navbar-container'
import {action} from '@storybook/addon-actions'
import {ComponentStory, ComponentMeta} from '@storybook/react'
import {NavigationListDocument} from '@wepublish/website/api'

export default {
  component: Navbar,
  title: 'Navbar'
} as ComponentMeta<typeof Navbar>

const Template = (args: NavbarProps) => <Navbar {...args} />
export const Default = Template.bind({})

const ContainerTemplate: ComponentStory<typeof NavbarContainer> = args => (
  <NavbarContainer {...args} />
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
