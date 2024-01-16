import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './image-gallery-block.stories'

describe('Image Gallery Block', () => {
  runStorybookTests(stories)
})
