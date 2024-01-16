import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './event-list.stories'

describe('EventList', () => {
  runStorybookTests(stories)
})
