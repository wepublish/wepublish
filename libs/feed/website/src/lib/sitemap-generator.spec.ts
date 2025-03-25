import {Article} from '@wepublish/website/api'
import {generateSitemap} from './sitemap-generator'
import {mockArticle} from '@wepublish/storybook/mocks'

const pageUrls = ['https://example.com', 'https://example.com/login', 'https://example.com/signup']
const article = mockArticle() as Article

const generate = generateSitemap({
  siteUrl: 'https://wepublish.ch',
  title: 'We.Publish Feed'
})

it('should setup the feed', () => {
  const articles = [mockArticle(), mockArticle()] as Article[]

  expect(generate(articles, pageUrls)).toMatchSnapshot()
})

it('should throw an error if too many ', () => {
  const articles = [] as Article[]

  for (let i = 0; i < 50000; i++) {
    articles.push(article)
  }

  expect(() => generate(articles, pageUrls)).toThrow()
})
