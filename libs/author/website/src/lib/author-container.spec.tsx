import {runStorybookContainerTests} from '@wepublish/testing'
import * as stories from './author-container.stories'

describe('Author Container', () => {
  runStorybookContainerTests(stories, 'ById')
})
