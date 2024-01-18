import {runStorybookTests} from '@wepublish/testing/website'
import * as stories from './image-upload.stories'

describe('ImageUpload', () => {
  runStorybookTests(stories)
})
