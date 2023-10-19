import {runStorybookContainerTests} from '@wepublish/testing'
import * as stories from './peer-article-container.stories'

describe('PeerArticle Container', () => {
  runStorybookContainerTests(stories, 'ById')
})
