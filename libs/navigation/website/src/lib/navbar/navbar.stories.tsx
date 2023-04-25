import {ApolloError} from '@apollo/client'
import {ComponentStory, Meta} from '@storybook/react'
import {Navigation} from '@wepublish/website/api'
import {Navbar} from './navbar'

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
  component: Navbar,
  title: 'Navbar'
} as Meta

const Template: ComponentStory<typeof Navbar> = args => <Navbar {...args} />

export const Default = Template.bind({})
Default.args = {
  data: {
    navigations
  },
  loading: false
}

export const WithLoading = Template.bind({})
WithLoading.args = {
  data: {
    navigations: null
  },
  loading: true
}

export const WithError = Template.bind({})
WithError.args = {
  data: {
    navigations: null
  },
  loading: false,
  error: new ApolloError({
    errorMessage: 'Foobar'
  })
}
