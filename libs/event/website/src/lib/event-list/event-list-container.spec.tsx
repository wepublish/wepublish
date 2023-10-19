import {runStorybookContainerTests} from '@wepublish/testing'
import * as stories from './event-list-container.stories'

describe('EventList Container', () => {
  runStorybookContainerTests(stories)
})
