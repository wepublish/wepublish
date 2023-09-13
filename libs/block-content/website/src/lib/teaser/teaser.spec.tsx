import {render} from '@testing-library/react'
import * as stories from './teaser.stories'
import * as articleStories from './teaser.article.stories'
import * as peerArticleStories from './teaser.peer-article.stories'
import * as pageStories from './teaser.page.stories'
import * as eventStories from './teaser.event.stories'
import * as customStories from './teaser.custom.stories'
import {composeStories} from '@storybook/react'

const storiesCmp = composeStories(stories)
const customStoriesCmp = composeStories(customStories)
const articleStoriesCmp = composeStories(articleStories)
const peerArticleStoriesCmp = composeStories(peerArticleStories)
const pageStoriesCmp = composeStories(pageStories)
const eventStoriesCmp = composeStories(eventStories)

describe('Teaser', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      const {asFragment} = render(<Component />)
      expect(asFragment()).toMatchSnapshot()
    })
  })

  describe('Custom', () => {
    Object.entries(customStoriesCmp).forEach(([story, Component]) => {
      it(`should render ${story}`, () => {
        const {asFragment} = render(<Component />)
        expect(asFragment()).toMatchSnapshot()
      })
    })
  })

  describe('Article', () => {
    Object.entries(articleStoriesCmp).forEach(([story, Component]) => {
      it(`should render ${story}`, () => {
        const {asFragment} = render(<Component />)
        expect(asFragment()).toMatchSnapshot()
      })
    })
  })

  describe('PeerArticle', () => {
    Object.entries(peerArticleStoriesCmp).forEach(([story, Component]) => {
      it(`should render ${story}`, () => {
        const {asFragment} = render(<Component />)
        expect(asFragment()).toMatchSnapshot()
      })
    })
  })

  describe('Page', () => {
    Object.entries(pageStoriesCmp).forEach(([story, Component]) => {
      it(`should render ${story}`, () => {
        const {asFragment} = render(<Component />)
        expect(asFragment()).toMatchSnapshot()
      })
    })
  })

  describe('Event', () => {
    Object.entries(eventStoriesCmp).forEach(([story, Component]) => {
      it(`should render ${story}`, () => {
        const {asFragment} = render(<Component />)
        expect(asFragment()).toMatchSnapshot()
      })
    })
  })
})
