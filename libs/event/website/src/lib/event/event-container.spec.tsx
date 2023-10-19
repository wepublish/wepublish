import {runStorybookContainerTests} from '@wepublish/testing'
import * as stories from './event-container.stories'

describe('Event Container', () => {
  runStorybookContainerTests(stories)
})
