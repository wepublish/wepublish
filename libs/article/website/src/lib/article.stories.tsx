import {Article, ArticleProps} from './article'
import {ArticleContainer} from './article-container'
import {action} from '@storybook/addon-actions'
import {ComponentStory, ComponentMeta} from '@storybook/react'
import {ArticleDocument} from '@wepublish/website/api'

export default {
  component: Article,
  title: 'Article'
} as ComponentMeta<typeof Article>

const Template = (args: ArticleProps) => <Article {...args} />
export const Default = Template.bind({})

const ContainerTemplate: ComponentStory<typeof ArticleContainer> = args => (
  <ArticleContainer {...args} />
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
          query: ArticleDocument
        },
        result: {
          data: {
            article: null
          }
        }
      }
    ]
  }
}
