import {action} from '@storybook/addon-actions'
import {ComponentStory, Meta} from '@storybook/react'
import {Navigation, NavigationListDocument} from '@wepublish/website/api'
import {NavbarContainer} from './navbar-container'

const navigations = [
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
] as Navigation[]

export default {
  component: NavbarContainer,
  title: 'Container/Navbar'
} as Meta

const Template: ComponentStory<typeof NavbarContainer> = args => <NavbarContainer {...args} />
export const Default = Template.bind({})

Default.args = {
  onQuery: action('onQuery')
}

Default.parameters = {
  apolloClient: {
    mocks: [
      {
        request: {
          query: NavigationListDocument
        },
        result: {
          data: {
            navigations
          }
        }
      }
    ]
  }
}

export const WithClassName = Template.bind({})

WithClassName.args = {
  onQuery: action('onQuery'),
  className: 'extra-classname'
}

WithClassName.parameters = {
  apolloClient: {
    mocks: [
      {
        request: {
          query: NavigationListDocument
        },
        result: {
          data: {
            navigations
          }
        }
      }
    ]
  }
}
