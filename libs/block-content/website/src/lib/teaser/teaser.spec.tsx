import {runStorybookTests} from '@wepublish/testing'
import * as articleStories from './teaser.article.stories'
import * as customStories from './teaser.custom.stories'
import * as eventStories from './teaser.event.stories'
import * as pageStories from './teaser.page.stories'
import * as peerArticleStories from './teaser.peer-article.stories'
import * as stories from './teaser.stories'

describe('Teaser', () => {
  runStorybookTests(stories)

  describe('Custom', () => {
    runStorybookTests(customStories)
  })

  describe('Article', () => {
    runStorybookTests(articleStories)
  })

  describe('PeerArticle', () => {
    runStorybookTests(peerArticleStories)
  })

  describe('Page', () => {
    runStorybookTests(pageStories)
  })

  describe('Event', () => {
    runStorybookTests(eventStories)
  })
})
