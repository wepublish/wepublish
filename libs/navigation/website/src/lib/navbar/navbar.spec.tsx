import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './navbar.stories'

describe('Navbar', () => {
  runStorybookTests(stories)
})
