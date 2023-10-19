import {runStorybookTests} from '@wepublish/testing'
import * as stories from './navbar.stories'

describe('Navbar', () => {
  runStorybookTests(stories)
})
