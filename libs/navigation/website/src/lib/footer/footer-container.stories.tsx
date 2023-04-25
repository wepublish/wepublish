import {action} from '@storybook/addon-actions'
import {ComponentStory, Meta} from '@storybook/react'
import {Navigation, NavigationDocument} from '@wepublish/website/api'
import {FooterContainer} from './footer-container'

const children = (
  <svg
    viewBox="0 0 100 100"
    width={50}
    height={50}
    style={{justifySelf: 'center'}}
    xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="50" fill="#fff" />
  </svg>
)

const navigation = {
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
      label: 'Impressum',
      article: {
        url: '/a/impressum'
      }
    },
    {
      __typename: 'ExternalNavigationLink',
      label: 'FAQ',
      url: 'https://google.com'
    }
  ]
} as Navigation

export default {
  component: FooterContainer,
  title: 'Container/Footer'
} as Meta

const Template: ComponentStory<typeof FooterContainer> = args => <FooterContainer {...args} />
export const Default = Template.bind({})

Default.args = {
  onQuery: action('onQuery'),
  slug: 'footer',
  children
}

Default.parameters = {
  apolloClient: {
    mocks: [
      {
        request: {
          query: NavigationDocument,
          variables: {
            slug: 'footer'
          }
        },
        result: {
          data: {
            navigation
          }
        }
      }
    ]
  }
}

export const WithClassName = Template.bind({})

WithClassName.args = {
  onQuery: action('onQuery'),
  slug: 'footer',
  children,
  className: 'extra-classname'
}

WithClassName.parameters = {
  apolloClient: {
    mocks: [
      {
        request: {
          query: NavigationDocument,
          variables: {
            slug: 'footer'
          }
        },
        result: {
          data: {
            navigation
          }
        }
      }
    ]
  }
}
