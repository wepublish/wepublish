import {runStorybookContainerTests} from '@wepublish/testing/website'
import * as stories from './event-list-container.stories'

describe('EventList Container', () => {
  runStorybookContainerTests(stories)
})
