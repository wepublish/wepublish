import {runStorybookContainerTests} from '@wepublish/testing'
import * as stories from './navbar-container.stories'

describe('Navbar Container', () => {
  runStorybookContainerTests(stories)
})
