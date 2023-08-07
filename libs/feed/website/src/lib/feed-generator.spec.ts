import {generateFeed} from './feed-generator'
import {article, author} from '@wepublish/testing/fixtures/graphql'

const generate = generateFeed({
  id: 'https://wepublish.ch',
  copyright: 'We.Publish',
  title: 'We.Publish Feed',
  categories: ['foo', 'bar'],
  author: {
    name: author.name,
    link: author.url
  },
  updated: new Date('2023-01-01')
})

it('should setup the feed', () => {
  const articles = [article, article]

  expect(generate(articles)).toMatchSnapshot()
})

it('should generate the RSS feed', () => {
  const articles = [article, article]

  expect(generate(articles).rss2()).toMatchSnapshot()
})

it('should generate the atom feed', () => {
  const articles = [article, article]

  expect(generate(articles).atom1()).toMatchSnapshot()
})

it('should generate the json feed', () => {
  const articles = [article, article]

  expect(generate(articles).json1()).toMatchSnapshot()
})
