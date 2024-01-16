import {runStorybookContainerTests} from '@wepublish/testing/website'
import * as stories from './peer-article-container.stories'

describe('PeerArticle Container', () => {
  runStorybookContainerTests(stories, 'ById')
})
