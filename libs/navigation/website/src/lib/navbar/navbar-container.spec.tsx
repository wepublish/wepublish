import {runStorybookContainerTests} from '@wepublish/testing/website'
import * as stories from './navbar-container.stories'

describe('Navbar Container', () => {
  runStorybookContainerTests(stories)
})
