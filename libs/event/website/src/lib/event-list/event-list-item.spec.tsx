import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './event-list-item.stories'

describe('EventListItem', () => {
  runStorybookTests(stories)
})
