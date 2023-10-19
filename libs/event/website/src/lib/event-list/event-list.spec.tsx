import {runStorybookTests} from '@wepublish/testing'
import * as stories from './event-list.stories'

describe('EventList', () => {
  runStorybookTests(stories)
})
