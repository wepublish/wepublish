import {runStorybookTests} from '@wepublish/testing'
import * as stories from './author.stories'

describe('Author', () => {
  runStorybookTests(stories)
})
