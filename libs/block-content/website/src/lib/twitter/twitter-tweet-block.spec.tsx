import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './twitter-tweet-block.stories'

describe('Twitter Tweet Block', () => {
  runStorybookTests(stories)
})
