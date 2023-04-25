import {ApolloError} from '@apollo/client'
import {ComponentStory, Meta} from '@storybook/react'
import {Navigation} from '@wepublish/website/api'
import {Footer} from './footer'

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
  component: Footer,
  title: 'Footer'
} as Meta

const Template: ComponentStory<typeof Footer> = args => <Footer {...args} />

export const Default = Template.bind({})
Default.args = {
  data: {
    navigation
  },
  loading: false,
  children
}

export const WithLoading = Template.bind({})
WithLoading.args = {
  data: {
    navigation: null
  },
  loading: true,
  children
}

export const WithError = Template.bind({})
WithError.args = {
  data: {
    navigation: null
  },
  loading: false,
  error: new ApolloError({
    errorMessage: 'Foobar'
  }),
  children
}
