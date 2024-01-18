import {runStorybookContainerTests} from '@wepublish/testing/website'
import * as stories from './event-container.stories'

describe('Event Container', () => {
  runStorybookContainerTests(stories)
})
